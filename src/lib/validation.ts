import { z } from "zod";

// مخططات إدخال طلب جديد — مطابقة لعقدة create_order في الـ spec

export const customerSchema = z.object({
  name: z.string().trim().min(2, "invalid_name").max(120, "invalid_name"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9\s()-]{6,19}$/, "invalid_phone"),
  address: z.string().trim().max(300).optional(),
  notes: z.string().trim().max(1000).optional(),
  budget: z.string().trim().max(32).optional(),
});

export const orderItemSchema = z.object({
  furniture_type_id: z.number().int().positive("invalid_furniture_type"),
  fabric_id: z.number().int().positive().nullable().optional(),
  wood_finish_id: z.number().int().positive().nullable().optional(),
  length_cm: z.number().int().min(1).max(2000),
  width_cm: z.number().int().min(1).max(2000),
  height_cm: z.number().int().min(1).max(2000),
  quantity: z
    .number()
    .int()
    .min(1, "invalid_quantity")
    .max(50, "invalid_quantity"),
  notes: z.string().trim().max(500).nullable().optional(),
  snapshot: z
    .string()
    .regex(/^data:image\/png;base64,/, "invalid_snapshot")
    .nullable()
    .optional(),
  options: z.record(z.string(), z.string()).default({}),
});

export const createOrderSchema = z.object({
  customer: customerSchema,
  items: z.array(orderItemSchema).min(1, "invalid_items").max(10, "invalid_items"),
  turnstileToken: z.string().max(2048).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "invalid_input";
}

/** يحوّل قيمة الميزانية إلى رقم إن أمكن، وإلا يرجع undefined */
export function parseBudget(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
