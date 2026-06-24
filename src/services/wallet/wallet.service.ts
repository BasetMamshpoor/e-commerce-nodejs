import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { parsePagination, buildPaginationMeta } from "../../utils/pagination";
import { getGateway } from "../payment/payment.factory";
import { getPaymentGatewayBySlug } from "../payment/payment-gateway-admin.service";
import { env } from "../../config/env";
import { Wallet } from "../../generated/prisma";

// ----------------------------------------------------------------------------
// کیف پول — آیتم ۱۲. شارژ کیف پول از طریق درگاه پرداخت انجام می‌شود (همان
// اینترفیس IPaymentGateway که برای پرداخت سفارش هم استفاده می‌شود).
// ----------------------------------------------------------------------------

export async function getOrCreateWallet(userId: string): Promise<Wallet> {
  const existing = await prisma.wallet.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.wallet.create({ data: { userId, balance: 0 } });
}

export async function getWalletOverview(userId: string, page?: number, limit?: number) {
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

export async function initiateWalletCharge(
  userId: string,
  amount: number,
  gatewaySlug: string
) {
  const gatewayRecord = await getPaymentGatewayBySlug(gatewaySlug);
  const gateway = getGateway(gatewayRecord.slug);

  const transaction = await prisma.transaction.create({
    data: { userId, gatewayId: gatewayRecord.id, type: "WALLET_CHARGE", amount, status: "PENDING" },
  });

  const result = await gateway.initiatePayment({
    orderId: transaction.id, // برای شارژ کیف‌پول، شناسه‌ی تراکنش به‌جای سفارش استفاده می‌شود
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
  userId: string,
  transactionId: string,
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

  const gateway = getGateway(gatewayRecord.slug);
  const result = await gateway.verifyPayment({
    orderId: transaction.id,
    amount: transaction.amount,
    providerParams,
  });

  if (!result.success) {
    await prisma.transaction.update({ where: { id: transaction.id }, data: { status: "FAILED" } });
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

  return { alreadyProcessed: false, balance: wallet.balance + transaction.amount };
}
