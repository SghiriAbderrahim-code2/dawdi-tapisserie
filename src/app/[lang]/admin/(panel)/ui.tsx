import { getTranslations } from "next-intl/server";

export async function DbNotice() {
  const t = await getTranslations("Admin");
  return (
    <p className="rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      {t("configureDb")}
    </p>
  );
}

type FlashProps = {
  saved?: string | string[] | undefined;
  error?: string | string[] | undefined;
};

function flag(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export async function Flash({ saved, error }: FlashProps) {
  const t = await getTranslations("Admin");
  if (flag(error)) {
    return (
      <p
        role="alert"
        className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {t("loginError")}
      </p>
    );
  }
  if (flag(saved)) {
    return (
      <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        {t("saved")}
      </p>
    );
  }
  return null;
}

export const inputClass =
  "mt-1 h-11 w-full rounded-xl border border-zinc-300 px-3 text-base focus:border-amber-700 focus:outline-none";
export const labelClass = "block text-sm font-medium text-zinc-700";
export const primaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-zinc-800";
export const subtleButton =
  "inline-flex min-h-9 items-center justify-center rounded-full border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-100";
export const dangerButton =
  "inline-flex min-h-9 items-center justify-center rounded-full px-4 text-sm font-medium text-red-600 hover:bg-red-50";
