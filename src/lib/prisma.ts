// ----------------------------------------------------------------------------
// نکته مهم درباره Prisma 7:
// از نسخه ۷ به بعد، Prisma Client دیگر مستقیماً از پکیج "@prisma/client"
// ساخته نمی‌شود؛ بلکه طبق output مشخص‌شده در prisma/schema.prisma
// (در این پروژه: "../src/generated/prisma") در همان مسیر پروژه تولید می‌شود.
//
// قبل از اجرای پروژه حتماً دستور زیر را بزنید:
//   npx prisma generate
//
// اگر مسیر output را در schema.prisma عوض کردید، مسیر import پایین را هم
// همگام کنید.
// ----------------------------------------------------------------------------

import { PrismaClient } from "../generated/prisma";
import { isProd } from "../config/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

// در محیط dev به‌خاطر ری‌استارت‌های مکرر ts-node-dev، یک نمونه را روی
// global نگه می‌داریم تا چندین اتصال هم‌زمان به دیتابیس باز نشود.
export const prisma: PrismaClient =
  global.__prisma__ ??
  new PrismaClient({
        adapter,
    log: isProd ? ["error", "warn"] : ["query", "error", "warn"],
  });

if (!isProd) {
  global.__prisma__ = prisma;
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
    await pool.end();
}
