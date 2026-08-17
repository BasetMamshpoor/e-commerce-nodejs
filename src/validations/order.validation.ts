import { z } from "zod";

export const createOrderSchema = z
  .object({
    addressId: z.coerce.number().int().positive("آدرس ارسال الزامی است"),
    shippingCompanyId: z.coerce.number().int().positive("انتخاب شرکت ارسال الزامی است"),
    // shippingWeight and shippingDistance intentionally removed: both are
    // always computed server-side now (weight from the cart's actual
    // variant.weight x quantity, distance from a configured warehouse
    // origin -> address) and never trusted from the client — the same
    // reasoning applies to both: they directly affect the charged amount,
    // and having the client independently compute/send either one is
    // exactly what caused the shippingWeight unit bug (grams vs kg
    // mismatch between the checkout preview and the actual order).
    paymentMethod: z.enum(["GATEWAY", "WALLET", "MIXED", "FREIGHT_COLLECT"]),
    gatewaySlug: z.string().optional(),
    discountCode: z.string().trim().optional(),
  })
  .refine((d) => d.paymentMethod === "WALLET" || d.paymentMethod === "FREIGHT_COLLECT" || Boolean(d.gatewaySlug), {
    message: "برای پرداخت از درگاه، انتخاب درگاه (gatewaySlug) الزامی است",
    path: ["gatewaySlug"],
  });

export const cancelOrderSchema = z.object({
  reason: z.string().trim().min(3, "دلیل لغو الزامی است").max(500),
});

export const shippingEstimateQuerySchema = z.object({
  addressId: z.coerce.number().int().positive(),
  shippingCompanyId: z.coerce.number().int().positive(),
});

export const returnOrderSchema = z.object({
  orderItemId: z.coerce.number().int().positive().optional(),
  reason: z.string().trim().min(3, "دلیل مرجوعی الزامی است").max(500),
  imageMediaIds: z.array(z.coerce.number().int().positive()).optional().default([]),
});

export const initiateOrderPaymentSchema = z.object({
  gatewaySlug: z.string().min(1),
});

export const verifyOrderPaymentSchema = z.object({
  providerParams: z.record(z.string(), z.string()).optional().default({}),
});

export const adminUpdateOrderStatusSchema = z.object({
  status: z.enum([
    "PENDING_PAYMENT",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "RETURN_REQUESTED",
    "RETURNED",
    "REFUNDED",
    "FAILED",
  ]),
  note: z.string().max(500).optional(),
  trackingCode: z.string().max(100).optional(),
  packageNumber: z.string().max(100).optional(),
});

export const adminUpdateReturnSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "RECEIVED", "REFUNDED"]),
  refundAmount: z.coerce.number().int().nonnegative().optional(),
  adminNote: z.string().max(500).optional(),
});

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  status: z
    .enum([
      "PENDING_PAYMENT",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
      "RETURN_REQUESTED",
      "RETURNED",
      "REFUNDED",
      "FAILED",
    ])
    .optional(),
});

export const adminListOrdersQuerySchema = listOrdersQuerySchema.extend({
  search: z.string().optional(),
  userId: z.coerce.number().int().positive().optional(),
});

export const adminListReturnsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "RECEIVED", "REFUNDED"]).optional(),
  orderId: z.coerce.number().int().positive().optional(),
  userId: z.coerce.number().int().positive().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type ReturnOrderInput = z.infer<typeof returnOrderSchema>;
export type AdminUpdateOrderStatusInput = z.infer<typeof adminUpdateOrderStatusSchema>;
export type AdminUpdateReturnInput = z.infer<typeof adminUpdateReturnSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
export type AdminListOrdersQuery = z.infer<typeof adminListOrdersQuerySchema>;
export type AdminListReturnsQuery = z.infer<typeof adminListReturnsQuerySchema>;
