import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Fabric,
  FurnitureType,
  OptionGroup,
  OptionValue,
  Order,
  OrderItem,
  Product,
  ProductImage,
  WoodFinish,
} from "./database.types";

function admin() {
  return createAdminClient();
}

// ── الطلبات ────────────────────────────────────────────

export type OrderListItem = Order & { item_count: number };

export async function getOrders(status?: string): Promise<OrderListItem[]> {
  let query = admin()
    .from("orders")
    .select("*, order_items(id)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status as Order["status"]);

  const { data, error } = await query;
  if (error) throw error;

  return ((data ?? []) as unknown as (Order & { order_items: { id: string }[] })[]).map(
    (row) => ({
      ...row,
      item_count: row.order_items.length,
    }),
  );
}

export type OrderItemWithNames = OrderItem & {
  furniture_types: { name_ar: string } | null;
  fabrics: { name: string } | null;
  wood_finishes: { name: string } | null;
};

export type OrderDetail = Order & {
  order_items: OrderItemWithNames[];
};

export async function getOrder(id: string): Promise<OrderDetail | null> {
  const { data, error } = await admin()
    .from("orders")
    .select(
      "*, order_items(*, furniture_types(name_ar), fabrics(name), wood_finishes(name))",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as OrderDetail | null;
}

/** روابط موقّتة لصور لقطات التصميم (بالترتيب نفسه للمدخلات) */
export async function signedUrls(
  paths: (string | null | undefined)[],
): Promise<(string | null)[]> {
  return Promise.all(
    paths.map(async (path) => {
      if (!path) return null;
      const { data } = await admin()
        .storage.from("order-snapshots")
        .createSignedUrl(path, 3600);
      return data?.signedUrl ?? null;
    }),
  );
}

export async function updateOrder(
  id: string,
  patch: {
    status?: Order["status"];
    internal_note?: string | null;
    agreed_price?: number | null;
  },
): Promise<void> {
  const { error } = await admin().from("orders").update(patch).eq("id", id);
  if (error) throw error;
}

// ── المنتجات ───────────────────────────────────────────

export type ProductWithImages = Product & { product_images: ProductImage[] };

export async function getProductsAdmin(): Promise<ProductWithImages[]> {
  const { data, error } = await admin()
    .from("products")
    .select("*, product_images(*)")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ProductWithImages[];
}

export type ProductInput = {
  id?: number;
  category_id: number;
  slug: string;
  name: string;
  description?: string | null;
  is_visible?: boolean;
  sort_order?: number;
};

export async function saveProduct(input: ProductInput): Promise<number> {
  const { data, error } = await admin()
    .from("products")
    .upsert(
      input.id
        ? input
        : {
            category_id: input.category_id,
            slug: input.slug,
            name: input.name,
            description: input.description ?? null,
            is_visible: input.is_visible ?? true,
            sort_order: input.sort_order ?? 0,
          },
      { onConflict: "id" },
    )
    .select("id")
    .single();
  if (error) throw error;
  return data.id as number;
}

export async function deleteProduct(id: number): Promise<void> {
  const { error } = await admin().from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function addProductImage(
  productId: number,
  file: File,
  isMain: boolean,
): Promise<void> {
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const path = `product-${productId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await admin()
    .storage.from("products")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) throw uploadError;

  const { data: urlData } = admin()
    .storage.from("products")
    .getPublicUrl(path);

  const { error } = await admin().from("product_images").insert({
    product_id: productId,
    url: urlData.publicUrl,
    alt_text: null,
    is_main: isMain,
    sort_order: 99,
  });
  if (error) throw error;
}

// ── الأقمشة ────────────────────────────────────────────

export async function getFabricsAdmin(): Promise<Fabric[]> {
  const { data, error } = await admin()
    .from("fabrics")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export type FabricInput = {
  id?: number;
  name: string;
  dominant_color?: string | null;
  fabric_type?: Fabric["fabric_type"];
  is_available?: boolean;
  sort_order?: number;
  thumbnail_url?: string;
  texture_url?: string;
};

export async function saveFabric(input: FabricInput): Promise<number> {
  const row = input.id
    ? input
    : {
        name: input.name,
        dominant_color: input.dominant_color ?? null,
        fabric_type: input.fabric_type ?? "other",
        is_available: input.is_available ?? true,
        sort_order: input.sort_order ?? 0,
        thumbnail_url: input.thumbnail_url ?? "",
        texture_url: input.texture_url ?? "",
      };

  const { data, error } = await admin()
    .from("fabrics")
    .upsert(row, { onConflict: "id" })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as number;
}

export async function deleteFabric(id: number): Promise<void> {
  const { error } = await admin().from("fabrics").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadFabricImage(file: File): Promise<string> {
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const path = `fabrics/${crypto.randomUUID()}.${ext}`;
  const { error } = await admin()
    .storage.from("fabrics")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;

  const { data } = admin().storage.from("fabrics").getPublicUrl(path);
  return data.publicUrl;
}

// ── الأخشاب ────────────────────────────────────────────

export async function getWoodsAdmin(): Promise<WoodFinish[]> {
  const { data, error } = await admin()
    .from("wood_finishes")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export type WoodInput = {
  id?: number;
  name: string;
  color_hex: string;
  is_available?: boolean;
  sort_order?: number;
};

export async function saveWood(input: WoodInput): Promise<number> {
  const { data, error } = await admin()
    .from("wood_finishes")
    .upsert(
      input.id
        ? input
        : {
            name: input.name,
            color_hex: input.color_hex,
            is_available: input.is_available ?? true,
            sort_order: input.sort_order ?? 0,
          },
      { onConflict: "id" },
    )
    .select("id")
    .single();
  if (error) throw error;
  return data.id as number;
}

export async function deleteWood(id: number): Promise<void> {
  const { error } = await admin().from("wood_finishes").delete().eq("id", id);
  if (error) throw error;
}

// ── الخيارات ───────────────────────────────────────────

export async function getOptionGroupsAdmin(
  furnitureTypeId: number,
): Promise<(OptionGroup & { option_values: OptionValue[] })[]> {
  const { data, error } = await admin()
    .from("option_groups")
    .select("*, option_values(*)")
    .eq("furniture_type_id", furnitureTypeId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as (OptionGroup & { option_values: OptionValue[] })[];
}

export async function saveOptionGroup(input: {
  id?: number;
  furniture_type_id: number;
  key: string;
  name_ar: string;
  name_fr?: string | null;
  is_required?: boolean;
  sort_order?: number;
}): Promise<number> {
  const { data, error } = await admin()
    .from("option_groups")
    .upsert(input, { onConflict: input.id ? "id" : "furniture_type_id,key" })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as number;
}

export async function deleteOptionGroup(id: number): Promise<void> {
  const { error } = await admin().from("option_groups").delete().eq("id", id);
  if (error) throw error;
}

export async function saveOptionValue(input: {
  id?: number;
  group_id: number;
  key: string;
  name_ar: string;
  name_fr?: string | null;
  is_available?: boolean;
  sort_order?: number;
}): Promise<number> {
  const { data, error } = await admin()
    .from("option_values")
    .upsert(input, { onConflict: input.id ? "id" : "group_id,key" })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as number;
}

export async function deleteOptionValue(id: number): Promise<void> {
  const { error } = await admin().from("option_values").delete().eq("id", id);
  if (error) throw error;
}

export async function getFurnitureTypesAdmin(): Promise<FurnitureType[]> {
  const { data, error } = await admin()
    .from("furniture_types")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
