"use client";

import { useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { Category, Fabric, FurnitureType, WoodFinish } from "@/lib/database.types";
import {
  clearCart,
  getCartSnapshot,
  getServerCartSnapshot,
  removeItem as removeCartItem,
  subscribeCart,
  type CustomizerItem,
} from "@/lib/customizer-store";
import type { OptionGroupWithValues } from "@/lib/queries";
import { svgToPng } from "@/lib/snapshot";
import { Turnstile } from "@/components/turnstile";
import { FurnitureArt, furnitureFill } from "@/components/customizer/art";

type PerType = Record<
  string,
  { fabrics: Fabric[]; options: OptionGroupWithValues[] }
>;

type Props = {
  categories: Category[];
  types: FurnitureType[];
  woods: WoodFinish[];
  perType: PerType;
};

type FormState = {
  name: string;
  phone: string;
  address: string;
  notes: string;
  budget: string;
};

const emptyForm: FormState = {
  name: "",
  phone: "",
  address: "",
  notes: "",
  budget: "",
};

export function ReviewClient({ types, woods, perType }: Props) {
  const t = useTranslations("Customizer");
  const tOrder = useTranslations("Order");
  const locale = useLocale();
  const router = useRouter();

  const cart = useSyncExternalStore(
    subscribeCart,
    getCartSnapshot,
    getServerCartSnapshot,
  );
  const items = cart.items;
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const snapshotRefs = useRef<Record<string, SVGSVGElement | null>>({});

  const allFabrics = useMemo(
    () =>
      Array.from(
        new Map(
          Object.values(perType).flatMap((entry) =>
            entry.fabrics.map((item) => [item.id, item] as const),
          ),
        ).values(),
      ),
    [perType],
  );

  function labelFor(item: CustomizerItem): string {
    const type = types.find((entry) => entry.slug === item.typeSlug);
    if (!type) return item.typeSlug;
    return locale === "fr" ? (type.name_fr ?? type.name_ar) : type.name_ar;
  }

  function optionSummary(item: CustomizerItem): string[] {
    const groups = perType[item.typeSlug]?.options ?? [];
    const labels: string[] = [];
    for (const group of groups) {
      const valueKey = item.options[group.key];
      if (!valueKey) continue;
      const value = group.option_values.find((entry) => entry.key === valueKey);
      if (!value) continue;
      labels.push(
        `${group.name_ar}: ${locale === "fr" ? (value.name_fr ?? value.name_ar) : value.name_ar}`,
      );
    }
    return labels;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    if (!form.name.trim()) {
      setError(tOrder("requiredName"));
      return;
    }
    if (form.phone.replace(/[^\d+]/g, "").length < 7) {
      setError(tOrder("requiredPhone"));
      return;
    }
    if (items.length === 0) {
      setError(t("emptyItemsShort"));
      return;
    }
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken) {
      setError(tOrder("submitError"));
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const payloadItems = await Promise.all(
        items.map(async (item) => ({
          furniture_type_id:
            types.find((entry) => entry.slug === item.typeSlug)?.id ?? 0,
          fabric_id: item.fabricId,
          wood_finish_id: item.woodId,
          length_cm: item.lengthCm,
          width_cm: item.widthCm,
          height_cm: item.heightCm,
          quantity: item.quantity,
          notes: null,
          snapshot: await svgToPng(snapshotRefs.current[item.id] ?? null),
          options: item.options,
        })),
      );

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: form.name.trim(),
            phone: form.phone.trim(),
            address: form.address.trim() || undefined,
            notes: form.notes.trim() || undefined,
            budget: form.budget.trim() || undefined,
          },
          items: payloadItems,
          turnstileToken: turnstileToken ?? undefined,
        }),
      });

      if (response.status === 429) {
        setError(tOrder("rateLimited"));
        return;
      }
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(body?.error ?? tOrder("submitError"));
        return;
      }

      const result = (await response.json().catch(() => null)) as
        | { order_number?: string }
        | null;
      if (result?.order_number) {
        try {
          window.sessionStorage.setItem("order_number", result.order_number);
        } catch {
          // تجاهل
        }
      }

      clearCart();
      router.push("/order/success");
    } catch {
      setError(tOrder("submitError"));
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-12 text-center">
        <p className="text-zinc-700">{t("emptyItems")}</p>
        <button
          type="button"
          onClick={() => router.push("/customize")}
          className="mt-6 inline-flex min-h-12 items-center rounded-full bg-amber-800 px-8 font-semibold text-white hover:bg-amber-900"
        >
          {tOrder("backToCustomize")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-10 lg:grid-cols-2">
      <section>
        <h2 className="font-semibold text-zinc-900">{t("itemsTitle")}</h2>
        <ul className="mt-4 space-y-4">
          {items.map((item) => {
            const fabric = allFabrics.find((entry) => entry.id === item.fabricId);
            const wood = woods.find((entry) => entry.id === item.woodId);
            return (
              <li
                key={item.id}
                className="rounded-3xl border border-zinc-200 bg-white p-4"
              >
                <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
                  <span className="block overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50">
                    <FurnitureArt
                      ref={(node) => {
                        snapshotRefs.current[item.id] = node;
                      }}
                      slug={item.typeSlug}
                      title={labelFor(item)}
                      woodColor={wood?.color_hex ?? "#5C4033"}
                      fabricFill={furnitureFill(
                        fabric?.texture_url || null,
                        fabric?.dominant_color,
                      )}
                      textureUrl={fabric?.texture_url || null}
                      className="h-auto w-full"
                    />
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-zinc-900">
                        {labelFor(item)}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeCartItem(item.id)}
                        className="min-h-9 rounded-lg px-3 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        {t("remove")}
                      </button>
                    </div>

                    <dl className="mt-2 space-y-1 text-sm text-zinc-600">
                      <div className="flex gap-2">
                        <dt className="text-zinc-400">{t("fabric")}:</dt>
                        <dd>{fabric?.name ?? "—"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-zinc-400">{t("wood")}:</dt>
                        <dd>{wood?.name ?? "—"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-zinc-400">{t("dimensions")}:</dt>
                        <dd>
                          {item.lengthCm} × {item.widthCm} × {item.heightCm}
                        </dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-zinc-400">{t("quantity")}:</dt>
                        <dd>{item.quantity}</dd>
                      </div>
                      {optionSummary(item).map((line) => (
                        <div key={line} className="flex gap-2">
                          <dd>{line}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={() => router.push("/customize")}
          className="mt-4 text-sm font-medium text-amber-800 hover:text-amber-900"
        >
          ← {tOrder("backToCustomize")}
        </button>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6">
        <h2 className="font-semibold text-zinc-900">{tOrder("customer")}</h2>

        <div className="mt-5 space-y-4">
          <Field
            label={tOrder("name")}
            required
            value={form.name}
            onChange={(value) => setForm((prev) => ({ ...prev, name: value }))}
          />
          <Field
            label={tOrder("phone")}
            required
            type="tel"
            value={form.phone}
            onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))}
          />
          <Field
            label={`${tOrder("address")} (${tOrder("addressNote")})`}
            value={form.address}
            onChange={(value) => setForm((prev) => ({ ...prev, address: value }))}
          />
          <Field
            label={`${tOrder("notes")} (${tOrder("addressNote")})`}
            value={form.notes}
            onChange={(value) => setForm((prev) => ({ ...prev, notes: value }))}
          />
          <Field
            label={`${tOrder("budget")} (${tOrder("addressNote")})`}
            inputMode="numeric"
            value={form.budget}
            onChange={(value) => setForm((prev) => ({ ...prev, budget: value }))}
          />
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <Turnstile onVerify={setTurnstileToken} />

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-amber-800 px-8 text-base font-semibold text-white transition-colors hover:bg-amber-900 disabled:opacity-60"
        >
          {submitting ? tOrder("sending") : tOrder("send")}
        </button>
      </section>
    </form>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  inputMode?: "numeric" | "text" | "tel";
};

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
  inputMode,
}: FieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-700">
        {label}
        {required && <span className="text-amber-700"> *</span>}
      </span>
      <input
        type={type}
        inputMode={inputMode}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-11 w-full rounded-xl border border-zinc-300 px-3 text-base focus:border-amber-700 focus:outline-none"
      />
    </label>
  );
}
