import { z } from "zod";
import {
  identifierSchema,
  passwordSchema,
  otpCodeSchema,
  deviceNameSchema,
} from "./common.validation";

export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
  identifier: identifierSchema,
  password: passwordSchema,
});

export const verifyOtpSchema = z.object({
  identifier: identifierSchema,
  code: otpCodeSchema,
  deviceName: deviceNameSchema,
});

export const loginSchema = z.object({
  identifier: identifierSchema,
  password: z.string().min(1, "رمز عبور الزامی است"),
  deviceName: deviceNameSchema,
});

export const requestOtpSchema = z.object({
  identifier: identifierSchema,
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10, "refreshToken نامعتبر است"),
});

export const forgotPasswordSchema = z.object({
  identifier: identifierSchema,
});

export const resetPasswordSchema = z.object({
  identifier: identifierSchema,
  code: otpCodeSchema,
  newPassword: passwordSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
