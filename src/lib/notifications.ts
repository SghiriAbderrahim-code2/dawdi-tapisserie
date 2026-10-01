import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteConfig } from "@/lib/site-config";

export type OrderItemSummary = {
  label: string;
  dims: string;
  quantity: number;
  options: string[];
};

export type OrderSummary = {
  orderId?: string | null;
  orderNumber: string;
  customer: {
    name: string;
    phone: string;
    address?: string;
    notes?: string;
    budget?: string;
  };
  items: OrderItemSummary[];
};

export type NotifyResult = {
  channel: "telegram" | "email";
  success: boolean;
  error?: string;
};

function buildText(summary: OrderSummary): string {
  const lines = [
    `طلب جديد ${summary.orderNumber}`,
    `الاسم: ${summary.customer.name}`,
    `الهاتف: ${summary.customer.phone}`,
  ];
  if (summary.customer.address) lines.push(`العنوان: ${summary.customer.address}`);
  if (summary.customer.budget) lines.push(`الميزانية: ${summary.customer.budget}`);
  lines.push("", "القطع:");
  summary.items.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.label} — ${item.dims} ×${item.quantity}`);
    item.options.forEach((option) => lines.push(`   · ${option}`));
  });
  if (summary.customer.notes) lines.push("", `ملاحظات: ${summary.customer.notes}`);
  return lines.join("\n");
}

async function sendTelegram(text: string): Promise<NotifyResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return { channel: "telegram", success: false, error: "not_configured" };
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      },
    );
    if (!response.ok) {
      return {
        channel: "telegram",
        success: false,
        error: `http_${response.status}`,
      };
    }
    return { channel: "telegram", success: true };
  } catch (error) {
    return {
      channel: "telegram",
      success: false,
      error: error instanceof Error ? error.message : "failed",
    };
  }
}

async function sendEmail(summary: OrderSummary, text: string): Promise<NotifyResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.OWNER_EMAIL;
  if (!apiKey || !to) {
    return { channel: "email", success: false, error: "not_configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
        to: [to],
        subject: `طلب جديد ${summary.orderNumber} — ${summary.customer.name}`,
        text,
      }),
    });
    if (!response.ok) {
      return { channel: "email", success: false, error: `http_${response.status}` };
    }
    return { channel: "email", success: true };
  } catch (error) {
    return {
      channel: "email",
      success: false,
      error: error instanceof Error ? error.message : "failed",
    };
  }
}

async function logResult(result: NotifyResult, orderId?: string | null) {
  try {
    const admin = createAdminClient();
    await admin.from("notification_log").insert({
      order_id: orderId ?? null,
      channel: result.channel,
      success: result.success,
      error: result.error ?? null,
    });
  } catch {
    // التسجيل اختياري — لا يُفشل الطلب
  }
}

/**
 * يرسل إشعار الطلب: Telegram أولًا، وResend بديلًا عند الفشل.
 * يسجّل النتيجة في notification_log ولا يرمي أبدًا (الطلب ناجح مهما فشل الإشعار).
 */
export async function notifyOrder(summary: OrderSummary): Promise<void> {
  const text = buildText(summary);

  const telegram = await sendTelegram(text);
  await logResult(telegram, summary.orderId);
  if (telegram.success) return;

  const email = await sendEmail(summary, text);
  await logResult(email, summary.orderId);
}

export { siteConfig };
