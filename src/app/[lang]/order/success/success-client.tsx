"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

const STORAGE_KEY = "order_number";

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getOrderNumber(): string | null {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getServerOrderNumber(): string | null {
  return null;
}

export function OrderSuccessClient() {
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const orderNumber = useSyncExternalStore(
    subscribe,
    getOrderNumber,
    getServerOrderNumber,
  );

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-24 text-center">
      <span
        aria-hidden
        className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-600 text-2xl text-white"
      >
        ✓
      </span>
      {orderNumber && (
        <p className="mt-6 text-lg font-semibold text-zinc-900">{orderNumber}</p>
      )}
      <p className="mt-4 text-zinc-600">{tCommon("comingSoon")}</p>
      <button
        type="button"
        onClick={() => router.push("/")}
        className="mt-8 inline-flex min-h-12 items-center rounded-full border border-zinc-300 px-8 font-medium text-zinc-800 transition-colors hover:bg-zinc-100"
      >
        {tCommon("back")}
      </button>
    </div>
  );
}
