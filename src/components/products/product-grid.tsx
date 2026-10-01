"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Category } from "@/lib/database.types";
import type { ProductWithDetails } from "@/lib/queries";

type Props = {
  products: ProductWithDetails[];
  categories: Category[];
  emptyMessage: string;
  filterLabel: string;
};

function categoryName(category: Category, locale: string) {
  return locale === "fr" ? (category.name_fr ?? category.name_ar) : category.name_ar;
}

export function ProductGrid({
  products,
  categories,
  emptyMessage,
  filterLabel,
}: Props) {
  const t = useTranslations("Home");
  const locale = useLocale();
  const [active, setActive] = useState<string>("all");

  const availableSlugs = useMemo(() => {
    const slugs = new Set(products.map((p) => p.category.slug));
    return categories.filter((c) => slugs.has(c.slug));
  }, [products, categories]);

  const visible =
    active === "all"
      ? products
      : products.filter((p) => p.category.slug === active);

  return (
    <div>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label={filterLabel}
      >
        <button
          type="button"
          onClick={() => setActive("all")}
          className={`min-h-10 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            active === "all"
              ? "bg-zinc-900 text-white"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
          }`}
        >
          {t("filters.all")}
        </button>
        {availableSlugs.map((category) => (
          <button
            key={category.slug}
            type="button"
            onClick={() => setActive(category.slug)}
            className={`min-h-10 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              active === category.slug
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            {categoryName(category, locale)}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center text-sm text-zinc-600">
          {emptyMessage}
        </p>
      ) : (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((product) => {
            const image = product.product_images[0];
            return (
              <li key={product.slug}>
                <Link
                  href={`/products/${product.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-shadow hover:shadow-lg"
                >
                  <span className="relative block aspect-[4/3] w-full bg-zinc-100">
                    <Image
                      src={image?.url ?? "/images/placeholder.svg"}
                      alt={image?.alt_text ?? product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </span>
                  <span className="flex flex-1 flex-col gap-1 p-4">
                    <span className="text-xs text-zinc-500">
                      {locale === "fr"
                        ? (product.category.name_fr ?? product.category.name_ar)
                        : product.category.name_ar}
                    </span>
                    <span className="font-semibold text-zinc-900 group-hover:text-amber-800">
                      {product.name}
                    </span>
                    {product.description && (
                      <span className="line-clamp-2 text-sm leading-6 text-zinc-600">
                        {product.description}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
