"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";

const labels: Record<Locale, string> = {
  ar: "العربية",
  fr: "Français",
};

export function LanguageSwitcher() {
  const t = useTranslations("Nav");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(next: Locale) {
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  }

  return (
    <div
      className="flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 p-1"
      role="group"
      aria-label={t("language")}
    >
      {locales.map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          onClick={() => switchTo(code)}
          aria-pressed={code === locale}
          className={`min-h-9 rounded-full px-3 text-sm font-medium transition-colors ${
            code === locale
              ? "bg-zinc-900 text-white"
              : "text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          {labels[code]}
        </button>
      ))}
    </div>
  );
}
