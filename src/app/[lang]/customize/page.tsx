import { getTranslations, setRequestLocale } from "next-intl/server";
import { CustomizerClient } from "@/components/customizer/customizer-client";
import type { CatalogByType } from "@/lib/queries";
import {
  getCategories,
  getFabricsForType,
  getFurnitureTypes,
  getOptionGroupsForType,
  getWoods,
} from "@/lib/catalog";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/customize">) {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: "Customizer" });
  return { title: t("title") };
}

export default async function CustomizePage({
  params,
  searchParams,
}: PageProps<"/[lang]/customize">) {
  const { lang } = await params;
  const { type } = await searchParams;
  setRequestLocale(lang);

  const requestedType = typeof type === "string" ? type : null;

  const [categories, types, woods] = await Promise.all([
    getCategories(),
    getFurnitureTypes(),
    getWoods(),
  ]);

  const perType: CatalogByType = {};
  for (const furnitureType of types) {
    perType[furnitureType.slug] = await loadPerType(furnitureType.id);
  }

  const t = await getTranslations("Customizer");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
        {t("title")}
      </h1>
      <div className="mt-8">
        <CustomizerClient
          categories={categories}
          types={types}
          woods={woods}
          perType={perType}
          initialTypeSlug={
            requestedType && perType[requestedType] ? requestedType : null
          }
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
