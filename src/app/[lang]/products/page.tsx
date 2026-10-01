import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductGrid } from "@/components/products/product-grid";
import { getCategories, getProducts } from "@/lib/catalog";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/products">) {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: "Products" });
  return { title: t("title") };
}

export default async function ProductsPage({
  params,
}: PageProps<"/[lang]/products">) {
  const { lang } = await params;
  setRequestLocale(lang);

  const t = await getTranslations("Products");
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-14">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
        {t("title")}
      </h1>
      <div className="mt-8">
        <ProductGrid
          products={products}
          categories={categories}
          emptyMessage={t("empty")}
          filterLabel={t("filterLabel")}
        />
      </div>
    </div>
  );
}
