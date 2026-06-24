import { z } from "zod";

export const addCartItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.coerce.number().int().positive().max(999),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(0).max(999), // صفر یعنی حذف آیتم
});

export const mergeCartSchema = z.object({
  guestToken: z.string().min(1),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
