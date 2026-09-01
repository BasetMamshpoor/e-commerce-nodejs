import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { parsePagination, buildPaginationMeta } from "../../utils/pagination";
import { getGateway } from "../payment/payment.factory";
import { getPaymentGatewayBySlug } from "../payment/payment-gateway-admin.service";
import { env } from "../../config/env";
import { notifyUser } from "../notification/notification.service";
import { Wallet } from "../../generated/prisma";

export async function getOrCreateWallet(userId: number): Promise<Wallet> {
  const existing = await prisma.wallet.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.wallet.create({ data: { userId, balance: 0 } });
}

export async function getWalletOverview(userId: number, page?: number, limit?: number) {
  const wallet = await getOrCreateWallet(userId);
  const pagination = parsePagination({ page, limit });

  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.walletTransaction.count({ where: { walletId: wallet.id } }),
  ]);

  return { balance: wallet.balance, transactions, meta: buildPaginationMeta(total, pagination) };
}

export async function initiateWalletCharge(userId: number, amount: number, gatewaySlug: string) {
  const gatewayRecord = await getPaymentGatewayBySlug(gatewaySlug);
  const gateway = getGateway(gatewayRecord.slug);

  const transaction = await prisma.transaction.create({
    data: { userId, gatewayId: gatewayRecord.id, type: "WALLET_CHARGE", amount, status: "PENDING" },
  });

  const result = await gateway.initiatePayment({
    orderId: String(transaction.id),
    amount,
    description: "شارژ کیف پول",
    callbackUrl: `${env.APP_BASE_URL}/api/v1/wallet/charge/${transaction.id}/verify`,
  });

  await prisma.transaction.update({
    where: { id: transaction.id },
    data: { refId: result.gatewayRefId },
  });

  return { transactionId: transaction.id, redirectUrl: result.redirectUrl };
}

export async function verifyWalletCharge(
  userId: number,
  transactionId: number,
  providerParams: Record<string, string>
) {
  const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!transaction || transaction.userId !== userId || transaction.type !== "WALLET_CHARGE") {
    throw ApiError.notFound("تراکنش پیدا نشد");
  }
  if (transaction.status === "SUCCESS") {
    return { alreadyProcessed: true, balance: (await getOrCreateWallet(userId)).balance };
  }
  if (!transaction.gatewayId) throw ApiError.badRequest("این تراکنش به درگاهی متصل نیست");

  const gatewayRecord = await prisma.paymentGateway.findUnique({
    where: { id: transaction.gatewayId },
  });
  if (!gatewayRecord) throw ApiError.notFound("درگاه پرداخت پیدا نشد");

  // Atomically claim this transaction BEFORE calling out to the gateway.
  // The status==="SUCCESS" check above only protects against a SECOND
  // call arriving after the FIRST has already fully committed — it does
  // nothing for two concurrent calls that both read a not-yet-SUCCESS
  // status before either commits (double-click, a retried request, a
  // page effect firing twice), which could both pass the check, both
  // call the actual payment gateway (a real network round-trip that
  // widens this window a lot), and both reach the wallet increment below
  // — a genuine double-credit of real money into the wallet balance, not
  // just a duplicated status transition. updateMany's WHERE clause
  // (status: "PENDING") makes claiming this transaction a compare-and-
  // swap: only one concurrent request can succeed; the other gets
  // claim.count === 0 and bails out immediately.
  const claim = await prisma.transaction.updateMany({
    where: { id: transaction.id, status: "PENDING" },
    data: { status: "FAILED" },
  });
  if (claim.count === 0) {
    throw ApiError.conflict("این تراکنش هم‌اکنون در حال بررسی یا قبلاً بررسی شده است");
  }

  const gateway = getGateway(gatewayRecord.slug);
  const result = await gateway.verifyPayment({
    orderId: String(transaction.id),
    amount: transaction.amount,
    providerParams,
  });

  if (!result.success) {
    // Already marked FAILED by the claim above — nothing further to do.
    throw ApiError.badRequest("پرداخت ناموفق بود");
  }

  const wallet = await getOrCreateWallet(userId);

  await prisma.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id: transaction.id },
      data: { status: "SUCCESS", refId: result.refId },
    });
    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: transaction.amount } },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "DEPOSIT",
        amount: transaction.amount,
        description: "شارژ کیف پول از درگاه پرداخت",
      },
    });
  });

  notifyUser({
    userId,
    type: "WALLET",
    title: "شارژ کیف پول",
    message: `کیف پول شما با موفقیت به مبلغ ${transaction.amount.toLocaleString("fa-IR")} تومان شارژ شد`,
  }).catch(() => undefined);

  return { alreadyProcessed: false, balance: wallet.balance + transaction.amount };
}
