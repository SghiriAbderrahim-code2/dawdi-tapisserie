import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  deleteOptionGroupAction,
  deleteOptionValueAction,
  saveOptionGroupAction,
  saveOptionValueAction,
} from "../../actions";
import {
  getFurnitureTypesAdmin,
  getOptionGroupsAdmin,
} from "@/lib/admin-data";
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

function str(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/admin/options">) {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: "Admin" });
  return { title: t("options") };
}

export default async function AdminOptionsPage({
  params,
  searchParams,
}: PageProps<"/[lang]/admin/options">) {
  const { lang } = await params;
  const sp = await searchParams;
  setRequestLocale(lang);

  const t = await getTranslations("Admin");
  const configured = isSupabaseConfigured();

  const newGroup = str(sp.new) === "1";
  const editGroupId = Number(str(sp.edit)) || 0;
  const addValueGroupId = Number(str(sp.addValue)) || 0;
  const editValueId = Number(str(sp.editValue)) || 0;
  const selectedId = Number(str(sp.type)) || 0;

  const types = configured ? await getFurnitureTypesAdmin() : [];
  const activeType =
    types.find((type) => type.id === selectedId) ?? types[0] ?? null;
  const groups = activeType ? await getOptionGroupsAdmin(activeType.id) : [];

  const base = `/admin/options?type=${activeType?.id ?? ""}`;
  const editingGroup = groups.find((group) => group.id === editGroupId) ?? null;
  const editingValue = editValueId
    ? groups
        .flatMap((group) => group.option_values)
        .find((value) => value.id === editValueId) ?? null
    : null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-zinc-900">{t("options")}</h1>
        <Link href={`${base}&new=1`} className={subtleButton}>
          {t("new")}
        </Link>
      </div>

      <div className="mt-4">
        <Flash saved={str(sp.saved)} error={str(sp.error)} />
      </div>

      {!configured && <DbNotice />}

      {configured && types.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {types.map((type) => (
            <Link
              key={type.id}
              href={`/admin/options?type=${type.id}`}
              className={`${subtleButton} ${
                activeType?.id === type.id
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : ""
              }`}
            >
              {type.name_ar}
            </Link>
          ))}
        </div>
      )}

      {(newGroup || editingGroup) && activeType && (
        <form
          action={saveOptionGroupAction}
          className="mt-6 grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:grid-cols-2"
        >
          <input type="hidden" name="id" value={editingGroup?.id ?? ""} />
          <input type="hidden" name="return_to" value={base} />
          <input
            type="hidden"
            name="furniture_type_id"
            value={activeType.id}
          />

          <label className={labelClass}>
            {t("group")}
            <input
              name="name_ar"
              required
              defaultValue={editingGroup?.name_ar ?? ""}
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            {t("slug")}
            <input
              name="key"
              required
              dir="ltr"
              defaultValue={editingGroup?.key ?? ""}
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            FR
            <input
              name="name_fr"
              dir="ltr"
              defaultValue={editingGroup?.name_fr ?? ""}
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            {t("sort")}
            <input
              type="number"
              name="sort_order"
              defaultValue={editingGroup?.sort_order ?? 0}
              className={inputClass}
            />
          </label>

          <label className={`${labelClass} flex items-center gap-2`}>
            <input
              type="checkbox"
              name="is_required"
              defaultChecked={editingGroup?.is_required ?? true}
              className="size-4"
            />
            {t("required")}
          </label>

          <div className="flex items-center gap-3 sm:col-span-2">
            <button type="submit" className={primaryButton}>
              {t("save")}
            </button>
            <Link href={base} className={subtleButton}>
              {t("cancel")}
            </Link>
          </div>
        </form>
      )}

      <div className="mt-6 space-y-4">
        {groups.map((group) => {
          const addingValue = addValueGroupId === group.id;
          const valueBeingEdited = editingValue
            ? group.option_values.some((value) => value.id === editingValue.id)
            : false;

          return (
            <section
              key={group.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-zinc-900">
                    {group.name_ar}
                    {group.is_required && (
                      <span className="ms-2 text-xs font-normal text-amber-700">
                        ({t("required")})
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-zinc-400" dir="ltr">
                    {group.key}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`${base}&addValue=${group.id}`}
                    className={subtleButton}
                  >
                    {t("values")}
                  </Link>
                  <Link
                    href={`${base}&edit=${group.id}`}
                    className={subtleButton}
                  >
                    {t("edit")}
                  </Link>
                  <form action={deleteOptionGroupAction}>
                    <input type="hidden" name="id" value={group.id} />
                    <input type="hidden" name="return_to" value={base} />
                    <button type="submit" className={dangerButton}>
                      {t("delete")}
                    </button>
                  </form>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {group.option_values.map((value) => (
                  <span
                    key={value.id}
                    className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5 text-sm text-zinc-700"
                  >
                    {value.name_ar}
                    <Link
                      href={`${base}&editValue=${value.id}`}
                      className="text-xs text-amber-800 hover:underline"
                    >
                      {t("edit")}
                    </Link>
                    <form action={deleteOptionValueAction}>
                      <input type="hidden" name="id" value={value.id} />
                      <input type="hidden" name="return_to" value={base} />
                      <button
                        type="submit"
                        className="text-xs text-red-600 hover:underline"
                      >
                        {t("delete")}
                      </button>
                    </form>
                  </span>
                ))}
              </div>

              {(addingValue || valueBeingEdited) && (
                <form
                  action={saveOptionValueAction}
                  className="mt-4 grid gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:grid-cols-4"
                >
                  <input type="hidden" name="group_id" value={group.id} />
                  <input type="hidden" name="return_to" value={base} />
                  <input
                    type="hidden"
                    name="id"
                    value={valueBeingEdited ? editingValue?.id ?? "" : ""}
                  />

                  <label className={labelClass}>
                    {t("name")}
                    <input
                      name="name_ar"
                      required
                      defaultValue={valueBeingEdited ? editingValue?.name_ar : ""}
                      className={inputClass}
                    />
                  </label>

                  <label className={labelClass}>
                    {t("slug")}
                    <input
                      name="key"
                      required
                      dir="ltr"
                      defaultValue={valueBeingEdited ? editingValue?.key : ""}
                      className={inputClass}
                    />
                  </label>

                  <label className={labelClass}>
                    {t("sort")}
                    <input
                      type="number"
                      name="sort_order"
                      defaultValue={
                        valueBeingEdited ? editingValue?.sort_order : 0
                      }
                      className={inputClass}
                    />
                  </label>

                  <div className="flex items-end gap-2">
                    <button type="submit" className={primaryButton}>
                      {t("save")}
                    </button>
                    <Link href={base} className={subtleButton}>
                      {t("cancel")}
                    </Link>
                  </div>
                </form>
              )}
            </section>
          );
        })}

        {configured && activeType && groups.length === 0 && !newGroup && (
          <p className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center text-sm text-zinc-600">
            {t("empty")}
          </p>
        )}
      </div>
    </div>
  );
}
