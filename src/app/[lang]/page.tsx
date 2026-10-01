import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ProductGrid } from "@/components/products/product-grid";
import { getCategories, getProducts } from "@/lib/catalog";

export const revalidate = 3600;

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  setRequestLocale(lang);

  const t = await getTranslations("Home");
  const tProducts = await getTranslations("Products");
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(),
  ]);

  const steps = [
    { key: "one", body: "oneBody" },
    { key: "two", body: "twoBody" },
    { key: "three", body: "threeBody" },
  ] as const;

  return (
    <div className="mx-auto w-full max-w-6xl px-4">
      <section className="py-16 text-center sm:py-24">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-5 text-base leading-7 text-zinc-600 sm:text-lg">
            {t("subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/customize"
              className="inline-flex min-h-12 items-center rounded-full bg-amber-800 px-8 text-base font-semibold text-white transition-colors hover:bg-amber-900"
            >
              {t("heroCta")}
            </Link>
            <Link
              href="/products"
              className="inline-flex min-h-12 items-center rounded-full border border-zinc-300 px-8 text-base font-semibold text-zinc-800 transition-colors hover:bg-zinc-100"
            >
              {t("viewAll")}
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-zinc-50 py-14">
        <h2 className="text-center text-2xl font-semibold text-zinc-900">
          {t("steps.title")}
        </h2>
        <ol className="mx-auto mt-8 grid max-w-5xl gap-6 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={step.key}
              className="rounded-2xl border border-zinc-200 bg-white p-6 text-center"
            >
              <span className="mx-auto grid size-10 place-items-center rounded-full bg-amber-800 text-base font-bold text-white">
                {index + 1}
              </span>
              <h3 className="mt-4 font-semibold text-zinc-900">
                {t(`steps.${step.key}`)}
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {t(`steps.${step.body}`)}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-semibold text-zinc-900">
            {t("aboutTitle")}
          </h2>
          <p className="mt-4 text-base leading-7 text-zinc-600">
            {t("aboutBody")}
          </p>
        </div>
      </section>

      <section className="pb-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold text-zinc-900">
            {t("portfolioTitle")}
          </h2>
          <Link
            href="/products"
            className="text-sm font-medium text-amber-800 hover:text-amber-900"
          >
            {t("viewAll")} ←
          </Link>
        </div>
        <div className="mt-6">
          <ProductGrid
            products={products}
            categories={categories}
            emptyMessage={t("emptyPortfolio")}
            filterLabel={tProducts("filterLabel")}
          />
        </div>
      </section>
    </div>
  );
}
