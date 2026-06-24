import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import {
  CreateShippingCompanyInput,
  UpdateShippingCompanyInput,
} from "../../validations/shipping.validation";
import { ShippingCompany } from "../../generated/prisma";

export async function createShippingCompany(
  input: CreateShippingCompanyInput
): Promise<ShippingCompany> {
  return prisma.shippingCompany.create({ data: input });
}

export async function updateShippingCompany(
  id: string,
  input: UpdateShippingCompanyInput
): Promise<ShippingCompany> {
  const company = await prisma.shippingCompany.findUnique({ where: { id } });
  if (!company) throw ApiError.notFound("شرکت ارسال پیدا نشد");
  return prisma.shippingCompany.update({ where: { id }, data: input });
}

export async function deleteShippingCompany(id: string): Promise<void> {
  const company = await prisma.shippingCompany.findUnique({ where: { id } });
  if (!company) throw ApiError.notFound("شرکت ارسال پیدا نشد");

  const orderCount = await prisma.order.count({ where: { shippingCompanyId: id } });
  if (orderCount > 0) {
    throw ApiError.conflict(
      "این شرکت ارسال در سفارش‌های قبلی استفاده شده؛ به‌جای حذف آن را غیرفعال کنید"
    );
  }

  await prisma.shippingCompany.delete({ where: { id } });
}

export async function listShippingCompanies(includeInactive: boolean): Promise<ShippingCompany[]> {
  return prisma.shippingCompany.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { baseCost: "asc" },
  });
}

export async function getShippingCompanyById(id: string): Promise<ShippingCompany> {
  const company = await prisma.shippingCompany.findUnique({ where: { id } });
  if (!company) throw ApiError.notFound("شرکت ارسال پیدا نشد");
  return company;
}
