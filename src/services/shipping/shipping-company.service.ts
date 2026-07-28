import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import {
  CreateShippingCompanyInput,
  UpdateShippingCompanyInput,
} from "../../validations/shipping.validation";
import { syncUrlWithMediaId } from "../../utils/mediaSync";

export async function createShippingCompany(input: CreateShippingCompanyInput) {
  return prisma.shippingCompany.create({ data: syncUrlWithMediaId(input, "logoMediaId", "logoUrl") });
}

export async function updateShippingCompany(id: number, input: UpdateShippingCompanyInput) {
  const company = await prisma.shippingCompany.findUnique({ where: { id } });
  if (!company) throw ApiError.notFound("شرکت ارسال پیدا نشد");

  return prisma.shippingCompany.update({ where: { id }, data: syncUrlWithMediaId(input, "logoMediaId", "logoUrl") });
}

export async function deleteShippingCompany(id: number): Promise<void> {
  const company = await prisma.shippingCompany.findUnique({ where: { id } });
  if (!company) throw ApiError.notFound("شرکت ارسال پیدا نشد");

  const orderCount = await prisma.order.count({ where: { shippingCompanyId: id } });
  if (orderCount > 0) {
    throw ApiError.conflict("این شرکت ارسال در سفارش‌های قبلی استفاده شده؛ به‌جای حذف آن را غیرفعال کنید");
  }

  await prisma.shippingCompany.delete({ where: { id } });
}

export async function listShippingCompanies(includeInactive: boolean) {
  return prisma.shippingCompany.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function getShippingCompanyById(id: number) {
  const company = await prisma.shippingCompany.findUnique({ where: { id } });
  if (!company) throw ApiError.notFound("شرکت ارسال پیدا نشد");
  return company;
}

export function calculateShippingCost(
  company: { pricingType: string; baseCost: number; pricePerKg: number | null; pricePerKm: number | null },
  weight?: number,
  distance?: number,
): number {
  if (company.pricingType === "WEIGHT_DISTANCE") {
    const kg = weight ?? 0;
    const km = distance ?? 0;
    return (company.pricePerKg ?? 0) * kg + (company.pricePerKm ?? 0) * km;
  }
  return company.baseCost;
}
