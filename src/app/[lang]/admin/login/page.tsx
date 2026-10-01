import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import { LoginForm } from "./login-form";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/admin/login">) {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: "Admin" });
  return { title: t("login") };
}

export default async function AdminLoginPage({
  params,
}: PageProps<"/[lang]/admin/login">) {
  const { lang } = await params;
  setRequestLocale(lang);

  const admin = await getCurrentAdmin();
  if (admin) redirect({ href: "/admin/orders", locale: lang });

  const t = await getTranslations("Admin");
  const tNav = await getTranslations("Nav");

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-20">
      <span
        aria-hidden
        className="grid size-12 place-items-center rounded-xl bg-zinc-900 text-xl font-bold text-white"
      >
        7
      </span>
      <h1 className="mt-4 text-2xl font-semibold text-zinc-900">
        {t("title")}
      </h1>
      <p className="mt-1 text-sm text-zinc-500">{tNav("siteName")}</p>

      <div className="mt-8 w-full rounded-3xl border border-zinc-200 bg-white p-6">
        <LoginForm />
      </div>
    </div>
  );
}
