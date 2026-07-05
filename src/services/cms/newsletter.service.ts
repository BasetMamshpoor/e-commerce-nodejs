import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";

export async function subscribe(email: string) {
  const existing = await prisma.newsletter.findUnique({ where: { email } });
  if (existing) {
    if (!existing.isActive) {
      return prisma.newsletter.update({ where: { email }, data: { isActive: true } });
    }
    return existing;
  }
  return prisma.newsletter.create({ data: { email } });
}

export async function unsubscribe(email: string) {
  const existing = await prisma.newsletter.findUnique({ where: { email } });
  if (!existing) throw ApiError.notFound("ایمیل در خبرنامه ثبت نشده است");
  await prisma.newsletter.update({ where: { email }, data: { isActive: false } });
}

export async function listSubscribers(page?: number, limit?: number) {
  const { parsePagination, buildPaginationMeta } = await import("../../utils/pagination");
  const pagination = parsePagination({ page, limit });
  const [items, total] = await Promise.all([
    prisma.newsletter.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" }, skip: pagination.skip, take: pagination.take }),
    prisma.newsletter.count({ where: { isActive: true } }),
  ]);
  return { items, meta: buildPaginationMeta(total, pagination) };
}
