import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getOrders as getOrdersAdmin } from "@/lib/admin-data";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/database.types";
import { DbNotice, Flash, subtleButton } from "../ui";

const STATUSES: OrderStatus[] = [
  "new",
  "in_progress",
  "ready",
  "delivered",
  "cancelled",
];

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/admin/orders">) {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: "Admin" });
  return { title: t("orders") };
}

export default async function AdminOrdersPage({
  params,
  searchParams,
}: PageProps<"/[lang]/admin/orders">) {
  const { lang } = await params;
  const { status, saved, error } = await searchParams;
  setRequestLocale(lang);

  const t = await getTranslations("Admin");
  const active = typeof status === "string" ? status : "";

  const orders =
    isSupabaseConfigured() && active
      ? await getOrdersAdmin(active)
      : isSupabaseConfigured()
        ? await getOrdersAdmin()
        : null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-zinc-900">{t("orders")}</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/orders"
            className={`${subtleButton} ${active === "" ? "border-zinc-900 bg-zinc-900 text-white" : ""}`}
          >
            {t("all")}
          </Link>
          {STATUSES.map((value) => (
            <Link
              key={value}
              href={{ href: "/admin/orders", query: { status: value } }}
              className={`${subtleButton} ${active === value ? "border-zinc-900 bg-zinc-900 text-white" : ""}`}
            >
              {t(`status_${value}` as Parameters<typeof t>[0])}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <Flash saved={saved} error={error} />
      </div>

      {!isSupabaseConfigured() && <DbNotice />}

      {orders && orders.length === 0 && (
        <p className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center text-sm text-zinc-600">
          {t("empty")}
        </p>
      )}

      {orders && orders.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-start text-zinc-500">
                <th className="px-4 py-3 text-start font-medium">
                  {t("orders")}
                </th>
                <th className="px-4 py-3 text-start font-medium">
                  {t("customer")}
                </th>
                <th className="px-4 py-3 text-start font-medium">
                  {t("items")}
                </th>
                <th className="px-4 py-3 text-start font-medium">
                  {t("status")}
                </th>
                <th className="px-4 py-3 text-start font-medium">
                  {t("date")}
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-medium text-amber-800 hover:underline"
                    >
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {order.customer_name}
                    <span className="block text-xs text-zinc-400" dir="ltr">
                      {order.phone}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {order.item_count}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                      {t(`status_${order.status}` as Parameters<typeof t>[0])}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
