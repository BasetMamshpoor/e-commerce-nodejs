import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { parsePagination, buildPaginationMeta } from "../../utils/pagination";
import { revokeSession, revokeAllSessions } from "../auth/session.service";
import { notifyUser } from "../notification/notification.service";
import {
  AdminListUsersQuery,
  BlockUserInput,
  UpdateUserRoleInput,
} from "../../validations/user-admin.validation";
import { User } from "../../generated/prisma";

// ----------------------------------------------------------------------------
// مدیریت کاربران از پنل ادمین — آیتم ۲۵ (بلاک‌کردن کاربر، محدودیت/مدیریت
// نشست‌ها). فیلدهای امن (بدون password) برگردانده می‌شوند.
// ----------------------------------------------------------------------------

function publicUser(user: User) {
  const { password, ...rest } = user;
  return rest;
}

export async function listUsersAdmin(query: AdminListUsersQuery) {
  const pagination = parsePagination({ page: query.page, limit: query.limit });
  const where = {
    ...(query.role ? { role: query.role } : {}),
    ...(query.isBlocked !== undefined ? { isBlocked: query.isBlocked } : {}),
    ...(query.search
      ? {
          OR: [
            { fullName: { contains: query.search, mode: "insensitive" as const } },
            { email: { contains: query.search, mode: "insensitive" as const } },
            { phone: { contains: query.search } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.user.count({ where }),
  ]);

  return { items: items.map(publicUser), meta: buildPaginationMeta(total, pagination) };
}

export async function getUserDetailAdmin(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound("کاربر پیدا نشد");

  const [activeSessionCount, orderCount, wallet] = await Promise.all([
    prisma.userSession.count({ where: { userId, isActive: true } }),
    prisma.order.count({ where: { userId } }),
    prisma.wallet.findUnique({ where: { userId } }),
  ]);

  return {
    ...publicUser(user),
    activeSessionCount,
    orderCount,
    walletBalance: wallet?.balance ?? 0,
  };
}

export async function blockUser(userId: string, input: BlockUserInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound("کاربر پیدا نشد");
  if (user.role === "ADMIN") {
    throw ApiError.forbidden("کاربر ادمین قابل بلاک‌کردن نیست");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isBlocked: true, blockedReason: input.reason, blockedAt: new Date() },
  });

  // بلاک‌شدن باید همان لحظه همه‌ی نشست‌های فعال کاربر را باطل کند —
  // authenticate middleware با چک isBlocked این کار را تایید می‌کند، اما
  // باطل‌کردن صریح نشست‌ها هم سریع‌تر و هم شفاف‌تر است.
  await revokeAllSessions(userId);

  return publicUser(updated);
}

export async function unblockUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound("کاربر پیدا نشد");

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isBlocked: false, blockedReason: null, blockedAt: null },
  });

  notifyUser({
    userId,
    type: "SYSTEM",
    title: "رفع مسدودیت حساب",
    message: "حساب کاربری شما مجدداً فعال شد",
  }).catch(() => undefined);

  return publicUser(updated);
}

export async function updateUserRole(userId: string, input: UpdateUserRoleInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound("کاربر پیدا نشد");

  const updated = await prisma.user.update({ where: { id: userId }, data: { role: input.role } });
  return publicUser(updated);
}

// ----------------------------------------------------------------------------
// مدیریت نشست‌های یک کاربر از پنل ادمین
// ----------------------------------------------------------------------------

export async function listUserSessions(userId: string) {
  return prisma.userSession.findMany({
    where: { userId },
    orderBy: { lastActivityAt: "desc" },
  });
}

export async function revokeUserSessionAdmin(userId: string, sessionId: string): Promise<void> {
  const session = await prisma.userSession.findUnique({ where: { id: sessionId } });
  if (!session || session.userId !== userId) throw ApiError.notFound("نشست پیدا نشد");
  await revokeSession(sessionId);
}

export async function revokeAllUserSessionsAdmin(userId: string): Promise<void> {
  await revokeAllSessions(userId);
}
