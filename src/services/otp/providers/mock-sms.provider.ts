import { IOtpChannelProvider, SendOtpInput } from "../otp.types";

// ----------------------------------------------------------------------------
// Mock SMS Provider — فقط برای محیط توسعه.
// به‌جای اتصال واقعی به سرویس پیامک، کد را در کنسول چاپ می‌کند.
//
// برای اتصال واقعی بعداً:
// ۱) یک کلاس جدید مثل KavenegarSmsProvider بسازید که همین IOtpChannelProvider
//    را implement کند (متد send را با فراخوانی API واقعی پر کنید)
// ۲) در otp.service.ts بر اساس env.SMS_PROVIDER نمونه‌ی مناسب را انتخاب کنید
// ----------------------------------------------------------------------------

export class MockSmsProvider implements IOtpChannelProvider {
  async send(input: SendOtpInput): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(
      `📱 [MockSMS] به ${input.identifier} برای «${input.purposeLabel}» ارسال شد → کد: ${input.code}`
    );
  }
}
