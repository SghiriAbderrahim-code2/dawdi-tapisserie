import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { deleteFabricAction, saveFabricAction } from "../../actions";
import { getFabricsAdmin } from "@/lib/admin-data";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { Fabric } from "@/lib/database.types";
import {
  DbNotice,
  Flash,
  dangerButton,
  inputClass,
  labelClass,
  primaryButton,
  subtleButton,
} from "../ui";

const FABRIC_TYPES: Fabric["fabric_type"][] = [
  "boucle",
  "velvet",
  "chenille",
  "corduroy",
  "leather",
  "linen",
  "jacquard",
  "other",
];

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/admin/fabrics">) {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: "Admin" });
  return { title: t("fabrics") };
}

export default async function AdminFabricsPage({
  params,
  searchParams,
}: PageProps<"/[lang]/admin/fabrics">) {
  const { lang } = await params;
  const { new: isNew, edit, saved, error } = await searchParams;
  setRequestLocale(lang);

  const t = await getTranslations("Admin");
  const configured = isSupabaseConfigured();
  const fabrics = configured ? await getFabricsAdmin() : [];

  const editId = typeof edit === "string" ? Number(edit) : 0;
  const editing = fabrics.find((fabric) => fabric.id === editId) ?? null;
  const showForm = Boolean(isNew || editing);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-zinc-900">{t("fabrics")}</h1>
        <Link href="/admin/fabrics?new=1" className={subtleButton}>
          {t("new")}
        </Link>
      </div>

      <div className="mt-4">
        <Flash saved={saved} error={error} />
      </div>

      {!configured && <DbNotice />}

      {showForm && (
        <form
          action={saveFabricAction}
          encType="multipart/form-data"
          className="mt-6 grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:grid-cols-2"
        >
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <input type="hidden" name="return_to" value="/admin/fabrics" />

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
              name="dominant_color"
              defaultValue={editing?.dominant_color ?? "#C9B99A"}
              className="mt-1 h-11 w-full rounded-xl border border-zinc-300"
            />
          </label>

          <label className={labelClass}>
            {t("type")}
            <select
              name="fabric_type"
              defaultValue={editing?.fabric_type ?? "other"}
              className={inputClass}
            >
              {FABRIC_TYPES.map((value) => (
                <option key={value} value={value}>
                  {value}
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

          <label className={labelClass}>
            {t("thumbnail")}
            <input type="file" name="thumbnail" accept="image/*" className="mt-1 block w-full text-sm" />
          </label>

          <label className={labelClass}>
            {t("texture")}
            <input type="file" name="texture" accept="image/*" className="mt-1 block w-full text-sm" />
          </label>

          <input type="hidden" name="thumbnail_url" value={editing?.thumbnail_url ?? ""} />
          <input type="hidden" name="texture_url" value={editing?.texture_url ?? ""} />

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
            <Link href="/admin/fabrics" className={subtleButton}>
              {t("cancel")}
            </Link>
          </div>
        </form>
      )}

      {configured && fabrics.length === 0 && (
        <p className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center text-sm text-zinc-600">
          {t("empty")}
        </p>
      )}

      {configured && fabrics.length > 0 && (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {fabrics.map((fabric) => (
            <li
              key={fabric.id}
              className="rounded-2xl border border-zinc-200 bg-white p-4"
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="size-10 shrink-0 rounded-full border border-black/10"
                  style={{ backgroundColor: fabric.dominant_color ?? "#C9B99A" }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-zinc-900">{fabric.name}</p>
                  <p className="text-xs text-zinc-500" dir="ltr">
                    {fabric.fabric_type} · #{fabric.sort_order}
                  </p>
                </div>
                <span className="rounded-full bg-zinc-100 px-2 py-1 text-[11px] text-zinc-600">
                  {fabric.is_available ? t("available") : t("hidden")}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-end gap-2">
                <Link
                  href={`/admin/fabrics?edit=${fabric.id}`}
                  className={subtleButton}
                >
                  {t("edit")}
                </Link>
                <form action={deleteFabricAction}>
                  <input type="hidden" name="id" value={fabric.id} />
                  <input type="hidden" name="return_to" value="/admin/fabrics" />
                  <button type="submit" className={dangerButton}>
                    {t("delete")}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
