import { NextResponse } from "next/server";
import { notifyOrder, type OrderItemSummary } from "@/lib/notifications";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createOrderSchema,
  firstIssue,
  parseBudget,
} from "@/lib/validation";

export const runtime = "nodejs";

const BUCKET = "order-snapshots";

async function verifyTurnstile(
  token: string | undefined,
  ip: string,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // غير مُفعّل في هذه البيئة
  if (!token) return false;

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({
          secret,
          response: token,
          remoteip: ip,
        }),
      },
    );
    const data = (await response.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

function decodeSnapshot(dataUrl: string): Buffer | null {
  const match = /^data:image\/png;base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  try {
    return Buffer.from(match[1], "base64");
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const raw = (await request.json().catch(() => null)) as unknown;
    const parsed = createOrderSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: firstIssue(parsed.error) },
        { status: 400 },
      );
    }

    const { customer, items, turnstileToken } = parsed.data;
    const ip = clientIp(request);

    if (!(await verifyTurnstile(turnstileToken, ip))) {
      return NextResponse.json({ error: "turnstile_failed" }, { status: 403 });
    }

    if (!(await checkRateLimit(ip))) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: "database_not_configured" },
        { status: 503 },
      );
    }

    const admin = createAdminClient();

    // 1) رفع لقطات PNG إلى bucket خاص (فشله لا يُفشل الطلب)
    const folder = crypto.randomUUID();
    const snapshotPaths = await Promise.all(
      items.map(async (item, index) => {
        if (!item.snapshot) return null;
        const bytes = decodeSnapshot(item.snapshot);
        if (!bytes) return null;
        const path = `tmp/${folder}/${index}.png`;
        const { error } = await admin.storage
          .from(BUCKET)
          .upload(path, bytes, { contentType: "image/png", upsert: true });
        return error ? null : path;
      }),
    );

    // 2) فحص الأبعاد الدائرية (لا يغطيه RPC الأساسي)
    const typeIds = [...new Set(items.map((item) => item.furniture_type_id))];
    const { data: types } = await admin
      .from("furniture_types")
      .select("id, is_round")
      .in("id", typeIds);
    const roundIds = new Set(
      (types ?? []).filter((type) => type.is_round).map((type) => type.id),
    );
    for (const item of items) {
      if (roundIds.has(item.furniture_type_id) && item.length_cm !== item.width_cm) {
        return NextResponse.json(
          { error: "round_requires_equal_dimensions" },
          { status: 400 },
        );
      }
    }

    // 3) إنشاء الطلب داخل معاملة واحدة
    const payloadItems = items.map((item, index) => ({
      furniture_type_id: item.furniture_type_id,
      fabric_id: item.fabric_id ?? null,
      wood_finish_id: item.wood_finish_id ?? null,
      length_cm: item.length_cm,
      width_cm: item.width_cm,
      height_cm: item.height_cm,
      quantity: item.quantity,
      notes: item.notes ?? null,
      snapshot_path: snapshotPaths[index],
      options: item.options,
    }));

    const { data: created, error: rpcError } = await admin.rpc("create_order", {
      p_customer: {
        name: customer.name,
        phone: customer.phone,
        address: customer.address ?? null,
        notes: customer.notes ?? null,
        budget: parseBudget(customer.budget) ?? null,
      },
      p_items: payloadItems,
    });

    if (rpcError || !created) {
      return NextResponse.json(
        { error: rpcError?.message ?? "create_order_failed" },
        { status: 400 },
      );
    }

    const result = created as { id?: string; order_number?: string };
    const orderNumber = result.order_number ?? "";

    // 4) الإشعار (Telegram ثم Resend) — لا يُفشل الطلب أبدًا
    const summaries = await loadSummaries(admin, items);
    await notifyOrder({
      orderId: result.id,
      orderNumber,
      customer,
      items: summaries,
    });

    return NextResponse.json({
      ok: true,
      id: result.id,
      order_number: orderNumber,
    });
  } catch (error) {
    console.error("POST /api/orders failed:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

type DbItem = {
  furniture_type_id: number;
  fabric_id?: number | null;
  wood_finish_id?: number | null;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  quantity: number;
  options: Record<string, string>;
};

async function loadSummaries(
  admin: ReturnType<typeof createAdminClient>,
  items: DbItem[],
): Promise<OrderItemSummary[]> {
  const typeIds = [...new Set(items.map((item) => item.furniture_type_id))];
  const fabricIds = [
    ...new Set(
      items
        .map((item) => item.fabric_id)
        .filter((id): id is number => typeof id === "number"),
    ),
  ];
  const woodIds = [
    ...new Set(
      items
        .map((item) => item.wood_finish_id)
        .filter((id): id is number => typeof id === "number"),
    ),
  ];

  const [types, fabrics, woods, groups] = await Promise.all([
    admin
      .from("furniture_types")
      .select("id, name_ar, name_fr")
      .in("id", typeIds),
    admin.from("fabrics").select("id, name").in("id", fabricIds),
    admin.from("wood_finishes").select("id, name").in("id", woodIds),
    admin
      .from("option_groups")
      .select(
        "key, name_ar, furniture_type_id, option_values(key, name_ar)",
      )
      .in("furniture_type_id", typeIds),
  ]);

  const typeMap = new Map(
    (types.data ?? []).map((type) => [type.id, type.name_ar]),
  );
  const fabricMap = new Map((fabrics.data ?? []).map((row) => [row.id, row.name]));
  const woodMap = new Map((woods.data ?? []).map((row) => [row.id, row.name]));

  const optionLabels = new Map<string, string>();
  for (const group of groups.data ?? []) {
    const nested = group as unknown as {
      key: string;
      name_ar: string;
      furniture_type_id: number;
      option_values: { key: string; name_ar: string }[];
    };
    for (const value of nested.option_values ?? []) {
      optionLabels.set(
        `${nested.furniture_type_id}:${nested.key}:${value.key}`,
        `${nested.name_ar}: ${value.name_ar}`,
      );
    }
  }

  return items.map((item) => {
    const options = Object.entries(item.options)
      .map(([key, value]) =>
        optionLabels.get(`${item.furniture_type_id}:${key}:${value}`),
      )
      .filter((label): label is string => Boolean(label));

    return {
      label:
        typeMap.get(item.furniture_type_id) ??
        `#${item.furniture_type_id}`,
      dims: `${item.length_cm}×${item.width_cm}×${item.height_cm}`,
      quantity: item.quantity,
      options: [
        ...(item.fabric_id !== null && item.fabric_id !== undefined
          ? [fabricMap.get(item.fabric_id) ?? ""]
          : []),
        ...(item.wood_finish_id !== null && item.wood_finish_id !== undefined
          ? [woodMap.get(item.wood_finish_id) ?? ""]
          : []),
        ...options,
      ].filter(Boolean),
    };
  });
}
