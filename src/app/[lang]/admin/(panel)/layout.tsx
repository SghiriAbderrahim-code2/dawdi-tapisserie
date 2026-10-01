import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/supabase/auth";
import { signOutAction } from "../actions";

const tabs = [
  { href: "/admin/orders", key: "orders" },
  { href: "/admin/products", key: "products" },
  { href: "/admin/fabrics", key: "fabrics" },
  { href: "/admin/woods", key: "woods" },
  { href: "/admin/options", key: "options" },
] as const;

export default async function AdminPanelLayout({
  children,
  params,
}: LayoutProps<"/[lang]/admin">) {
  const { lang } = await params;
  await requireAdmin(lang);

  const t = await getTranslations("Admin");
  const tNav = await getTranslations("Nav");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="grid size-9 place-items-center rounded-lg bg-zinc-900 text-base font-bold text-white"
          >
            7
          </Link>
          <div>
            <p className="font-semibold text-zinc-900">{t("title")}</p>
            <p className="text-xs text-zinc-500">{tNav("siteName")}</p>
          </div>
        </div>

        <form action={signOutAction}>
          <button
            type="submit"
            className="min-h-10 rounded-full border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            {t("signOut")}
          </button>
        </form>
      </header>

      <nav className="mt-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            className="min-h-10 rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200"
          >
            {t(tab.key)}
          </Link>
        ))}
      </nav>

      <main className="mt-6">{children}</main>
    </div>
  );
}
