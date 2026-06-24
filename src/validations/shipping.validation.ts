import { z } from "zod";

export const createShippingCompanySchema = z.object({
  name: z.string().trim().min(2).max(150),
  logoId: z.string().optional(),
  description: z.string().max(500).optional(),
  baseCost: z.coerce.number().int().nonnegative().default(0),
  estimatedDaysMin: z.coerce.number().int().nonnegative().optional(),
  estimatedDaysMax: z.coerce.number().int().nonnegative().optional(),
  isActive: z.coerce.boolean().optional().default(true),
});

export const updateShippingCompanySchema = createShippingCompanySchema.partial();

export type CreateShippingCompanyInput = z.infer<typeof createShippingCompanySchema>;
export type UpdateShippingCompanyInput = z.infer<typeof updateShippingCompanySchema>;
