import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * عميل service_role — صلاحيات كاملة تتجاوز RLS.
 * للserver فقط (route handlers / server actions)، يُمنع من استيراده في مكوّنات العميل.
 * لا يُستخدم أبدًا للقراءة العامة: استخدم client.ts / server.ts للمستخدم العادي.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY مطلوبان — انظر .env.example",
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
