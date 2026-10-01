"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { loginAction, type ActionResult } from "../actions";

export function LoginForm() {
  const t = useTranslations("Admin");
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    loginAction,
    null,
  );

  return (
    <form action={formAction} className="w-full max-w-sm space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700">
          {t("email")}
        </label>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="mt-1 h-11 w-full rounded-xl border border-zinc-300 px-3 text-base focus:border-amber-700 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          {t("password")}
        </label>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="mt-1 h-11 w-full rounded-xl border border-zinc-300 px-3 text-base focus:border-amber-700 focus:outline-none"
        />
      </div>

      {state?.code && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {t(state.code as Parameters<typeof t>[0])}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-zinc-900 px-8 font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-60"
      >
        {pending ? t("signIn") + "…" : t("signIn")}
      </button>
    </form>
  );
}
