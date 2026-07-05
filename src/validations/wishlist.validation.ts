import { z } from "zod";

export const addWishlistItemSchema = z.object({
  productId: z.coerce.number().int().positive(),
});

export type AddWishlistItemInput = z.infer<typeof addWishlistItemSchema>;
