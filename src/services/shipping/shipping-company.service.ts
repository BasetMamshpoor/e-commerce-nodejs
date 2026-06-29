import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { serializeShippingCompany } from "../../utils/serialize";
import {
  CreateShippingCompanyInput,
  UpdateShippingCompanyInput,
} from "../../validations/shipping.validation";
import { ShippingCompany, Media } from "../../generated/prisma";

type CompanyWithLogo = ShippingCompany & { logo: Media | null };

export async function createShippingCompany(input: CreateShippingCompanyInput) {
  const company = (await prisma.shippingCompany.create({
    data: input,
    include: { logo: true },
  })) as unknown as CompanyWithLogo;
  return serializeShippingCompany(company);
}

export async function updateShippingCompany(id: string, input: UpdateShippingCompanyInput) {
  const company = await prisma.shippingCompany.findUnique({ where: { id } });
  if (!company) throw ApiError.notFound("شرکت ارسال پیدا نشد");

  const updated = (await prisma.shippingCompany.update({
    where: { id },
    data: input,
    include: { logo: true },
  })) as unknown as CompanyWithLogo;
  return serializeShippingCompany(updated);
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

export async function listShippingCompanies(includeInactive: boolean) {
  const companies = (await prisma.shippingCompany.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { baseCost: "asc" },
    include: { logo: true },
  })) as unknown as CompanyWithLogo[];

  return companies.map(serializeShippingCompany);
}

export async function getShippingCompanyById(id: string) {
  const company = (await prisma.shippingCompany.findUnique({
    where: { id },
    include: { logo: true },
  })) as unknown as CompanyWithLogo | null;
  if (!company) throw ApiError.notFound("شرکت ارسال پیدا نشد");
  return serializeShippingCompany(company);
}
