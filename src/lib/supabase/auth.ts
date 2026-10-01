import "server-only";
import { redirect } from "@/i18n/navigation";
import { isSupabaseConfigured, createClient } from "./server";

/** المستخدم الحالي إن كان مصرّحًا له (عضو في جدول admins) */
export async function getCurrentAdmin() {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    const { data: isAdmin } = await supabase.rpc("is_admin");
    return isAdmin ? user : null;
  } catch {
    return null;
  }
}

/** يوقف كل صفحة في لوحة الإدارة إذا لم يكن المستخدم مُصرَّحًا */
export async function requireAdmin(lang: string) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect({ href: "/admin/login", locale: lang });
  return admin;
}
