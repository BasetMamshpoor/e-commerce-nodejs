import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const SALT_ROUNDS = 10;

// هش رمز عبور کاربر (bcrypt — عمداً کند، برای مقاومت در برابر brute-force)
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function comparePassword(
  plain: string,
  hashed: string
): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

// هش سریع (sha256) صرفاً برای ذخیره‌ی نسخه‌ی قابل‌جستجوی refresh token در دیتابیس.
// از bcrypt برای این مورد استفاده نمی‌کنیم چون لازم است با یک کوئری مستقیم
// (token == hashed) قابل پیدا کردن باشد، نه مقایسه‌ی یک‌به‌یک.
export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}
