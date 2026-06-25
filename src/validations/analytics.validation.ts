import { z } from "zod";

export const dateRangeQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  period: z.enum(["day", "week", "month"]).optional().default("day"),
});

export const topProductsQuerySchema = dateRangeQuerySchema.extend({
  limit: z.coerce.number().int().positive().max(50).optional().default(10),
});

export type DateRangeQuery = z.infer<typeof dateRangeQuerySchema>;
export type TopProductsQuery = z.infer<typeof topProductsQuerySchema>;
