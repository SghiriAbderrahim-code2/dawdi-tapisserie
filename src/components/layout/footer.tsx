import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const links = [
  { href: "/", key: "home" },
  { href: "/products", key: "products" },
  { href: "/customize", key: "orderNow" },
  { href: "/contact", key: "contact" },
] as const;

export function Footer() {
  const t = useTranslations("Footer");
  const tNav = useTranslations("Nav");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-lg font-semibold text-zinc-900">
            {tNav("siteName")}
          </p>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {t("tagline")}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-zinc-900">
            {t("quickLinks")}
          </p>
          <ul className="mt-3 space-y-2">
            {links.map((link) => (
              <li key={link.key}>
                <Link
                  href={link.href}
                  className="text-sm text-zinc-600 hover:text-zinc-900"
                >
                  {tNav(link.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-zinc-900">
            {t("contactTitle")}
          </p>
          <p className="mt-3 text-sm text-zinc-600">{t("whatsapp")}</p>
        </div>
      </div>

      <div className="border-t border-zinc-200 py-4">
        <p className="mx-auto w-full max-w-6xl px-4 text-xs text-zinc-500">
          © {year} {tNav("siteName")} — {t("rights")}
        </p>
      </div>
    </footer>
  );
}
