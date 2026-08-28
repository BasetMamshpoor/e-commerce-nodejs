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

export async function listSubscribers(page?: number, limit?: number, search?: string) {
  const { parsePagination, buildPaginationMeta } = await import("../../utils/pagination");
  const pagination = parsePagination({ page, limit });
  const where = {
    isActive: true,
    ...(search?.trim() ? { email: { contains: search.trim(), mode: "insensitive" as const } } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.newsletter.findMany({ where, orderBy: { createdAt: "desc" }, skip: pagination.skip, take: pagination.take }),
    prisma.newsletter.count({ where }),
  ]);
  return { items, meta: buildPaginationMeta(total, pagination) };
}

/** All active subscribers, no pagination — for CSV export. The regular
 *  paginated listSubscribers is capped at MAX_LIMIT (100) per page, so
 *  the admin CSV export previously only ever exported the current
 *  page's rows (the frontend built the CSV from the same paginated
 *  items array the table used) rather than the actual full subscriber
 *  list a bulk-export feature is supposed to produce. */
export async function listAllSubscribersForExport(search?: string) {
  const where = {
    isActive: true,
    ...(search?.trim() ? { email: { contains: search.trim(), mode: "insensitive" as const } } : {}),
  };
  return prisma.newsletter.findMany({ where, orderBy: { createdAt: "desc" } });
}
