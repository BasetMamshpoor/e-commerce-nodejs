import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { parsePagination, buildPaginationMeta } from "../../utils/pagination";
import { notifyUser } from "../notification/notification.service";

export async function requestWithdrawal(userId: number, amount: number, description?: string) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet || wallet.balance < amount) {
    throw ApiError.badRequest("موجودی کیف پول کافی نیست");
  }

  return prisma.walletWithdrawal.create({
    data: { userId, amount, description, status: "PENDING" },
  });
}

export async function listMyWithdrawals(userId: number, page?: number, limit?: number) {
  const pagination = parsePagination({ page, limit });
  const where = { userId };

  const [items, total] = await Promise.all([
    prisma.walletWithdrawal.findMany({ where, orderBy: { createdAt: "desc" }, skip: pagination.skip, take: pagination.take }),
    prisma.walletWithdrawal.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(total, pagination) };
}

export async function listWithdrawalsAdmin(query: { page?: number; limit?: number; status?: string; userId?: number }) {
  const pagination = parsePagination({ page: query.page, limit: query.limit });
  const where: Record<string, unknown> = {};
  if (query.status) where.status = query.status;
  if (query.userId) where.userId = query.userId;

  const [items, total] = await Promise.all([
    prisma.walletWithdrawal.findMany({ where, orderBy: { createdAt: "desc" }, skip: pagination.skip, take: pagination.take, include: { user: { select: { id: true, fullName: true, phone: true, email: true } } } }),
    prisma.walletWithdrawal.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(total, pagination) };
}

export async function reviewWithdrawalAdmin(withdrawalId: number, status: "APPROVED" | "REJECTED", adminNote?: string) {
  const withdrawal = await prisma.walletWithdrawal.findUnique({ where: { id: withdrawalId } });
  if (!withdrawal) throw ApiError.notFound("درخواست برداشت پیدا نشد");
  if (withdrawal.status !== "PENDING") throw ApiError.conflict("این درخواست قبلاً بررسی شده است");

  if (status === "APPROVED") {
    const wallet = await prisma.wallet.findUnique({ where: { userId: withdrawal.userId } });
    if (!wallet || wallet.balance < withdrawal.amount) {
      throw ApiError.badRequest("موجودی کیف پول کاربر کافی نیست");
    }

    await prisma.$transaction(async (tx) => {
      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: withdrawal.amount } } });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "WITHDRAW",
          amount: withdrawal.amount,
          description: `برداشت از کیف پول - درخواست #${withdrawal.id}`,
        },
      });
      await tx.walletWithdrawal.update({ where: { id: withdrawalId }, data: { status: "APPROVED", adminNote, reviewedAt: new Date() } });
    });

    notifyUser({ userId: withdrawal.userId, type: "WALLET", title: "درخواست برداشت", message: `درخواست برداشت ${withdrawal.amount.toLocaleString("fa-IR")} تومان تایید شد` }).catch(() => undefined);
  } else {
    await prisma.walletWithdrawal.update({ where: { id: withdrawalId }, data: { status: "REJECTED", adminNote, reviewedAt: new Date() } });
    notifyUser({ userId: withdrawal.userId, type: "WALLET", title: "درخواست برداشت", message: "درخواست برداشت شما رد شد" }).catch(() => undefined);
  }

  return prisma.walletWithdrawal.findUniqueOrThrow({ where: { id: withdrawalId } });
}
