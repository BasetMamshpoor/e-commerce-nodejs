import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import {
  CreatePaymentGatewayInput,
  UpdatePaymentGatewayInput,
} from "../../validations/payment-gateway.validation";
import { PaymentGateway } from "../../generated/prisma";
import { Prisma } from "../../generated/prisma";

// ----------------------------------------------------------------------------
// این مدل، رکورد «تنظیمات» یک درگاه در دیتابیس است (نام، فعال/غیرفعال،
// تنظیمات اتصال) — با IPaymentGateway (اینترفیس کد در
// services/payment/payment.types.ts) اشتباه نشود. وقتی یک درگاه واقعی
// implement کردید، باید slug همینجا با gateway.name در
// payment.factory.ts یکی باشد تا به هم وصل شوند.
// ----------------------------------------------------------------------------

export async function createPaymentGateway(
  input: CreatePaymentGatewayInput,
): Promise<PaymentGateway> {
  const existing = await prisma.paymentGateway.findUnique({
    where: { slug: input.slug },
  });
  if (existing) throw ApiError.conflict("درگاهی با این slug قبلاً ثبت شده است");

  return prisma.paymentGateway.create({
    data: {
      ...input,
      config: input.config as Prisma.InputJsonValue,
    },
  });
}

export async function updatePaymentGateway(
  id: string,
  input: UpdatePaymentGatewayInput,
): Promise<PaymentGateway> {
  const gateway = await prisma.paymentGateway.findUnique({ where: { id } });
  if (!gateway) throw ApiError.notFound("درگاه پرداخت پیدا نشد");

  if (input.slug && input.slug !== gateway.slug) {
    const existing = await prisma.paymentGateway.findUnique({
      where: { slug: input.slug },
    });
    if (existing)
      throw ApiError.conflict("درگاهی با این slug قبلاً ثبت شده است");
  }

  return prisma.paymentGateway.update({
    where: { id },
    data: {
      ...input,
      config: input.config as Prisma.InputJsonValue,
    },
  });
}

export async function deletePaymentGateway(id: string): Promise<void> {
  const gateway = await prisma.paymentGateway.findUnique({ where: { id } });
  if (!gateway) throw ApiError.notFound("درگاه پرداخت پیدا نشد");
  await prisma.paymentGateway.delete({ where: { id } });
}

export async function listPaymentGateways(
  includeInactive: boolean,
): Promise<PaymentGateway[]> {
  return prisma.paymentGateway.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function getPaymentGatewayBySlug(
  slug: string,
): Promise<PaymentGateway> {
  const gateway = await prisma.paymentGateway.findUnique({ where: { slug } });
  if (!gateway || !gateway.isActive)
    throw ApiError.notFound("درگاه پرداخت پیدا نشد یا غیرفعال است");
  return gateway;
}
