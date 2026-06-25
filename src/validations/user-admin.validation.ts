import { z } from "zod";

export const adminListUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  role: z.enum(["ADMIN", "EDITOR", "SUPPORT", "CUSTOMER"]).optional(),
  isBlocked: z.coerce.boolean().optional(),
  search: z.string().optional(), // در نام/ایمیل/موبایل
});

export const blockUserSchema = z.object({
  reason: z.string().trim().min(3, "دلیل بلاک‌کردن الزامی است").max(500),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["ADMIN", "EDITOR", "SUPPORT", "CUSTOMER"]),
});

export type AdminListUsersQuery = z.infer<typeof adminListUsersQuerySchema>;
export type BlockUserInput = z.infer<typeof blockUserSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
