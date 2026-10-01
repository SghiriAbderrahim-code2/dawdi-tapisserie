"use server";

import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { redirect } from "@/i18n/navigation";
import { isSupabaseConfigured, createClient } from "@/lib/supabase/server";

export type ActionResult = { code?: string } | null;

// ── الدخول والخروج ─────────────────────────────────────

export async function loginAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const locale = await getLocale();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { code: "loginError" };
  if (!isSupabaseConfigured()) return { code: "configureDb" };

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return { code: "loginError" };

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    await supabase.auth.signOut();
    return { code: "notAdmin" };
  }

  redirect({ href: "/admin/orders", locale });
  return null;
}

export async function signOutAction(): Promise<void> {
  const locale = await getLocale();
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect({ href: "/admin/login", locale });
}

// ── أدوات مشتركة لطرق التحويل ──────────────────────────

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function bool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function int(formData: FormData, key: string, fallback = 0): number {
  const value = Number(str(formData, key));
  return Number.isFinite(value) ? Math.trunc(value) : fallback;
}

function fileOf(formData: FormData, key: string): File | null {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

/** وجهة العودة بعد الحفظ (return_to) مع علامة saved/error */
function target(
  formData: FormData,
  fallback: string,
  flag?: "saved" | "error",
): string {
  const raw = String(formData.get("return_to") ?? "");
  const base = raw.startsWith("/") ? raw : fallback;
  if (!flag) return base;
  const join = base.includes("?") ? "&" : "?";
  return `${base}${join}${flag}=1`;
}

async function go(formData: FormData, href: string): Promise<void> {
  const locale = await getLocale();
  redirect({ href, locale });
}

function mark(path: string) {
  revalidatePath(path, "layout");
}

// ── الطلبات ────────────────────────────────────────────

export async function updateOrderAction(formData: FormData): Promise<void> {
  const id = str(formData, "id");
  const fallback = id ? `/admin/orders/${id}` : "/admin/orders";
  let href = target(formData, fallback, "error");

  if (id) {
    try {
      const { updateOrder } = await import("@/lib/admin-data");
      await updateOrder(id, {
        status: (str(formData, "status") || undefined) as never,
        internal_note: str(formData, "internal_note") || null,
        agreed_price: str(formData, "agreed_price")
          ? Number(str(formData, "agreed_price"))
          : null,
      });
      mark("/[lang]/admin/orders");
      href = target(formData, fallback, "saved");
    } catch {
      href = target(formData, fallback, "error");
    }
  }

  await go(formData, href);
}

// ── المنتجات ───────────────────────────────────────────

export async function saveProductAction(formData: FormData): Promise<void> {
  const fallback = "/admin/products";
  let href = target(formData, fallback, "error");

  try {
    const { saveProduct, addProductImage } = await import("@/lib/admin-data");
    const productId = await saveProduct({
      id: int(formData, "id", 0) || undefined,
      category_id: int(formData, "category_id"),
      slug: str(formData, "slug"),
      name: str(formData, "name"),
      description: str(formData, "description") || null,
      is_visible: bool(formData, "is_visible"),
      sort_order: int(formData, "sort_order"),
    });
    const image = fileOf(formData, "image");
    if (image) await addProductImage(productId, image, true);
    mark("/[lang]/admin/products");
    href = target(formData, fallback, "saved");
  } catch {
    href = target(formData, fallback, "error");
  }

  await go(formData, href);
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  const fallback = "/admin/products";
  let href = target(formData, fallback, "error");
  try {
    const { deleteProduct } = await import("@/lib/admin-data");
    await deleteProduct(int(formData, "id"));
    mark("/[lang]/admin/products");
    href = target(formData, fallback);
  } catch {
    href = target(formData, fallback, "error");
  }
  await go(formData, href);
}

// ── الأقمشة ────────────────────────────────────────────

export async function saveFabricAction(formData: FormData): Promise<void> {
  const fallback = "/admin/fabrics";
  let href = target(formData, fallback, "error");

  try {
    const { saveFabric, uploadFabricImage } = await import("@/lib/admin-data");
    let thumbnailUrl = str(formData, "thumbnail_url");
    let textureUrl = str(formData, "texture_url");
    const thumbnail = fileOf(formData, "thumbnail");
    const texture = fileOf(formData, "texture");
    if (thumbnail) thumbnailUrl = await uploadFabricImage(thumbnail);
    if (texture) textureUrl = await uploadFabricImage(texture);

    await saveFabric({
      id: int(formData, "id", 0) || undefined,
      name: str(formData, "name"),
      dominant_color: str(formData, "dominant_color") || null,
      fabric_type: (str(formData, "fabric_type") || "other") as never,
      is_available: bool(formData, "is_available"),
      sort_order: int(formData, "sort_order"),
      thumbnail_url: thumbnailUrl,
      texture_url: textureUrl,
    });
    mark("/[lang]/admin/fabrics");
    href = target(formData, fallback, "saved");
  } catch {
    href = target(formData, fallback, "error");
  }

  await go(formData, href);
}

export async function deleteFabricAction(formData: FormData): Promise<void> {
  const fallback = "/admin/fabrics";
  let href = target(formData, fallback, "error");
  try {
    const { deleteFabric } = await import("@/lib/admin-data");
    await deleteFabric(int(formData, "id"));
    mark("/[lang]/admin/fabrics");
    href = target(formData, fallback);
  } catch {
    href = target(formData, fallback, "error");
  }
  await go(formData, href);
}

// ── الأخشاب ────────────────────────────────────────────

export async function saveWoodAction(formData: FormData): Promise<void> {
  const fallback = "/admin/woods";
  let href = target(formData, fallback, "error");

  try {
    const { saveWood } = await import("@/lib/admin-data");
    await saveWood({
      id: int(formData, "id", 0) || undefined,
      name: str(formData, "name"),
      color_hex: str(formData, "color_hex") || "#5C4033",
      is_available: bool(formData, "is_available"),
      sort_order: int(formData, "sort_order"),
    });
    mark("/[lang]/admin/woods");
    href = target(formData, fallback, "saved");
  } catch {
    href = target(formData, fallback, "error");
  }

  await go(formData, href);
}

export async function deleteWoodAction(formData: FormData): Promise<void> {
  const fallback = "/admin/woods";
  let href = target(formData, fallback, "error");
  try {
    const { deleteWood } = await import("@/lib/admin-data");
    await deleteWood(int(formData, "id"));
    mark("/[lang]/admin/woods");
    href = target(formData, fallback);
  } catch {
    href = target(formData, fallback, "error");
  }
  await go(formData, href);
}

// ── الخيارات ───────────────────────────────────────────

const OPTIONS_HREF = "/admin/options";

export async function saveOptionGroupAction(formData: FormData): Promise<void> {
  let href = target(formData, OPTIONS_HREF, "error");
  try {
    const { saveOptionGroup } = await import("@/lib/admin-data");
    await saveOptionGroup({
      id: int(formData, "id", 0) || undefined,
      furniture_type_id: int(formData, "furniture_type_id"),
      key: str(formData, "key"),
      name_ar: str(formData, "name_ar"),
      name_fr: str(formData, "name_fr") || null,
      is_required: bool(formData, "is_required"),
      sort_order: int(formData, "sort_order"),
    });
    mark("/[lang]/admin/options");
    href = target(formData, OPTIONS_HREF, "saved");
  } catch {
    href = target(formData, OPTIONS_HREF, "error");
  }
  await go(formData, href);
}

export async function deleteOptionGroupAction(formData: FormData): Promise<void> {
  let href = target(formData, OPTIONS_HREF, "error");
  try {
    const { deleteOptionGroup } = await import("@/lib/admin-data");
    await deleteOptionGroup(int(formData, "id"));
    mark("/[lang]/admin/options");
    href = target(formData, OPTIONS_HREF);
  } catch {
    href = target(formData, OPTIONS_HREF, "error");
  }
  await go(formData, href);
}

export async function saveOptionValueAction(formData: FormData): Promise<void> {
  let href = target(formData, OPTIONS_HREF, "error");
  try {
    const { saveOptionValue } = await import("@/lib/admin-data");
    await saveOptionValue({
      id: int(formData, "id", 0) || undefined,
      group_id: int(formData, "group_id"),
      key: str(formData, "key"),
      name_ar: str(formData, "name_ar"),
      name_fr: str(formData, "name_fr") || null,
      is_available: bool(formData, "is_available"),
      sort_order: int(formData, "sort_order"),
    });
    mark("/[lang]/admin/options");
    href = target(formData, OPTIONS_HREF, "saved");
  } catch {
    href = target(formData, OPTIONS_HREF, "error");
  }
  await go(formData, href);
}

export async function deleteOptionValueAction(formData: FormData): Promise<void> {
  let href = target(formData, OPTIONS_HREF, "error");
  try {
    const { deleteOptionValue } = await import("@/lib/admin-data");
    await deleteOptionValue(int(formData, "id"));
    mark("/[lang]/admin/options");
    href = target(formData, OPTIONS_HREF);
  } catch {
    href = target(formData, OPTIONS_HREF, "error");
  }
  await go(formData, href);
}
