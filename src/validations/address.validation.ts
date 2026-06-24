import { z } from "zod";

export const createAddressSchema = z.object({
  title: z.string().trim().max(50).optional(),
  receiverName: z.string().trim().min(2).max(100),
  receiverPhone: z.string().trim().min(10).max(15),
  province: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().max(20).optional(),
  fullAddress: z.string().trim().min(5).max(500),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  isDefault: z.coerce.boolean().optional().default(false),
});

export const updateAddressSchema = createAddressSchema.partial();

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
