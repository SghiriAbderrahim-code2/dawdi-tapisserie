"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { Category, Fabric, FurnitureType, WoodFinish } from "@/lib/database.types";
import {
  addItem,
  getCartSnapshot,
  getServerCartSnapshot,
  newId,
  removeItem as removeCartItem,
  setDraft,
  subscribeCart,
  type DraftInput,
} from "@/lib/customizer-store";
import type { OptionGroupWithValues } from "@/lib/queries";
import { FurnitureArt, furnitureFill } from "./art";

type PerType = Record<string, { options: OptionGroupWithValues[] }>;

type Props = {
  categories: Category[];
  types: FurnitureType[];
  woods: WoodFinish[];
  perType: PerType;
  initialTypeSlug: string | null;
};

const MAX_QUANTITY = 50;

function midpoint(min: number, max: number) {
  return Math.round((min + max) / 2);
}

export function CustomizerClient({
  categories,
  types,
  woods,
  perType,
  initialTypeSlug,
}: Props) {
  const t = useTranslations("Customizer");
  const router = useRouter();

  const [typeOverride, setTypeOverride] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const cart = useSyncExternalStore(
    subscribeCart,
    getCartSnapshot,
    getServerCartSnapshot,
  );
  const draft = cart.draft;

  const firstSlug = types[0]?.slug ?? "";
  const typeSlug =
    initialTypeSlug ?? draft?.typeSlug ?? typeOverride ?? firstSlug;
  const draftMatches = draft?.typeSlug === typeSlug;

  const type = useMemo(
    () => types.find((item) => item.slug === typeSlug) ?? types[0],
    [types, typeSlug],
  );

  const optionGroups =
    (type ? perType[type.slug]?.options : null) ?? [];

  const [fabricsState, setFabricsState] = useState<{
    key: string;
    status: "ready" | "error";
    fabrics: Fabric[];
  } | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const [knownFabrics, setKnownFabrics] = useState<Record<number, Fabric>>({});
  const loadedSlugs = useRef(new Set<string>());
  const fetchSeq = useRef(0);

  const activeSlug = type?.slug ?? null;
  const fabricsKey = activeSlug ? `${activeSlug}#${retryTick}` : null;
  const fabricsLoading =
    activeSlug !== null &&
    (!fabricsState || fabricsState.key !== fabricsKey);
  const fabricsError =
    activeSlug !== null &&
    fabricsState?.key === fabricsKey &&
    fabricsState.status === "error";
  const fabrics =
    fabricsState?.key === fabricsKey && fabricsState.status === "ready"
      ? fabricsState.fabrics
      : [];

  useEffect(() => {
    if (!activeSlug) return;
    const seq = ++fetchSeq.current;
    const key = `${activeSlug}#${retryTick}`;
    fetch(`/api/fabrics?type=${encodeURIComponent(activeSlug)}`)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<{
          furnitureTypeId: number;
          fabrics: Fabric[];
        }>;
      })
      .then((data) => {
        if (seq !== fetchSeq.current) return; // تغيّر النوع أثناء الطلب
        loadedSlugs.current.add(activeSlug);
        const list = data.fabrics;
        console.log(
          `[customize] type=${activeSlug} furniture_type_id=${data.furnitureTypeId} → ${list.length} fabrics`,
        );
        setFabricsState({ key, status: "ready", fabrics: list });
        setKnownFabrics((prev) => {
          const next = { ...prev };
          for (const item of list) next[item.id] = item;
          return next;
        });
        const current = getCartSnapshot().draft;
        if (
          current &&
          current.typeSlug === activeSlug &&
          current.fabricId != null &&
          !list.some((item) => item.id === current.fabricId)
        ) {
          setDraft({
            typeSlug: current.typeSlug,
            fabricId: null,
            woodId: current.woodId,
            options: current.options,
            lengthCm: current.lengthCm,
            widthCm: current.widthCm,
            heightCm: current.heightCm,
            quantity: current.quantity,
          });
        }
      })
      .catch((err) => {
        if (seq !== fetchSeq.current) return;
        console.error(`[customize] fabrics fetch failed: ${activeSlug}`, err);
        setFabricsState({ key, status: "error", fabrics: [] });
      });
  }, [activeSlug, retryTick]);

  useEffect(() => {
    const missing = [
      ...new Set(cart.items.map((item) => item.typeSlug)),
    ].filter((slug) => slug !== activeSlug && !loadedSlugs.current.has(slug));
    for (const slug of missing) {
      loadedSlugs.current.add(slug);
      fetch(`/api/fabrics?type=${encodeURIComponent(slug)}`)
        .then((res) => {
          if (!res.ok) throw new Error(String(res.status));
          return res.json() as Promise<{ fabrics: Fabric[] }>;
        })
        .then((data) => {
          setKnownFabrics((prev) => {
            const next = { ...prev };
            for (const item of data.fabrics) next[item.id] = item;
            return next;
          });
        })
        .catch((err) =>
          console.error(`[customize] cart fabrics fetch failed: ${slug}`, err),
        );
    }
  }, [cart.items, activeSlug]);

  const fabricId = draftMatches && draft ? draft.fabricId : null;
  const woodId = draftMatches && draft ? draft.woodId : null;
  const choices = draftMatches && draft ? draft.options : {};
  const quantity = draftMatches && draft ? draft.quantity : 1;

  const defaultLength = type ? midpoint(type.min_length, type.max_length) : 0;
  const lengthCm =
    draftMatches && draft ? draft.lengthCm : defaultLength;
  const widthCm =
    draftMatches && draft
      ? draft.widthCm
      : type
        ? type.is_round
          ? defaultLength
          : midpoint(type.min_width, type.max_width)
        : 0;
  const heightCm =
    draftMatches && draft
      ? draft.heightCm
      : type
        ? midpoint(type.min_height, type.max_height)
        : 0;

  const fabric = fabrics.find((item) => item.id === fabricId) ?? null;
  const wood = woods.find((item) => item.id === woodId) ?? null;

  const allFabrics = useMemo(
    () => Object.values(knownFabrics),
    [knownFabrics],
  );

  const isBed =
    type?.category_id === categories.find((c) => c.slug === "beds")?.id;
  const woodLabel = isBed ? t("woodLegs") : t("wood");
  const heightLabel = isBed ? t("frameHeight") : t("height");

  function update(patch: Partial<DraftInput>) {
    if (!type) return;
    setDraft({
      typeSlug: type.slug,
      fabricId,
      woodId,
      options: choices,
      lengthCm,
      widthCm,
      heightCm,
      quantity,
      ...patch,
    });
  }

  function selectType(nextSlug: string) {
    const nextType = types.find((item) => item.slug === nextSlug);
    if (!nextType) return;
    setTypeOverride(nextSlug);
    setError(null);

    const nextOptions = perType[nextSlug]?.options ?? [];
    const validKeys = new Set(nextOptions.map((g) => g.key));
    const keptOptions = Object.fromEntries(
      Object.entries(choices).filter(([key]) => validKeys.has(key)),
    );

    const nextLength = midpoint(nextType.min_length, nextType.max_length);
    setDraft({
      typeSlug: nextSlug,
      fabricId,
      woodId,
      options: keptOptions,
      lengthCm: nextLength,
      widthCm: nextType.is_round
        ? nextLength
        : midpoint(nextType.min_width, nextType.max_width),
      heightCm: midpoint(nextType.min_height, nextType.max_height),
      quantity,
    });
  }

  function validate(): string | null {
    if (!type) return t("chooseType");
    if (fabricsLoading) return t("chooseFabric");
    if (fabricsError) return t("fabricsError");
    if (fabrics.length > 0 && !fabricId) return t("chooseFabric");

    for (const group of optionGroups) {
      if (group.is_required && !choices[group.key]) return t("chooseOption");
    }

    const ranges: [number, number, number, string][] = [
      [lengthCm, type.min_length, type.max_length, t("length")],
      [widthCm, type.min_width, type.max_width, t("width")],
      [heightCm, type.min_height, type.max_height, heightLabel],
    ];
    for (const [value, min, max, label] of ranges) {
      if (!Number.isFinite(value) || value < min || value > max) {
        return `${label}: ${t("rangeError", { min, max })}`;
      }
    }
    if (type.is_round && lengthCm !== widthCm) return t("roundEqual");
    if (quantity < 1 || quantity > MAX_QUANTITY) return t("quantityRange");
    return null;
  }

  function addToCart() {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    if (!type) return;

    setError(null);
    setBusy(true);
    addItem({
      id: newId(),
      typeSlug: type.slug,
      fabricId,
      woodId,
      options: { ...choices },
      lengthCm,
      widthCm,
      heightCm,
      quantity,
    });
    setBusy(false);
    setFlash(t("added"));
    window.setTimeout(() => setFlash(null), 2500);
  }

  const grouped = useMemo(
    () =>
      categories
        .map((category) => ({
          category,
          list: types.filter((item) => item.category_id === category.id),
        }))
        .filter((group) => group.list.length > 0),
    [categories, types],
  );

  if (types.length === 0) {
    return <p className="py-20 text-center text-zinc-600">{t("chooseType")}</p>;
  }

  const textureUrl = fabric && !fabric.is_print ? fabric.texture_url || null : null;
  const previewFill = furnitureFill(textureUrl, fabric?.dominant_color);
  const effectiveWidth = type?.is_round ? lengthCm : widthCm;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
          <span className="text-sm font-medium text-zinc-500">
            {t("preview")}
          </span>
          <div className="mt-2 overflow-hidden rounded-2xl bg-white">
            {type && (
              <FurnitureArt
                slug={type.slug}
                title={type.name_ar}
                woodColor={wood?.color_hex ?? "#5C4033"}
                fabricFill={previewFill}
                textureUrl={textureUrl}
                className="h-auto w-full"
              />
            )}
            {fabric?.is_print && (
              <div className="flex items-center gap-2 border-t border-zinc-100 px-3 py-2">
                <span
                  aria-hidden
                  className="size-7 shrink-0 rounded-full border border-black/10"
                  style={{
                    backgroundColor: fabric.dominant_color ?? "#EFE7DA",
                    backgroundImage: fabric.thumbnail_url
                      ? `url(${fabric.thumbnail_url})`
                      : undefined,
                    backgroundSize: "cover",
                  }}
                />
                <span className="truncate text-xs text-zinc-600">
                  {fabric.name}
                </span>
              </div>
            )}
          </div>
        </div>

        <section className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5">
          <h2 className="font-semibold text-zinc-900">{t("itemsTitle")}</h2>
          {cart.items.length === 0 ? (
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              {t("emptyItems")}
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {cart.items.map((item) => {
                const itemType = types.find((x) => x.slug === item.typeSlug);
                const itemFabric = allFabrics.find((f) => f.id === item.fabricId);
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3"
                  >
                    <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-white">
                      <FurnitureArt
                        slug={item.typeSlug}
                        woodColor={
                          woods.find((w) => w.id === item.woodId)?.color_hex ??
                          "#5C4033"
                        }
                        fabricFill={furnitureFill(
                          itemFabric && !itemFabric.is_print
                            ? itemFabric.texture_url || null
                            : null,
                          itemFabric?.dominant_color,
                        )}
                        textureUrl={
                          itemFabric && !itemFabric.is_print
                            ? itemFabric.texture_url || null
                            : null
                        }
                        className="h-auto w-full"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-zinc-900">
                        {itemType?.name_ar ?? item.typeSlug}
                      </span>
                      <span className="block text-xs text-zinc-500">
                        {item.lengthCm}×{item.widthCm}×{item.heightCm} · ×
                        {item.quantity}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeCartItem(item.id)}
                      className="min-h-9 rounded-lg px-3 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      {t("remove")}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {cart.items.length > 0 && (
            <button
              type="button"
              onClick={() => router.push("/customize/review")}
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-zinc-900 px-6 font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              {t("review")}
            </button>
          )}
        </section>
      </div>

      <div className="space-y-7">
        <section>
          <h2 className="font-semibold text-zinc-900">{t("type")}</h2>
          <div className="mt-3 space-y-4">
            {grouped.map(({ category, list }) => (
              <div key={category.slug}>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {category.name_ar}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {list.map((item) => (
                    <button
                      key={item.slug}
                      type="button"
                      onClick={() => selectType(item.slug)}
                      className={`min-h-10 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        item.slug === typeSlug
                          ? "bg-amber-800 text-white"
                          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                      }`}
                    >
                      {item.name_ar}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-semibold text-zinc-900">{t("fabric")}</h2>
          <div className="mt-3">
            {fabricsLoading ? (
              <p className="text-sm text-zinc-500">{t("loadingFabrics")}</p>
            ) : fabricsError ? (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-red-600">{t("fabricsError")}</p>
                <button
                  type="button"
                  onClick={() => setRetryTick((tick) => tick + 1)}
                  className="min-h-9 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  {t("retry")}
                </button>
              </div>
            ) : fabrics.length === 0 ? (
              <p className="text-sm text-zinc-600">{t("noFabrics")}</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {fabrics.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setError(null);
                      update({ fabricId: item.id });
                    }}
                    aria-pressed={fabricId === item.id}
                    title={item.name}
                    className={`flex items-center gap-2 rounded-full border py-2 pe-4 ps-2 text-sm transition-colors ${
                      fabricId === item.id
                        ? "border-amber-700 bg-amber-50 text-amber-900"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                    }`}
                  >
                    <span
                      aria-hidden
                      className="size-7 rounded-full border border-black/10"
                      style={{
                        backgroundColor: item.dominant_color ?? "#C9B99A",
                        backgroundImage: item.thumbnail_url
                          ? `url(${item.thumbnail_url})`
                          : undefined,
                        backgroundSize: "cover",
                      }}
                    />
                    {item.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {woods.length > 0 && (
          <section>
            <h2 className="font-semibold text-zinc-900">{woodLabel}</h2>
            <div className="mt-3 flex flex-wrap gap-3">
              {woods.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => update({ woodId: item.id })}
                  aria-pressed={woodId === item.id}
                  className={`flex items-center gap-2 rounded-full border py-2 pe-4 ps-2 text-sm transition-colors ${
                    woodId === item.id
                      ? "border-amber-700 bg-amber-50 text-amber-900"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                  }`}
                >
                  <span
                    aria-hidden
                    className="size-7 rounded-full border border-black/10"
                    style={{ backgroundColor: item.color_hex }}
                  />
                  {item.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {optionGroups.length > 0 && (
          <section>
            <h2 className="font-semibold text-zinc-900">{t("options")}</h2>
            <div className="mt-3 space-y-4">
              {optionGroups.map((group) => (
                <div key={group.key}>
                  <p className="text-sm font-medium text-zinc-800">
                    {group.name_ar}
                    {group.is_required && (
                      <span className="ms-2 text-xs font-normal text-amber-700">
                        ({t("required")})
                      </span>
                    )}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {group.option_values.map((value) => (
                      <button
                        key={value.key}
                        type="button"
                        onClick={() => {
                          setError(null);
                          setDraft({
                            typeSlug: type!.slug,
                            fabricId,
                            woodId,
                            options: { ...choices, [group.key]: value.key },
                            lengthCm,
                            widthCm,
                            heightCm,
                            quantity,
                          });
                        }}
                        className={`min-h-10 rounded-full px-4 py-2 text-sm transition-colors ${
                          choices[group.key] === value.key
                            ? "bg-zinc-900 text-white"
                            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                        }`}
                      >
                        {value.name_ar}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="font-semibold text-zinc-900">{t("dimensions")}</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <NumberField
              label={t("length")}
              value={lengthCm}
              min={type.min_length}
              max={type.max_length}
              onChange={(value) =>
                update(
                  type.is_round
                    ? { lengthCm: value, widthCm: value }
                    : { lengthCm: value },
                )
              }
              hint={t("rangeError", {
                min: type.min_length,
                max: type.max_length,
              })}
            />
            <NumberField
              label={t("width")}
              value={effectiveWidth}
              min={type.min_width}
              max={type.max_width}
              disabled={type.is_round}
              onChange={(value) => update({ widthCm: value })}
              hint={
                type.is_round
                  ? t("roundEqual")
                  : t("rangeError", {
                      min: type.min_width,
                      max: type.max_width,
                    })
              }
            />
            <NumberField
              label={heightLabel}
              value={heightCm}
              min={type.min_height}
              max={type.max_height}
              onChange={(value) => update({ heightCm: value })}
              hint={t("rangeError", {
                min: type.min_height,
                max: type.max_height,
              })}
            />
          </div>
        </section>

        <section>
          <h2 className="font-semibold text-zinc-900">{t("quantity")}</h2>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              className="size-11 rounded-xl border border-zinc-300 text-xl text-zinc-700 hover:bg-zinc-100"
              onClick={() => update({ quantity: Math.max(1, quantity - 1) })}
              aria-label="-"
            >
              −
            </button>
            <input
              type="number"
              min={1}
              max={MAX_QUANTITY}
              value={quantity}
              onChange={(event) =>
                update({
                  quantity: Math.min(
                    MAX_QUANTITY,
                    Math.max(1, Number(event.target.value) || 1),
                  ),
                })
              }
              className="h-11 w-20 rounded-xl border border-zinc-300 text-center text-base"
            />
            <button
              type="button"
              className="size-11 rounded-xl border border-zinc-300 text-xl text-zinc-700 hover:bg-zinc-100"
              onClick={() =>
                update({ quantity: Math.min(MAX_QUANTITY, quantity + 1) })
              }
              aria-label="+"
            >
              +
            </button>
            <span className="text-sm text-zinc-500">{t("quantityRange")}</span>
          </div>
        </section>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        {flash && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {flash}
          </p>
        )}

        <button
          type="button"
          onClick={addToCart}
          disabled={busy}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-amber-800 px-8 text-base font-semibold text-white transition-colors hover:bg-amber-900 disabled:opacity-60"
        >
          {busy ? t("adding") : t("addItem")}
        </button>
      </div>
    </div>
  );
}

type NumberFieldProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  hint: string;
  disabled?: boolean;
};

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
  hint,
  disabled,
}: NumberFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        disabled={disabled}
        value={Number.isFinite(value) && value > 0 ? value : ""}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 h-11 w-full rounded-xl border border-zinc-300 px-3 text-base focus:border-amber-700 focus:outline-none disabled:bg-zinc-100"
      />
      <span className="mt-1 block text-xs text-zinc-500">{hint}</span>
    </label>
  );
}
