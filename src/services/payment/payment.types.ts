// ----------------------------------------------------------------------------
// اینترفیس انتزاعی درگاه پرداخت (الگوی Strategy).
// هیچ درگاه واقعی (زرین‌پال، Stripe و...) اینجا پیاده‌سازی نشده — طبق
// تصمیمی که گرفتیم، خودتان بعداً این اینترفیس را implement می‌کنید.
//
// نحوه‌ی استفاده‌ی پیش‌بینی‌شده در ماژول سفارش/پرداخت:
//   ۱) initiatePayment(...) → کاربر را به صفحه‌ی درگاه ریدایرکت می‌کند
//   ۲) بعد از بازگشت از درگاه → verifyPayment(...) صحت تراکنش را تایید می‌کند
//
// هر درگاه واقعی را در یک فایل جدا (مثلاً zarinpal.gateway.ts) پیاده‌سازی
// و در payment.factory.ts بر اساس نام درگاه (از جدول PaymentGateway) انتخاب کنید.
// ----------------------------------------------------------------------------

export interface InitiatePaymentInput {
  orderId: string;
  amount: number; // تومان
  description: string;
  callbackUrl: string;
  payerName?: string;
  payerEmail?: string;
  payerPhone?: string;
}

export interface InitiatePaymentResult {
  // آدرسی که کاربر باید برای پرداخت به آن ریدایرکت شود
  redirectUrl: string;
  // شناسه‌ی مرجعی که درگاه برمی‌گرداند و باید برای verify دوباره استفاده شود
  gatewayRefId: string;
}

export interface VerifyPaymentInput {
  orderId: string;
  amount: number;
  // پارامترهایی که درگاه هنگام بازگشت کاربر در querystring برمی‌گرداند
  // (مثلاً Authority برای زرین‌پال یا session_id برای Stripe)
  providerParams: Record<string, string>;
}

export interface VerifyPaymentResult {
  success: boolean;
  refId: string; // شماره پیگیری نهایی تراکنش موفق
  rawResponse?: unknown;
}

export interface IPaymentGateway {
  readonly name: string;
  initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult>;
}
