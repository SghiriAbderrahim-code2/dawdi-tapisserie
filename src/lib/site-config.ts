// بيانات التواصل — عدّلها قبل النشر
// الرقم يُكتب بالصيغة الدولية بدون مسافات، مثال: "+213555123456"

export const siteConfig = {
  /** رقم الهاتف (يظهر في صفحة اتصل بنا والتذييل) */
  phone: "",
  /** رقم واتساب بالصيغة الدولية بدون +، مثال: "213555123456" */
  whatsapp: "",
  /** البريد الإلكتروني (يُستخدم كخيار إشعار احتياطي) */
  email: "",
  /** رابط إنستغرام كامل */
  instagram: "",
  /** العنوان/المدينة */
  address: "",
};

export function isContactConfigured(): boolean {
  return Boolean(siteConfig.phone || siteConfig.whatsapp || siteConfig.email);
}

export function whatsappLink(message = ""): string | null {
  if (!siteConfig.whatsapp) return null;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${siteConfig.whatsapp}${text}`;
}

export function phoneLink(): string | null {
  return siteConfig.phone ? `tel:${siteConfig.phone.replace(/[^\d+]/g, "")}` : null;
}
