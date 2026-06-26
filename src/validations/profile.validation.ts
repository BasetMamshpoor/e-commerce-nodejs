import { z } from "zod";
import { passwordSchema, identifierSchema, otpCodeSchema } from "./common.validation";

export const updateMyProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
});

export const setAvatarSchema = z.object({
  mediaId: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "رمز فعلی الزامی است"),
  newPassword: passwordSchema,
});

export const requestChangeIdentifierSchema = z.object({
  newIdentifier: identifierSchema,
});

export const verifyChangeIdentifierSchema = z.object({
  newIdentifier: identifierSchema,
  code: otpCodeSchema,
});

export type UpdateMyProfileInput = z.infer<typeof updateMyProfileSchema>;
export type SetAvatarInput = z.infer<typeof setAvatarSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RequestChangeIdentifierInput = z.infer<typeof requestChangeIdentifierSchema>;
export type VerifyChangeIdentifierInput = z.infer<typeof verifyChangeIdentifierSchema>;
