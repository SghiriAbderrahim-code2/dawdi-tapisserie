import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCategories } from "@/lib/catalog";
import { deleteProductAction, saveProductAction } from "../../actions";
import { getProductsAdmin } from "@/lib/admin-data";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import {
  DbNotice,
  Flash,
  dangerButton,
  inputClass,
  labelClass,
  primaryButton,
  subtleButton,
} from "../ui";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/admin/products">) {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: "Admin" });
  return { title: t("products") };
}

export default async function AdminProductsPage({
  params,
  searchParams,
}: PageProps<"/[lang]/admin/products">) {
  const { lang } = await params;
  const { new: isNew, edit, saved, error } = await searchParams;
  setRequestLocale(lang);

  const t = await getTranslations("Admin");
  const configured = isSupabaseConfigured();

  const [products, categories] = await Promise.all([
    configured ? getProductsAdmin() : Promise.resolve([]),
    getCategories(),
  ]);

  const editId = typeof edit === "string" ? Number(edit) : 0;
  const editing = products.find((product) => product.id === editId) ?? null;
  const showForm = Boolean(isNew || editing);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-zinc-900">
          {t("products")}
        </h1>
        <Link
          href={editing ? `/admin/products?edit=${editing.id}` : "/admin/products?new=1"}
          className={subtleButton}
        >
          {t("new")}
        </Link>
      </div>

      <div className="mt-4">
        <Flash saved={saved} error={error} />
      </div>

      {!configured && <DbNotice />}

      {showForm && (
        <form
          action={saveProductAction}
          className="mt-6 grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:grid-cols-2"
        >
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <input type="hidden" name="return_to" value="/admin/products" />

          <label className={labelClass}>
            {t("name")}
            <input
              name="name"
              required
              defaultValue={editing?.name ?? ""}
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            {t("slug")}
            <input
              name="slug"
              required
              defaultValue={editing?.slug ?? ""}
              className={inputClass}
              dir="ltr"
            />
          </label>

          <label className={labelClass}>
            {t("category")}
            <select
              name="category_id"
              defaultValue={editing?.category_id ?? categories[0]?.id}
              className={inputClass}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name_ar}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClass}>
            {t("sort")}
            <input
              type="number"
              name="sort_order"
              defaultValue={editing?.sort_order ?? 0}
              className={inputClass}
            />
          </label>

          <label className={`${labelClass} sm:col-span-2`}>
            {t("description")}
            <textarea
              name="description"
              rows={3}
              defaultValue={editing?.description ?? ""}
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-base focus:border-amber-700 focus:outline-none"
            />
          </label>

          <label className={`${labelClass} flex items-center gap-2`}>
            <input
              type="checkbox"
              name="is_visible"
              defaultChecked={editing?.is_visible ?? true}
              className="size-4"
            />
            {t("visible")}
          </label>

          <label className={labelClass}>
            {t("image")}
            <input type="file" name="image" accept="image/*" className="mt-1 block w-full text-sm" />
          </label>

          <div className="flex items-center gap-3 sm:col-span-2">
            <button type="submit" className={primaryButton}>
              {t("save")}
            </button>
            <Link href="/admin/products" className={subtleButton}>
              {t("cancel")}
            </Link>
          </div>
        </form>
      )}

      {configured && products.length === 0 && (
        <p className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center text-sm text-zinc-600">
          {t("empty")}
        </p>
      )}

      {configured && products.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 text-start font-medium text-zinc-500">
                  {t("name")}
                </th>
                <th className="px-4 py-3 text-start font-medium text-zinc-500">
                  {t("slug")}
                </th>
                <th className="px-4 py-3 text-start font-medium text-zinc-500">
                  {t("status")}
                </th>
                <th className="px-4 py-3 text-end font-medium text-zinc-500">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-3 text-zinc-800">{product.name}</td>
                  <td className="px-4 py-3 text-zinc-500" dir="ltr">
                    {product.slug}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                      {product.is_visible ? t("visible") : t("hidden")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/products?edit=${product.id}`}
                        className={subtleButton}
                      >
                        {t("edit")}
                      </Link>
                      <form action={deleteProductAction}>
                        <input type="hidden" name="id" value={product.id} />
                        <input type="hidden" name="return_to" value="/admin/products" />
                        <button type="submit" className={dangerButton}>
                          {t("delete")}
                        </button>
                      </form>
                    </div>
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
