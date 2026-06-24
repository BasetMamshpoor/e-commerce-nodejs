import { z } from "zod";

const isoDate = z.coerce.date();

const baseDiscountFields = {
  code: z
    .string()
    .trim()
    .min(3, "کد تخفیف باید حداقل ۳ کاراکتر باشد")
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "کد تخفیف فقط می‌تواند حروف انگلیسی، عدد، - و _ باشد"),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.coerce.number().int().positive(),
  maxDiscountAmount: z.coerce.number().int().positive().optional(),
  minCartAmount: z.coerce.number().int().nonnegative().optional(),
  maxUsage: z.coerce.number().int().positive().optional(),
  maxUsagePerUser: z.coerce.number().int().positive().optional(),
  startsAt: isoDate.optional(),
  expiresAt: isoDate.optional(),
  isActive: z.coerce.boolean().optional().default(true),
  productIds: z.array(z.string()).optional().default([]),
  categoryIds: z.array(z.string()).optional().default([]),
  userIds: z.array(z.string()).optional().default([]),
};

export const createDiscountCodeSchema = z
  .object(baseDiscountFields)
  .refine((d) => d.type !== "PERCENT" || d.value <= 100, {
    message: "مقدار تخفیف درصدی نمی‌تواند بیشتر از ۱۰۰ باشد",
    path: ["value"],
  })
  .refine((d) => !d.startsAt || !d.expiresAt || d.expiresAt > d.startsAt, {
    message: "تاریخ پایان باید بعد از تاریخ شروع باشد",
    path: ["expiresAt"],
  });

export const updateDiscountCodeSchema = z
  .object({
    code: baseDiscountFields.code.optional(),
    type: baseDiscountFields.type.optional(),
    value: baseDiscountFields.value.optional(),
    maxDiscountAmount: baseDiscountFields.maxDiscountAmount,
    minCartAmount: baseDiscountFields.minCartAmount,
    maxUsage: baseDiscountFields.maxUsage,
    maxUsagePerUser: baseDiscountFields.maxUsagePerUser,
    startsAt: baseDiscountFields.startsAt,
    expiresAt: baseDiscountFields.expiresAt,
    isActive: z.coerce.boolean().optional(),
    productIds: z.array(z.string()).optional(),
    categoryIds: z.array(z.string()).optional(),
    userIds: z.array(z.string()).optional(),
  })
  .refine((d) => d.type !== "PERCENT" || !d.value || d.value <= 100, {
    message: "مقدار تخفیف درصدی نمی‌تواند بیشتر از ۱۰۰ باشد",
    path: ["value"],
  })
  .refine((d) => !d.startsAt || !d.expiresAt || d.expiresAt > d.startsAt, {
    message: "تاریخ پایان باید بعد از تاریخ شروع باشد",
    path: ["expiresAt"],
  });

export const applyDiscountCodeSchema = z.object({
  code: z.string().trim().min(1, "کد تخفیف الزامی است"),
});

export const adminListDiscountCodesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

export type CreateDiscountCodeInput = z.infer<typeof createDiscountCodeSchema>;
export type UpdateDiscountCodeInput = z.infer<typeof updateDiscountCodeSchema>;
export type ApplyDiscountCodeInput = z.infer<typeof applyDiscountCodeSchema>;
export type AdminListDiscountCodesQuery = z.infer<typeof adminListDiscountCodesQuerySchema>;
