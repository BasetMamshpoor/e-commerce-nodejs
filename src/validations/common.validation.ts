import { z } from "zod";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IRAN_PHONE_REGEX = /^(?:\+98|0098|0)?9\d{9}$/;

// شناسه می‌تواند ایمیل یا شماره موبایل ایران باشد
export const identifierSchema = z
  .string()
  .trim()
  .min(3, "شناسه الزامی است")
  .refine(
    (val) => EMAIL_REGEX.test(val) || IRAN_PHONE_REGEX.test(val),
    "شناسه باید یک ایمیل معتبر یا شماره موبایل معتبر باشد"
  );

export const passwordSchema = z
  .string()
  .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد")
  .max(72, "رمز عبور بیش از حد طولانی است")
  .regex(/[A-Za-z]/, "رمز عبور باید حداقل یک حرف داشته باشد")
  .regex(/[0-9]/, "رمز عبور باید حداقل یک رقم داشته باشد");

export const otpCodeSchema = z
  .string()
  .trim()
  .min(4, "کد تایید نامعتبر است")
  .max(8, "کد تایید نامعتبر است");

export const deviceNameSchema = z.string().trim().max(100).optional();
