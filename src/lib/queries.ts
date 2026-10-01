import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Category,
  Database,
  Fabric,
  FurnitureType,
  OptionGroup,
  OptionValue,
  Product,
  ProductImage,
  WoodFinish,
} from "./database.types";

export type Db = SupabaseClient<Database, "public">;

/** المنتج مع صوره وفئته — الشكل المستخدم في الواجهة */
export type ProductWithDetails = Product & {
  category: Pick<Category, "slug" | "name_ar" | "name_fr">;
  product_images: ProductImage[];
};

export async function getCategories(db: Db): Promise<Category[]> {
  const { data, error } = await db
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getProducts(
  db: Db,
  categorySlug?: string,
): Promise<ProductWithDetails[]> {
  let query = db
    .from("products")
    .select(
      "*, category:categories(slug, name_ar, name_fr), product_images(*)",
    )
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });

  if (categorySlug) {
    query = query.eq("category.slug", categorySlug);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as unknown as (Product & {
    category: Pick<Category, "slug" | "name_ar" | "name_fr">;
    product_images: ProductImage[];
  })[];

  // الصور: الرئيسية أولًا ثم حسب الترتيب
  return rows.map((row) => ({
    ...row,
    product_images: [...row.product_images].sort((a, b) => {
      if (a.is_main !== b.is_main) return a.is_main ? -1 : 1;
      return a.sort_order - b.sort_order;
    }),
  }));
}

export async function getProductBySlug(
  db: Db,
  slug: string,
): Promise<ProductWithDetails | null> {
  const { data, error } = await db
    .from("products")
    .select("*, category:categories(slug, name_ar, name_fr), product_images(*)")
    .eq("slug", slug)
    .eq("is_visible", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as ProductWithDetails;
  return {
    ...row,
    product_images: [...row.product_images].sort((a, b) => {
      if (a.is_main !== b.is_main) return a.is_main ? -1 : 1;
      return a.sort_order - b.sort_order;
    }),
  };
}

/** منتجات مشابهة — من الفئة نفسها فقط (بدون المنتج الحالي) */
export async function getSimilarProducts(
  db: Db,
  slug: string,
  limit = 4,
): Promise<ProductWithDetails[]> {
  const product = await getProductBySlug(db, slug);
  if (!product) return [];

  const rows = await getProducts(db, product.category.slug);
  return rows.filter((p) => p.slug !== slug).slice(0, limit);
}

export async function getFurnitureTypes(db: Db): Promise<FurnitureType[]> {
  const { data, error } = await db
    .from("furniture_types")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getFurnitureTypeBySlug(
  db: Db,
  slug: string,
): Promise<FurnitureType | null> {
  const { data, error } = await db
    .from("furniture_types")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** الأقمشة المناسبة لنوع أثاث معيّن ( عبر fabric_furniture_types) */
export async function getFabricsForType(
  db: Db,
  furnitureTypeId: number,
): Promise<Fabric[]> {
  const { data, error } = await db
    .from("fabric_furniture_types")
    .select("fabrics(*)")
    .eq("furniture_type_id", furnitureTypeId);
  if (error) throw error;

  return ((data ?? []) as unknown as { fabrics: Fabric }[])
    .map((row) => row.fabrics)
    .filter((fabric) => fabric.is_available)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export async function getWoods(db: Db): Promise<WoodFinish[]> {
  const { data, error } = await db
    .from("wood_finishes")
    .select("*")
    .eq("is_available", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export type OptionGroupWithValues = OptionGroup & {
  option_values: OptionValue[];
};

/** بيانات نوع أثاث واحد: أقمشته + مجموعات خياراته */
export type TypeData = {
  fabrics: Fabric[];
  options: OptionGroupWithValues[];
};

/** خريطة كاملة لكل أنواع الأثاث (slug → بياناته) */
export type CatalogByType = Record<string, TypeData>;

/** مجموعات الخيارات (وقيمها) لنوع أثاث — من schema_v2 */
export async function getOptionGroupsForType(
  db: Db,
  furnitureTypeId: number,
): Promise<OptionGroupWithValues[]> {
  const { data, error } = await db
    .from("option_groups")
    .select("*, option_values(*)")
    .eq("furniture_type_id", furnitureTypeId)
    .order("sort_order", { ascending: true });
  if (error) throw error;

  return ((data ?? []) as unknown as (OptionGroup & {
    option_values: OptionValue[];
  })[]).map((group) => ({
    ...group,
    option_values: group.option_values
      .filter((value) => value.is_available)
      .sort((a, b) => a.sort_order - b.sort_order),
  }));
}
