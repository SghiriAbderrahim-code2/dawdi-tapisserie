import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Db } from "@/lib/queries";

/** مفتاح Supabase متاح في هذه البيئة؟ */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/**
 * عميل قاعدة البيانات في Server Components — يرجع null إذا لم تُضبط المفاتيح
 * (فيستخدم الكود بيانات احتياطية بدل الانهيار).
 */
export async function getDb(): Promise<Db | null> {
  if (!isSupabaseConfigured()) return null;
  return (await createClient()) as Db;
}

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY مطلوبان — انظر .env.example",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // تُستدعى من Server Component — تجاهل، يوجد middleware للتحديث
        }
      },
    },
  });
}
