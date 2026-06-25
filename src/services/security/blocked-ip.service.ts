import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { CreateBlockedIpInput } from "../../validations/blocked-ip.validation";
import { BlockedIp } from "../../generated/prisma";

export async function blockIp(input: CreateBlockedIpInput): Promise<BlockedIp> {
  const existing = await prisma.blockedIp.findUnique({ where: { ip: input.ip } });
  if (existing) {
    return prisma.blockedIp.update({
      where: { id: existing.id },
      data: { reason: input.reason, expiresAt: input.expiresAt },
    });
  }
  return prisma.blockedIp.create({ data: input });
}

export async function unblockIp(id: string): Promise<void> {
  const blocked = await prisma.blockedIp.findUnique({ where: { id } });
  if (!blocked) throw ApiError.notFound("این آی‌پی در لیست مسدودها پیدا نشد");
  await prisma.blockedIp.delete({ where: { id } });
}

export async function listBlockedIps(): Promise<BlockedIp[]> {
  return prisma.blockedIp.findMany({ orderBy: { blockedAt: "desc" } });
}
