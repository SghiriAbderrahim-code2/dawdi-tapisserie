import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  isContactConfigured,
  phoneLink,
  siteConfig,
  whatsappLink,
} from "@/lib/site-config";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/contact">) {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: "Contact" });
  return { title: t("title") };
}

export default async function ContactPage({
  params,
}: PageProps<"/[lang]/contact">) {
  const { lang } = await params;
  setRequestLocale(lang);

  const t = await getTranslations("Contact");
  const wa = whatsappLink();
  const tel = phoneLink();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-14">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
        {t("title")}
      </h1>
      <p className="mt-4 max-w-2xl leading-7 text-zinc-600">{t("intro")}</p>

      {!isContactConfigured() && (
        <p className="mt-6 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t("notConfigured")}
        </p>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <a
          href={wa ?? "#"}
          aria-disabled={!wa}
          className={`rounded-2xl border p-6 transition-colors ${
            wa
              ? "border-zinc-200 bg-white hover:border-amber-300 hover:bg-amber-50"
              : "pointer-events-none border-zinc-200 bg-zinc-50 opacity-60"
          }`}
        >
          <h2 className="font-semibold text-zinc-900">{t("whatsappTitle")}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {t("whatsappBody")}
          </p>
          <p className="mt-3 text-sm font-medium text-amber-800">
            {siteConfig.whatsapp || t("notConfigured")}
          </p>
        </a>

        <a
          href={tel ?? "#"}
          aria-disabled={!tel}
          className={`rounded-2xl border p-6 transition-colors ${
            tel
              ? "border-zinc-200 bg-white hover:border-amber-300 hover:bg-amber-50"
              : "pointer-events-none border-zinc-200 bg-zinc-50 opacity-60"
          }`}
        >
          <h2 className="font-semibold text-zinc-900">{t("phoneTitle")}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {t("phoneBody")}
          </p>
          <p className="mt-3 text-sm font-medium text-amber-800">
            {siteConfig.phone || t("notConfigured")}
          </p>
        </a>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:col-span-2">
          <h2 className="font-semibold text-zinc-900">{t("hoursTitle")}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{t("hours")}</p>
        </div>
      </div>

      <div className="mt-10">
        <Link
          href="/customize"
          className="inline-flex min-h-12 items-center rounded-full bg-amber-800 px-8 text-base font-semibold text-white transition-colors hover:bg-amber-900"
        >
          {t("ctaOrder")}
        </Link>
      </div>
    </div>
  );
}
