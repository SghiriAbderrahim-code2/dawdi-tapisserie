import { getTranslations, setRequestLocale } from "next-intl/server";
import type { CatalogByType } from "@/lib/queries";
import {
  getCategories,
  getFabricsForType,
  getFurnitureTypes,
  getOptionGroupsForType,
  getWoods,
} from "@/lib/catalog";
import { ReviewClient } from "./review-client";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/customize/review">) {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: "Order" });
  return { title: t("title") };
}

export default async function ReviewPage({
  params,
}: PageProps<"/[lang]/customize/review">) {
  const { lang } = await params;
  setRequestLocale(lang);

  const t = await getTranslations("Order");

  const [categories, types, woods] = await Promise.all([
    getCategories(),
    getFurnitureTypes(),
    getWoods(),
  ]);

  const perType: CatalogByType = {};
  for (const furnitureType of types) {
    perType[furnitureType.slug] = await loadPerType(furnitureType.id);
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
        {t("title")}
      </h1>
      <div className="mt-8">
        <ReviewClient
          categories={categories}
          types={types}
          woods={woods}
          perType={perType}
        />
      </div>
    </div>
  );
}

async function loadPerType(furnitureTypeId: number) {
  const [fabrics, options] = await Promise.all([
    getFabricsForType(furnitureTypeId),
    getOptionGroupsForType(furnitureTypeId),
  ]);
  return { fabrics, options };
}
