import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const WINDOW_MS = 60 * 60 * 1000; // ساعة
const MAX_PER_WINDOW = 5; // 5 طلبات/ساعة لكل IP

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * يتحقق من حد الطلبات للـ IP ثم يسجّل المحاولة.
 * يرجع true إذا كان ضمن الحد المسموح، false إذا تجاوزه.
 * لا يرمي أبدًا — عند أي مشكلة يسمح بالطلب (الحماية احتياطية).
 */
export async function checkRateLimit(ip: string): Promise<boolean> {
  try {
    const salt = process.env.IP_HASH_SALT ?? "";
    const ipHash = await sha256(`${salt}${ip}`);
    const admin = createAdminClient();
    const since = new Date(Date.now() - WINDOW_MS).toISOString();

    const { data, error } = await admin
      .from("rate_limits")
      .select("created_at")
      .eq("ip_hash", ipHash)
      .gte("created_at", since);

    if (error) return true;
    if ((data?.length ?? 0) >= MAX_PER_WINDOW) return false;

    await admin.from("rate_limits").insert({ ip_hash: ipHash });
    return true;
  } catch {
    return true;
  }
}
