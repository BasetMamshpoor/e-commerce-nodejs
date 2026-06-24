import { z } from "zod";

export const createOrderSchema = z
  .object({
    addressId: z.string().min(1, "آدرس ارسال الزامی است"),
    shippingCompanyId: z.string().min(1, "انتخاب شرکت ارسال الزامی است"),
    paymentMethod: z.enum(["GATEWAY", "WALLET", "MIXED"]),
    gatewaySlug: z.string().optional(),
    discountCode: z.string().trim().optional(),
  })
  .refine((d) => d.paymentMethod === "WALLET" || Boolean(d.gatewaySlug), {
    message: "برای پرداخت از درگاه، انتخاب درگاه (gatewaySlug) الزامی است",
    path: ["gatewaySlug"],
  });

export const cancelOrderSchema = z.object({
  reason: z.string().trim().min(3, "دلیل لغو الزامی است").max(500),
});

export const returnOrderSchema = z.object({
  orderItemId: z.string().optional(),
  reason: z.string().trim().min(3, "دلیل مرجوعی الزامی است").max(500),
  imageMediaIds: z.array(z.string()).optional().default([]),
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
  userId: z.string().optional(),
});

export const adminListReturnsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "RECEIVED", "REFUNDED"]).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type ReturnOrderInput = z.infer<typeof returnOrderSchema>;
export type AdminUpdateOrderStatusInput = z.infer<typeof adminUpdateOrderStatusSchema>;
export type AdminUpdateReturnInput = z.infer<typeof adminUpdateReturnSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
export type AdminListOrdersQuery = z.infer<typeof adminListOrdersQuerySchema>;
export type AdminListReturnsQuery = z.infer<typeof adminListReturnsQuerySchema>;
