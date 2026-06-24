// ----------------------------------------------------------------------------
// اینترفیس انتزاعی ارسال OTP. هر سرویس واقعی (کاوه‌نگار، ملی‌پیامک، SMTP و...)
// باید این اینترفیس را پیاده‌سازی کند تا otp.service.ts بدون تغییر، با هرکدام
// کار کند (الگوی Strategy).
// ----------------------------------------------------------------------------

export interface SendOtpInput {
  identifier: string; // شماره موبایل یا ایمیل
  code: string;
  purposeLabel: string; // متن قابل‌نمایش، مثلا "ثبت‌نام" یا "بازیابی رمز عبور"
}

export interface IOtpChannelProvider {
  send(input: SendOtpInput): Promise<void>;
}
