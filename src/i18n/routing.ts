export const locales = ["ar", "fr"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ar";

export const routing = {
  locales,
  defaultLocale,
  // ar بدون بادئة (/products)، fr مع بادئة (/fr/products)
  localePrefix: "as-needed",
  localeDetection: true,
} as const;
