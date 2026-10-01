import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  getCategories,
  getProductBySlug,
  getProducts,
  getSimilarProducts,
} from "@/lib/catalog";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/products/[slug]">) {
  const { lang, slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: (await getTranslations({ locale: lang, namespace: "Products" }))("notFound") };
  return {
    title: product.name,
    description: product.description ?? undefined,
  };
}

export default async function ProductDetailPage({
  params,
}: PageProps<"/[lang]/products/[slug]">) {
  const { lang, slug } = await params;
  setRequestLocale(lang);

  const t = await getTranslations("Products");
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [categories, similar] = await Promise.all([
    getCategories(),
    getSimilarProducts(slug, 3),
  ]);
  const category = categories.find((c) => c.slug === product.category.slug);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <nav className="text-sm text-zinc-500">
        <Link href="/products" className="hover:text-zinc-900">
          {t("title")}
        </Link>
        <span aria-hidden> / </span>
        <span className="text-zinc-800">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          {product.product_images.map((image, index) => (
            <span
              key={image.id}
              className="relative block aspect-[4/3] w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100"
            >
              <Image
                src={image.url}
                alt={image.alt_text ?? product.name}
                fill
                priority={index === 0}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </span>
          ))}
        </div>

        <div>
          <p className="text-sm text-zinc-500">
            {lang === "fr"
              ? (product.category.name_fr ?? product.category.name_ar)
              : product.category.name_ar}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
            {product.name}
          </h1>

          {product.description && (
            <section className="mt-6">
              <h2 className="text-sm font-semibold text-zinc-900">
                {t("description")}
              </h2>
              <p className="mt-2 leading-7 text-zinc-600">
                {product.description}
              </p>
            </section>
          )}

          {category && (
            <dl className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-zinc-500">{t("category")}</dt>
                <dd className="font-medium text-zinc-800">
                  {lang === "fr"
                    ? (category.name_fr ?? category.name_ar)
                    : category.name_ar}
                </dd>
              </div>
            </dl>
          )}

          <div className="mt-8">
            <Link
              href="/customize"
              className="inline-flex min-h-12 items-center rounded-full bg-amber-800 px-8 text-base font-semibold text-white transition-colors hover:bg-amber-900"
            >
              {t("customize")}
            </Link>
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-16 border-t border-zinc-200 pt-12">
          <h2 className="text-xl font-semibold text-zinc-900">
            {t("similar")}
          </h2>
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((item) => {
              const image = item.product_images[0];
              return (
                <li key={item.slug}>
                  <Link
                    href={`/products/${item.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-shadow hover:shadow-lg"
                  >
                    <span className="relative block aspect-[4/3] w-full bg-zinc-100">
                      <Image
                        src={image?.url ?? "/images/placeholder.svg"}
                        alt={image?.alt_text ?? item.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover"
                      />
                    </span>
                    <span className="flex flex-1 flex-col gap-1 p-4">
                      <span className="font-semibold text-zinc-900 group-hover:text-amber-800">
                        {item.name}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
