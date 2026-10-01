import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getOrder, signedUrls } from "@/lib/admin-data";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/database.types";
import { updateOrderAction } from "../../../actions";
import {
  DbNotice,
  Flash,
  inputClass,
  labelClass,
  primaryButton,
} from "../../ui";

const STATUSES: OrderStatus[] = [
  "new",
  "in_progress",
  "ready",
  "delivered",
  "cancelled",
];

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/admin/orders/[id]">) {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: "Admin" });
  return { title: t("orders") };
}

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: PageProps<"/[lang]/admin/orders/[id]">) {
  const { lang, id } = await params;
  const { saved, error } = await searchParams;
  setRequestLocale(lang);

  const t = await getTranslations("Admin");

  if (!isSupabaseConfigured()) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">{t("orders")}</h1>
        <div className="mt-4">
          <DbNotice />
        </div>
      </div>
    );
  }

  const order = await getOrder(id);
  if (!order) {
    return (
      <div>
        <p className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center text-sm text-zinc-600">
          {t("empty")}
        </p>
        <Link href="/admin/orders" className="mt-4 inline-block text-sm text-amber-800">
          ← {t("back")}
        </Link>
      </div>
    );
  }

  const urls = await signedUrls(order.order_items.map((item) => item.snapshot_path));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-zinc-900">
          {order.order_number}
        </h1>
        <Link href="/admin/orders" className="text-sm text-amber-800 hover:underline">
          ← {t("back")}
        </Link>
      </div>

      <div className="mt-4">
        <Flash saved={saved} error={error} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {order.order_items.map((item, index) => (
            <div
              key={item.id}
              className="rounded-2xl border border-zinc-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-zinc-900">
                    {item.furniture_types?.name_ar ?? `#${item.furniture_type_id}`}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">
                    {item.length_cm} × {item.width_cm} × {item.height_cm} cm · ×
                    {item.quantity}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {[item.fabrics?.name, item.wood_finishes?.name]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>

              {urls[index] && (
                <a
                  href={urls[index]!}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 block overflow-hidden rounded-xl border border-zinc-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={urls[index]!}
                    alt={t("snapshot")}
                    className="h-auto w-full max-w-md"
                  />
                </a>
              )}
            </div>
          ))}
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <h2 className="font-semibold text-zinc-900">{t("customer")}</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-zinc-400">{t("customer")}</dt>
                <dd className="text-zinc-800">{order.customer_name}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-zinc-400">{t("phone")}</dt>
                <dd className="text-zinc-800" dir="ltr">
                  {order.phone}
                </dd>
              </div>
              {order.address && (
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-400">{t("address")}</dt>
                  <dd className="text-zinc-800">{order.address}</dd>
                </div>
              )}
              {order.notes && (
                <div className="flex gap-3">
                  <dt className="shrink-0 text-zinc-400">{t("notes")}</dt>
                  <dd className="text-zinc-800">{order.notes}</dd>
                </div>
              )}
              {order.budget && (
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-400">{t("budget")}</dt>
                  <dd className="text-zinc-800">{order.budget}</dd>
                </div>
              )}
            </dl>
          </div>

          <form
            action={updateOrderAction}
            className="rounded-2xl border border-zinc-200 bg-white p-5"
          >
            <h2 className="font-semibold text-zinc-900">{t("updateStatus")}</h2>
            <input type="hidden" name="id" value={order.id} />
            <input type="hidden" name="return_to" value={`/admin/orders/${order.id}`} />

            <label className={`${labelClass} mt-4 block`}>
              {t("status")}
              <select
                name="status"
                defaultValue={order.status}
                className={inputClass}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {t(`status_${status}` as Parameters<typeof t>[0])}
                  </option>
                ))}
              </select>
            </label>

            <label className={`${labelClass} mt-4 block`}>
              {t("internalNote")}
              <textarea
                name="internal_note"
                defaultValue={order.internal_note ?? ""}
                rows={3}
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-base focus:border-amber-700 focus:outline-none"
              />
            </label>

            <label className={`${labelClass} mt-4 block`}>
              {t("agreedPrice")}
              <input
                type="number"
                name="agreed_price"
                defaultValue={order.agreed_price ?? ""}
                className={inputClass}
              />
            </label>

            <button type="submit" className={`${primaryButton} mt-5 w-full`}>
              {t("save")}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
