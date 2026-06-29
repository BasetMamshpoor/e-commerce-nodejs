import { prisma } from "../../lib/prisma";
import { env, isProd } from "../../config/env";
import { ApiError } from "../../utils/ApiError";
import { generateNumericOtp, normalizeIdentifier, detectIdentifierChannel } from "../../utils/otp";
import { MockSmsProvider } from "./providers/mock-sms.provider";
import { EmailOtpProvider } from "./providers/email.provider";
import { OtpPurpose, OtpChannel } from "../../generated/prisma";

const smsProvider = new MockSmsProvider();
const emailProvider = new EmailOtpProvider();

const PURPOSE_LABELS: Record<OtpPurpose, string> = {
  REGISTER: "ثبت‌نام",
  LOGIN: "ورود",
  RESET_PASSWORD: "بازیابی رمز عبور",
  VERIFY_PHONE: "تایید شماره موبایل",
  VERIFY_EMAIL: "تایید ایمیل",
  CHANGE_PHONE: "تغییر شماره موبایل",
};

export interface IssueOtpResult {
  identifier: string;
  channel: OtpChannel;
  expiresAt: Date;
  /**
   * ⚠️ فقط در محیط غیر-production پر می‌شود (برای تست خودکار توسط
   * agent های فرانت‌اند/QA بدون نیاز به خواندن کنسول سرور). در production
   * همیشه undefined است — هرگز این رفتار را برای production فعال نکنید.
   */
  devCode?: string;
}

export async function issueOtp(params: {
  identifier: string;
  purpose: OtpPurpose;
  userId?: string;
}): Promise<IssueOtpResult> {
  const channel: OtpChannel =
    detectIdentifierChannel(params.identifier) === "SMS" ? "SMS" : "EMAIL";
  const identifier = normalizeIdentifier(params.identifier);

  // جلوگیری از ارسال درخواست‌های پیاپی (resend cooldown)
  const lastOtp = await prisma.otpCode.findFirst({
    where: { identifier, purpose: params.purpose },
    orderBy: { createdAt: "desc" },
  });

  if (lastOtp) {
    const secondsSinceLast = (Date.now() - lastOtp.createdAt.getTime()) / 1000;
    if (secondsSinceLast < env.OTP_RESEND_COOLDOWN_SECONDS) {
      throw ApiError.tooMany(
        `لطفاً ${Math.ceil(env.OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLast)} ثانیه صبر کنید و دوباره تلاش کنید`
      );
    }
  }

  const code = generateNumericOtp();
  const expiresAt = new Date(Date.now() + env.OTP_EXPIRES_IN_MINUTES * 60 * 1000);

  await prisma.otpCode.create({
    data: {
      identifier,
      channel,
      purpose: params.purpose,
      code,
      expiresAt,
      userId: params.userId,
    },
  });

  const provider = channel === "SMS" ? smsProvider : emailProvider;
  await provider.send({
    identifier,
    code,
    purposeLabel: PURPOSE_LABELS[params.purpose],
  });

  return { identifier, channel, expiresAt, ...(isProd ? {} : { devCode: code }) };
}

export async function verifyOtp(params: {
  identifier: string;
  code: string;
  purpose: OtpPurpose;
}) {
  const identifier = normalizeIdentifier(params.identifier);

  const otp = await prisma.otpCode.findFirst({
    where: { identifier, purpose: params.purpose, isUsed: false },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    throw ApiError.badRequest("کد تاییدی برای این درخواست پیدا نشد، دوباره درخواست بدهید");
  }

  if (otp.expiresAt < new Date()) {
    throw ApiError.badRequest("کد تایید منقضی شده است، دوباره درخواست بدهید");
  }

  if (otp.attempts >= env.OTP_MAX_VERIFY_ATTEMPTS) {
    throw ApiError.tooMany("تعداد تلاش‌های مجاز برای این کد به پایان رسیده، دوباره درخواست بدهید");
  }

  if (otp.code !== params.code) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    throw ApiError.badRequest("کد تایید نادرست است");
  }

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { isUsed: true },
  });

  return { identifier, channel: otp.channel };
}
