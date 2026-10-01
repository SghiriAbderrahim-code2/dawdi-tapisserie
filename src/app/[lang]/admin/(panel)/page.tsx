import { redirect } from "@/i18n/navigation";

export default async function AdminIndexPage({
  params,
}: PageProps<"/[lang]/admin">) {
  const { lang } = await params;
  redirect({ href: "/admin/orders", locale: lang });
}
