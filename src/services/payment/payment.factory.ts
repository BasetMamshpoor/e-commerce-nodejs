import { IPaymentGateway } from "./payment.types";
import { ApiError } from "../../utils/ApiError";

// ----------------------------------------------------------------------------
// رجیستری درگاه‌های پرداخت. فعلاً خالی است.
// وقتی یک درگاه واقعی پیاده‌سازی کردید (مثلاً ZarinpalGateway implements
// IPaymentGateway)، همینجا با registerGateway ثبتش کنید:
//
//   import { ZarinpalGateway } from "./gateways/zarinpal.gateway";
//   registerGateway(new ZarinpalGateway());
//
// و در سرویس سفارش با: getGateway("zarinpal") به آن دسترسی پیدا کنید.
// نام درگاه باید با ستون PaymentGateway.slug در دیتابیس مطابقت داشته باشد.
// ----------------------------------------------------------------------------

const registry = new Map<string, IPaymentGateway>();

export function registerGateway(gateway: IPaymentGateway): void {
  registry.set(gateway.name, gateway);
}

export function getGateway(name: string): IPaymentGateway {
  const gateway = registry.get(name);
  if (!gateway) {
    throw ApiError.badRequest(
      `درگاه پرداخت «${name}» هنوز پیاده‌سازی/ثبت نشده است`
    );
  }
  return gateway;
}
