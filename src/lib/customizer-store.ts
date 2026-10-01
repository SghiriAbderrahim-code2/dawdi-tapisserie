// حالة المُخصِّص: مسودة حالية + قطع الطلب — مخزن خارجي (useSyncExternalStore)
// يُحفظ في localStorage مع try/catch، ويُقرأ أثناء التفاعل فقط (آمن مع SSR).

export type CustomizerItem = {
  id: string;
  typeSlug: string;
  fabricId: number | null;
  woodId: number | null;
  options: Record<string, string>;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  quantity: number;
  notes?: string;
};

export type CartState = {
  draft: CustomizerItem | null;
  items: CustomizerItem[];
};

export type DraftInput = Omit<CustomizerItem, "id">;

const KEY = "furniture:cart:v1";

export const emptyCart: CartState = { draft: null, items: [] };

let cache: CartState = emptyCart;
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function load(): CartState {
  if (loaded) return cache;
  loaded = true;
  if (typeof window === "undefined") return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return cache;
    const parsed = JSON.parse(raw) as Partial<CartState>;
    cache = {
      draft: parsed.draft ?? null,
      items: Array.isArray(parsed.items) ? parsed.items : [],
    };
  } catch {
    cache = emptyCart;
  }
  return cache;
}

function persist(next: CartState) {
  cache = next;
  loaded = true;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // التخزين ممتلئ أو محظور — نتجاهل
    }
  }
  emit();
}

export function subscribeCart(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCartSnapshot(): CartState {
  if (typeof window === "undefined") return emptyCart;
  return load();
}

export function getServerCartSnapshot(): CartState {
  return emptyCart;
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function setDraft(draft: DraftInput | null): void {
  persist({ ...load(), draft: draft ? { ...draft, id: "draft" } : null });
}

export function addItem(item: CustomizerItem): void {
  const current = load();
  persist({ draft: null, items: [...current.items, item] });
}

export function removeItem(id: string): void {
  const current = load();
  persist({
    draft: current.draft,
    items: current.items.filter((item) => item.id !== id),
  });
}

export function clearCart(): void {
  persist(emptyCart);
}
