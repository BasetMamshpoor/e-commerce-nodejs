import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { CartIdentity } from "../../utils/cartIdentity";
import { getCartLineItemsForDiscount } from "../shopping/cart.service";
import { DiscountCode } from "../../generated/prisma";

// ----------------------------------------------------------------------------
// نکته‌ی طراحی مهم درباره‌ی کدهای محصول/دسته‌محور:
// اگر کد به چند محصول/دسته‌بندی خاص محدود شده باشد، تخفیف فقط روی همان
// بخش از سبد که واجد شرایط است محاسبه می‌شود، نه کل سبد (دقیقاً مثل رفتار
// «۱۰٪ تخفیف روی جوراب‌ها» در اکثر فروشگاه‌های اینترنتی). محدودیت
// minCartAmount اما روی کل مبلغ سبد (بعد از تخفیف‌های خودِ تنوع‌ها، قبل از
// کد تخفیف) بررسی می‌شود — یعنی «حداقل سبد» به کل خریدتان اشاره دارد، نه
// فقط بخش واجدشرایط.
// ----------------------------------------------------------------------------

export interface DiscountEvaluationResult {
  discountCodeId: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  cartTotal: number;
  eligibleSubtotal: number;
  discountAmount: number;
  payableTotal: number;
  eligibleVariantIds: string[];
}

type DiscountCodeWithRestrictions = DiscountCode & {
  products: { productId: string }[];
  categories: { categoryId: string }[];
  users: { userId: string }[];
};

async function findActiveCodeOrThrow(rawCode: string): Promise<DiscountCodeWithRestrictions> {
  const code = rawCode.trim().toUpperCase();

  const discountCode = (await prisma.discountCode.findUnique({
    where: { code },
    include: {
      products: { select: { productId: true } },
      categories: { select: { categoryId: true } },
      users: { select: { userId: true } },
    },
  })) as DiscountCodeWithRestrictions | null;

  if (!discountCode) throw ApiError.notFound("کد تخفیف پیدا نشد");
  if (!discountCode.isActive) throw ApiError.badRequest("این کد تخفیف دیگر فعال نیست");

  const now = new Date();
  if (discountCode.startsAt && discountCode.startsAt > now) {
    throw ApiError.badRequest("این کد تخفیف هنوز فعال نشده است");
  }
  if (discountCode.expiresAt && discountCode.expiresAt < now) {
    throw ApiError.badRequest("این کد تخفیف منقضی شده است");
  }
  if (discountCode.maxUsage !== null && discountCode.usageCount >= discountCode.maxUsage) {
    throw ApiError.badRequest("ظرفیت استفاده از این کد تخفیف به پایان رسیده است");
  }

  return discountCode;
}

async function assertUserEligibility(
  discountCode: DiscountCodeWithRestrictions,
  userId?: string
): Promise<void> {
  const requiresLogin = discountCode.users.length > 0 || discountCode.maxUsagePerUser !== null;

  if (requiresLogin && !userId) {
    throw ApiError.badRequest("برای استفاده از این کد تخفیف باید وارد حساب کاربری خود شوید");
  }

  if (discountCode.users.length > 0 && userId) {
    const allowed = discountCode.users.some((u) => u.userId === userId);
    if (!allowed) {
      throw ApiError.badRequest("این کد تخفیف برای حساب شما قابل استفاده نیست");
    }
  }

  if (discountCode.maxUsagePerUser !== null && userId) {
    const usedByUser = await prisma.discountCodeUsage.count({
      where: { discountCodeId: discountCode.id, userId },
    });
    if (usedByUser >= discountCode.maxUsagePerUser) {
      throw ApiError.badRequest(
        "شما قبلاً حداکثر تعداد مجاز استفاده از این کد تخفیف را انجام داده‌اید"
      );
    }
  }
}

export function isItemEligible(
  discountCode: DiscountCodeWithRestrictions,
  item: { productId: string; categoryIds: string[] }
): boolean {
  const hasProductRestriction = discountCode.products.length > 0;
  const hasCategoryRestriction = discountCode.categories.length > 0;

  if (!hasProductRestriction && !hasCategoryRestriction) return true;

  const productMatch = hasProductRestriction
    ? discountCode.products.some((p) => p.productId === item.productId)
    : false;
  const categoryMatch = hasCategoryRestriction
    ? item.categoryIds.some((cid) => discountCode.categories.some((c) => c.categoryId === cid))
    : false;

  return productMatch || categoryMatch;
}

export function calculateDiscountAmount(
  discountCode: DiscountCodeWithRestrictions,
  eligibleSubtotal: number
): number {
  if (eligibleSubtotal <= 0) return 0;

  const raw =
    discountCode.type === "PERCENT"
      ? Math.floor((eligibleSubtotal * discountCode.value) / 100)
      : discountCode.value;

  const cappedByMax = discountCode.maxDiscountAmount
    ? Math.min(raw, discountCode.maxDiscountAmount)
    : raw;

  return Math.min(cappedByMax, eligibleSubtotal);
}

export async function evaluateDiscountCode(
  rawCode: string,
  identity: CartIdentity
): Promise<DiscountEvaluationResult> {
  const discountCode = await findActiveCodeOrThrow(rawCode);
  const userId = "userId" in identity ? identity.userId : undefined;

  await assertUserEligibility(discountCode, userId);

  const cartItems = await getCartLineItemsForDiscount(identity);
  if (cartItems.length === 0) {
    throw ApiError.badRequest("سبد خرید شما خالی است");
  }

  const cartTotal = cartItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  if (discountCode.minCartAmount && cartTotal < discountCode.minCartAmount) {
    throw ApiError.badRequest(
      `حداقل مبلغ سبد خرید برای استفاده از این کد ${discountCode.minCartAmount.toLocaleString(
        "fa-IR"
      )} تومان است`
    );
  }

  const eligibleItems = cartItems.filter((item) => isItemEligible(discountCode, item));
  const isRestricted = discountCode.products.length > 0 || discountCode.categories.length > 0;

  if (isRestricted && eligibleItems.length === 0) {
    throw ApiError.badRequest("هیچ‌کدام از کالاهای سبد خرید شما شامل این کد تخفیف نمی‌شوند");
  }

  const eligibleSubtotal = eligibleItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const discountAmount = calculateDiscountAmount(discountCode, eligibleSubtotal);

  return {
    discountCodeId: discountCode.id,
    code: discountCode.code,
    type: discountCode.type,
    value: discountCode.value,
    cartTotal,
    eligibleSubtotal,
    discountAmount,
    payableTotal: cartTotal - discountAmount,
    eligibleVariantIds: eligibleItems.map((i) => i.variantId),
  };
}

// ----------------------------------------------------------------------------
// این تابع را ماژول سفارش (که در ادامه ساخته می‌شود) بعد از ثبت موفق سفارش
// صدا می‌زند تا شمارنده‌ی usageCount و تاریخچه‌ی DiscountCodeUsage ثبت شود.
// عمداً اینجا صدا زده نمی‌شود چون تا قبل از قطعی‌شدن سفارش/پرداخت، کد
// «مصرف‌شده» محسوب نمی‌شود.
// ----------------------------------------------------------------------------

export async function recordDiscountCodeUsage(
  params: {
    discountCodeId: string;
    userId: string;
    orderId: string;
    discountAmount: number;
  },
  client: Pick<typeof prisma, "discountCodeUsage" | "discountCode"> = prisma
): Promise<void> {
  await client.discountCodeUsage.create({
    data: {
      discountCodeId: params.discountCodeId,
      userId: params.userId,
      orderId: params.orderId,
      discountAmount: params.discountAmount,
    },
  });
  await client.discountCode.update({
    where: { id: params.discountCodeId },
    data: { usageCount: { increment: 1 } },
  });
}
