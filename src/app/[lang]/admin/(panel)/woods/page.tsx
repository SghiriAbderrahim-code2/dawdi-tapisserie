import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { deleteWoodAction, saveWoodAction } from "../../actions";
import { getWoodsAdmin } from "@/lib/admin-data";
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
}: PageProps<"/[lang]/admin/woods">) {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: "Admin" });
  return { title: t("woods") };
}

export default async function AdminWoodsPage({
  params,
  searchParams,
}: PageProps<"/[lang]/admin/woods">) {
  const { lang } = await params;
  const { new: isNew, edit, saved, error } = await searchParams;
  setRequestLocale(lang);

  const t = await getTranslations("Admin");
  const configured = isSupabaseConfigured();
  const woods = configured ? await getWoodsAdmin() : [];

  const editId = typeof edit === "string" ? Number(edit) : 0;
  const editing = woods.find((wood) => wood.id === editId) ?? null;
  const showForm = Boolean(isNew || editing);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-zinc-900">{t("woods")}</h1>
        <Link href="/admin/woods?new=1" className={subtleButton}>
          {t("new")}
        </Link>
      </div>

      <div className="mt-4">
        <Flash saved={saved} error={error} />
      </div>

      {!configured && <DbNotice />}

      {showForm && (
        <form
          action={saveWoodAction}
          className="mt-6 grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:grid-cols-2"
        >
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <input type="hidden" name="return_to" value="/admin/woods" />

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
            {t("color")}
            <input
              type="color"
              name="color_hex"
              defaultValue={editing?.color_hex ?? "#5C4033"}
              className="mt-1 h-11 w-full rounded-xl border border-zinc-300"
            />
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

          <label className={`${labelClass} flex items-center gap-2`}>
            <input
              type="checkbox"
              name="is_available"
              defaultChecked={editing?.is_available ?? true}
              className="size-4"
            />
            {t("available")}
          </label>

          <div className="flex items-center gap-3 sm:col-span-2">
            <button type="submit" className={primaryButton}>
              {t("save")}
            </button>
            <Link href="/admin/woods" className={subtleButton}>
              {t("cancel")}
            </Link>
          </div>
        </form>
      )}

      {configured && woods.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 text-start font-medium text-zinc-500">
                  {t("name")}
                </th>
                <th className="px-4 py-3 text-start font-medium text-zinc-500">
                  {t("color")}
                </th>
                <th className="px-4 py-3 text-start font-medium text-zinc-500">
                  {t("sort")}
                </th>
                <th className="px-4 py-3 text-end font-medium text-zinc-500">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {woods.map((wood) => (
                <tr key={wood.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-3 text-zinc-800">{wood.name}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 text-zinc-600">
                      <span
                        aria-hidden
                        className="size-5 rounded border border-black/10"
                        style={{ backgroundColor: wood.color_hex }}
                      />
                      <span dir="ltr">{wood.color_hex}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{wood.sort_order}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/woods?edit=${wood.id}`}
                        className={subtleButton}
                      >
                        {t("edit")}
                      </Link>
                      <form action={deleteWoodAction}>
                        <input type="hidden" name="id" value={wood.id} />
                        <input type="hidden" name="return_to" value="/admin/woods" />
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
