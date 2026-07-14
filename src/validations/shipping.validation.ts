import { z } from "zod";

const pricingTypeSchema = z.enum(["FIXED", "WEIGHT_DISTANCE"]);

const shippingCompanyBase = z.object({
  name: z.string().trim().min(2).max(150),
  logoUrl: z.string().optional(),
  description: z.string().max(500).optional(),
  pricingType: pricingTypeSchema.optional().default("FIXED"),
  baseCost: z.coerce.number().int().nonnegative().default(0),
  pricePerKg: z.coerce.number().int().nonnegative().optional(),
  pricePerKm: z.coerce.number().int().nonnegative().optional(),
  acceptsPrepay: z.coerce.boolean().optional().default(true),
  acceptsFreightCollect: z.coerce.boolean().optional().default(false),
  estimatedDaysMin: z.coerce.number().int().nonnegative().optional(),
  estimatedDaysMax: z.coerce.number().int().nonnegative().optional(),
  isActive: z.coerce.boolean().optional().default(true),
});

export const createShippingCompanySchema = shippingCompanyBase.superRefine((data, ctx) => {
  if (data.pricingType === "WEIGHT_DISTANCE") {
    if (data.pricePerKg == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "قیمت هر کیلوگرم (pricePerKg) برای نوع WEIGHT_DISTANCE الزامی است",
        path: ["pricePerKg"],
      });
    }
    if (data.pricePerKm == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "قیمت هر کیلومتر (pricePerKm) برای نوع WEIGHT_DISTANCE الزامی است",
        path: ["pricePerKm"],
      });
    }
  }
});

export const updateShippingCompanySchema = shippingCompanyBase.partial().superRefine((data, ctx) => {
  if (data.pricingType === "WEIGHT_DISTANCE") {
    if (data.pricePerKg == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "قیمت هر کیلوگرم (pricePerKg) برای نوع WEIGHT_DISTANCE الزامی است",
        path: ["pricePerKg"],
      });
    }
    if (data.pricePerKm == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "قیمت هر کیلومتر (pricePerKm) برای نوع WEIGHT_DISTANCE الزامی است",
        path: ["pricePerKm"],
      });
    }
  }
});

export type CreateShippingCompanyInput = z.infer<typeof createShippingCompanySchema>;
export type UpdateShippingCompanyInput = z.infer<typeof updateShippingCompanySchema>;
