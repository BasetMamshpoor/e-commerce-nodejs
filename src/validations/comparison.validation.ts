import { z } from "zod";

export const addComparisonItemSchema = z.object({
  productId: z.string().min(1),
});
