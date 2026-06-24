import { z } from "zod";

export const createPaymentGatewaySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "slug فقط می‌تواند حروف لاتین کوچک، عدد و - باشد"),
  isActive: z.coerce.boolean().optional().default(true),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const updatePaymentGatewaySchema = createPaymentGatewaySchema.partial();

export type CreatePaymentGatewayInput = z.infer<typeof createPaymentGatewaySchema>;
export type UpdatePaymentGatewayInput = z.infer<typeof updatePaymentGatewaySchema>;
