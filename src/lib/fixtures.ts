// بيانات احتياطية تُستخدم عندما لا تكون مفاتيح Supabase متاحة
// (تطابق بيانات الـ seed في supabase/schema.sql + schema_v2.sql)

import type {
  Category,
  Fabric,
  FurnitureType,
  OptionGroup,
  OptionValue,
  Product,
  ProductImage,
  WoodFinish,
} from "./database.types";

export const fixtureCategories: Category[] = [
  { id: 1, slug: "chairs", name_ar: "كراسي", name_fr: "Chaises", sort_order: 1 },
  { id: 2, slug: "beds", name_ar: "أسرّة", name_fr: "Lits", sort_order: 2 },
  { id: 3, slug: "sofas", name_ar: "أرائك", name_fr: "Canapés", sort_order: 3 },
  { id: 4, slug: "tables", name_ar: "طاولات", name_fr: "Tables", sort_order: 4 },
  { id: 5, slug: "other", name_ar: "أخرى", name_fr: "Autres", sort_order: 5 },
];

const baseType = {
  is_round: false,
  is_active: true,
  svg_file: null,
};

export const fixtureFurnitureTypes: FurnitureType[] = [
  {
    ...baseType,
    id: 1,
    category_id: 1,
    slug: "chair",
    name_ar: "كرسي",
    name_fr: "Chaise",
    min_length: 35,
    max_length: 70,
    min_width: 35,
    max_width: 70,
    min_height: 70,
    max_height: 130,
    sort_order: 1,
  },
  {
    ...baseType,
    id: 2,
    category_id: 2,
    slug: "single-bed",
    name_ar: "سرير فردي",
    name_fr: "Lit simple",
    min_length: 180,
    max_length: 220,
    min_width: 80,
    max_width: 120,
    min_height: 30,
    max_height: 60,
    sort_order: 2,
  },
  {
    ...baseType,
    id: 3,
    category_id: 2,
    slug: "double-bed",
    name_ar: "سرير مزدوج",
    name_fr: "Lit double",
    min_length: 180,
    max_length: 220,
    min_width: 130,
    max_width: 220,
    min_height: 30,
    max_height: 60,
    sort_order: 3,
  },
  {
    ...baseType,
    id: 4,
    category_id: 3,
    slug: "sofa",
    name_ar: "أريكة",
    name_fr: "Canapé",
    min_length: 120,
    max_length: 350,
    min_width: 70,
    max_width: 110,
    min_height: 60,
    max_height: 100,
    sort_order: 4,
  },
  {
    ...baseType,
    id: 5,
    category_id: 4,
    slug: "table",
    name_ar: "طاولة",
    name_fr: "Table",
    min_length: 60,
    max_length: 350,
    min_width: 40,
    max_width: 120,
    min_height: 40,
    max_height: 80,
    sort_order: 5,
  },
  {
    ...baseType,
    id: 6,
    category_id: 1,
    slug: "swivel-chair",
    name_ar: "كرسي دوّار",
    name_fr: "Fauteuil pivotant",
    min_length: 70,
    max_length: 100,
    min_width: 70,
    max_width: 100,
    min_height: 70,
    max_height: 90,
    sort_order: 6,
  },
  {
    ...baseType,
    id: 7,
    category_id: 3,
    slug: "round-sofa",
    name_ar: "كنبة دائرية",
    name_fr: "Canapé rond",
    is_round: true,
    min_length: 110,
    max_length: 180,
    min_width: 110,
    max_width: 180,
    min_height: 60,
    max_height: 90,
    sort_order: 7,
  },
  {
    ...baseType,
    id: 8,
    category_id: 3,
    slug: "l-sofa",
    name_ar: "أريكة زاوية L",
    name_fr: "Canapé d'angle",
    min_length: 200,
    max_length: 450,
    min_width: 150,
    max_width: 400,
    min_height: 60,
    max_height: 100,
    sort_order: 8,
  },
  {
    ...baseType,
    id: 9,
    category_id: 5,
    slug: "pouf",
    name_ar: "بوف",
    name_fr: "Pouf",
    is_round: true,
    min_length: 35,
    max_length: 60,
    min_width: 35,
    max_width: 60,
    min_height: 35,
    max_height: 50,
    sort_order: 9,
  },
  {
    ...baseType,
    id: 10,
    category_id: 4,
    slug: "side-table",
    name_ar: "طاولة جانبية",
    name_fr: "Table d'appoint",
    min_length: 30,
    max_length: 70,
    min_width: 30,
    max_width: 70,
    min_height: 35,
    max_height: 70,
    sort_order: 10,
  },
];

export const fixtureWoodFinishes: WoodFinish[] = [
  { id: 1, name: "جوز", color_hex: "#5C4033", is_available: true, sort_order: 1 },
  { id: 2, name: "بلوط", color_hex: "#B08D57", is_available: true, sort_order: 2 },
  { id: 3, name: "أبيض", color_hex: "#F2EFE9", is_available: true, sort_order: 3 },
];

export const fixtureFabrics: Fabric[] = [
  { id: 1, name: "بوكليه كريمي", thumbnail_url: "", texture_url: "", dominant_color: "#D9C7B2", fabric_type: "boucle", code: "B-01", supplier: null, is_print: false, is_available: true, sort_order: 1 },
  { id: 2, name: "مخمل أزرق", thumbnail_url: "", texture_url: "", dominant_color: "#3E5C76", fabric_type: "velvet", code: "V-01", supplier: null, is_print: false, is_available: true, sort_order: 2 },
  { id: 3, name: "شنيلا رمادي", thumbnail_url: "", texture_url: "", dominant_color: "#8D99AE", fabric_type: "chenille", code: "C-01", supplier: null, is_print: false, is_available: true, sort_order: 3 },
  { id: 4, name: "كتّان طبيعي", thumbnail_url: "", texture_url: "", dominant_color: "#C9B99A", fabric_type: "linen", code: "L-01", supplier: null, is_print: false, is_available: true, sort_order: 4 },
  { id: 5, name: "جلد بني", thumbnail_url: "", texture_url: "", dominant_color: "#7B4B2A", fabric_type: "leather", code: "G-01", supplier: null, is_print: false, is_available: true, sort_order: 5 },
  { id: 6, name: "مطبوع هندسي", thumbnail_url: "", texture_url: "", dominant_color: "#EFE7DA", fabric_type: "jacquard", code: "J-01", supplier: null, is_print: true, is_available: true, sort_order: 6 },
];

function makeProduct(
  id: number,
  categorySlug: string,
  slug: string,
  name: string,
  nameFr: string,
  description: string,
): Product & {
  category: Pick<Category, "slug" | "name_ar" | "name_fr">;
  product_images: ProductImage[];
} {
  const category = fixtureCategories.find((c) => c.slug === categorySlug)!;
  return {
    id,
    category_id: category.id,
    slug,
    name,
    description,
    is_visible: true,
    sort_order: id,
    created_at: "2026-01-01T00:00:00+00:00",
    updated_at: "2026-01-01T00:00:00+00:00",
    category: {
      slug: category.slug,
      name_ar: category.name_ar,
      name_fr: category.name_fr,
    },
    product_images: [
      {
        id: id * 10,
        product_id: id,
        url: "/images/placeholder.svg",
        alt_text: name,
        is_main: true,
        sort_order: 1,
      },
    ],
  };
}

export const fixtureProducts = [
  makeProduct(
    1,
    "sofas",
    "l-sofa-modern",
    "أريكة زاوية L — مودرن",
    "Canapé d'angle L — Moderne",
    "أريكة زاوية بخياطة قنوات وقاعدة خشبية، مصممة حسب مقاسك.",
  ),
  makeProduct(
    2,
    "sofas",
    "round-sofa-cozy",
    "كنبة دائرية — دافئة",
    "Canapé rond — Cozy",
    "كنبة دائرية مثالية للزوايا، تُصنع بقماش البوكليه.",
  ),
  makeProduct(
    3,
    "chairs",
    "swivel-chair-velvet",
    "كرسي دوّار — مخمل",
    "Fauteuil pivotant — Velours",
    "كرسي دوّار بظهر مرتفع وخياطة مكعبات منتفخة.",
  ),
  makeProduct(
    4,
    "beds",
    "double-bed-storage",
    "سرير مزدوج — بتخزين",
    "Lit double — Rangement",
    "سرير مزدوج برأس مكابتونيه وتخزين يُرفع.",
  ),
  makeProduct(
    5,
    "beds",
    "single-bed-channels",
    "سرير فردي — خطوط عمودية",
    "Lit simple — Canaux",
    "سرير فردي بخياطة خطوط عمودية وسرير سحّاب اختياري.",
  ),
  makeProduct(
    6,
    "tables",
    "oak-dining-table",
    "طاولة طعام — بلوط",
    "Table à manger — Chêne",
    "طاولة طعام خشب البلوط حتى 350 سم.",
  ),
  makeProduct(
    7,
    "tables",
    "walnut-side-table",
    "طاولة جانبية — جوز",
    "Table d'appoint — Noyer",
    "طاولة جانبية أنيقة بخشب الجوز.",
  ),
  makeProduct(
    8,
    "chairs",
    "classic-chair",
    "كرسي كلاسيك",
    "Chaise classique",
    "كرسي بظهر مرتفع وارتفاع قياسي قابل للتخصيص.",
  ),
  makeProduct(
    9,
    "other",
    "linen-pouf",
    "بوف كتّان",
    "Pouf en lin",
    "بوف صغير مريح، مقاس 35–60 سم.",
  ),
];

type FixtureOptionGroup = OptionGroup & { option_values: OptionValue[] };

export const fixtureOptionGroups: FixtureOptionGroup[] = [
  {
    id: 1,
    furniture_type_id: 3,
    key: "headboard",
    name_ar: "شكل رأس السرير",
    name_fr: "Forme du tête-de-lit",
    is_required: true,
    sort_order: 1,
    option_values: [
      { id: 1, group_id: 1, key: "arched", name_ar: "مقوّس", name_fr: "Arqué", is_available: true, sort_order: 1 },
      { id: 2, group_id: 1, key: "plain", name_ar: "مربّع سادة", name_fr: "Carré", is_available: true, sort_order: 2 },
      { id: 3, group_id: 1, key: "channels", name_ar: "خطوط عمودية", name_fr: "Canaux", is_available: true, sort_order: 3 },
      { id: 4, group_id: 1, key: "tufted", name_ar: "كابتونيه", name_fr: "Capitonnage", is_available: true, sort_order: 4 },
      { id: 5, group_id: 1, key: "winged", name_ar: "مجنّح", name_fr: "Ailé", is_available: true, sort_order: 5 },
    ],
  },
  {
    id: 2,
    furniture_type_id: 3,
    key: "storage",
    name_ar: "التخزين",
    name_fr: "Rangement",
    is_required: true,
    sort_order: 3,
    option_values: [
      { id: 6, group_id: 2, key: "none", name_ar: "بدون", name_fr: "Aucun", is_available: true, sort_order: 1 },
      { id: 7, group_id: 2, key: "lift", name_ar: "غطاء يُرفع", name_fr: "Couvercle relevable", is_available: true, sort_order: 2 },
      { id: 8, group_id: 2, key: "drawers", name_ar: "أدراج", name_fr: "Tiroirs", is_available: true, sort_order: 3 },
    ],
  },
  {
    id: 3,
    furniture_type_id: 8,
    key: "stitch",
    name_ar: "نمط الخياطة",
    name_fr: "Motif de couture",
    is_required: true,
    sort_order: 1,
    option_values: [
      { id: 9, group_id: 3, key: "plain", name_ar: "سادة", name_fr: "Unie", is_available: true, sort_order: 1 },
      { id: 10, group_id: 3, key: "channels", name_ar: "خطوط عمودية", name_fr: "Canaux", is_available: true, sort_order: 2 },
      { id: 11, group_id: 3, key: "puffy", name_ar: "مكعبات منتفخة", name_fr: "Matelassage puffy", is_available: true, sort_order: 3 },
      { id: 12, group_id: 3, key: "ribbed", name_ar: "أخاديد عريضة", name_fr: "Côtes larges", is_available: true, sort_order: 4 },
    ],
  },
];

export function fixtureProductsForCategory(categorySlug?: string) {
  if (!categorySlug) return fixtureProducts;
  return fixtureProducts.filter((p) => p.category.slug === categorySlug);
}

export function fixtureProductBySlug(slug: string) {
  return fixtureProducts.find((p) => p.slug === slug) ?? null;
}

export function fixtureSimilarProducts(slug: string, limit = 4) {
  const product = fixtureProductBySlug(slug);
  if (!product) return [];
  return fixtureProducts
    .filter((p) => p.category.slug === product.category.slug && p.slug !== slug)
    .slice(0, limit);
}

export function fixtureFabricsForType(furnitureTypeId: number) {
  void furnitureTypeId;
  return fixtureFabrics;
}

export function fixtureOptionGroupsForType(furnitureTypeId: number) {
  return fixtureOptionGroups.filter((g) => g.furniture_type_id === furnitureTypeId);
}
