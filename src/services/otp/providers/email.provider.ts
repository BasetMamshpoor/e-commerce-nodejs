import nodemailer, { Transporter } from "nodemailer";
import { IOtpChannelProvider, SendOtpInput } from "../otp.types";
import { env } from "../../../config/env";

// ----------------------------------------------------------------------------
// EmailOtpProvider با nodemailer واقعاً ایمیل ارسال می‌کند.
// اگر متغیرهای SMTP_* در .env پر نشده باشند (مثلاً در محیط dev)، به‌جای کرش
// کردن، کد را در کنسول چاپ می‌کند تا توسعه بدون SMTP واقعی هم ممکن باشد.
// ----------------------------------------------------------------------------

export class EmailOtpProvider implements IOtpChannelProvider {
  private transporter: Transporter | null;

  constructor() {
    this.transporter = env.SMTP_HOST
      ? nodemailer.createTransport({
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          secure: env.SMTP_SECURE,
          auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
        })
      : null;
  }

  async send(input: SendOtpInput): Promise<void> {
    if (!this.transporter) {
      // eslint-disable-next-line no-console
      console.log(
        `✉️ [MockEmail] به ${input.identifier} برای «${input.purposeLabel}» ارسال شد → کد: ${input.code}`
      );
      return;
    }

    await this.transporter.sendMail({
      from: env.SMTP_FROM,
      to: input.identifier,
      subject: `کد تایید — ${input.purposeLabel}`,
      html: `<div style="font-family:sans-serif;direction:rtl;text-align:right">
               <p>برای «${input.purposeLabel}» از کد زیر استفاده کنید:</p>
               <h2 style="letter-spacing:4px">${input.code}</h2>
               <p style="color:#888;font-size:12px">این کد محرمانه است و فقط برای استفاده‌ی خودتان است.</p>
             </div>`,
    });
  }
}
