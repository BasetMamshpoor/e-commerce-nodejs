import { findProductByShortCodeInText } from "../productMatcher/productCode";
import { ProductLookupPort } from "../productMatcher/types";
import { ConversationContext } from "../types";
import { formatToman } from "../../utils/pricing";

// ----------------------------------------------------------------------------
// نکته‌ی خیلی مهم (طبق درخواست کارفرما): لایه‌ی هوش مصنوعی اصلاً نباید به
// دنیای بیرون از سایت/دیتابیس دسترسی داشته باشد. پس هرچه AI برای پاسخ‌دادن
// لازم دارد، اینجا از پشت ProductLookupPort جمع می‌کنیم (که ممکن است پشت
// صحنه کش‌شده باشد) و به‌عنوان یک context متنی در system prompt قرار
// می‌دهیم. پرامپت هم صریحاً از مدل می‌خواهد فقط از همین context استفاده
// کند و در غیر این صورت اطمینان کم گزارش بدهد.
//
// اگر پیام فعلی مشتری اسم/کد محصولی نداشت ولی مکالمه قبلاً روی یک محصول
// خاص فوکوس داشته (context.lastProductId)، همان را به‌جای جست‌وجوی
// عمومی در نظر می‌گیریم — دقیقاً همان منطق carryover لایه ۱.
// ----------------------------------------------------------------------------

export async function buildGroundedContext(
  lookup: ProductLookupPort,
  customerMessage: string,
  context: ConversationContext
): Promise<string> {
  const parts: string[] = [];

  let matchedProduct = await findProductByShortCodeInText(lookup, customerMessage);
  if (!matchedProduct && context.lastProductId) {
    matchedProduct = await lookup.findById(context.lastProductId);
  }

  if (matchedProduct) {
    const colors = [
      ...new Set(
        matchedProduct.variants
          .flatMap((v) => v.attributeValues)
          .filter((av) => av.attributeInputType === "COLOR")
          .map((av) => av.value)
      ),
    ];

    parts.push(
      [
        `محصول مرتبط با پیام مشتری:`,
        `نام: ${matchedProduct.name}`,
        matchedProduct.brandName ? `برند: ${matchedProduct.brandName}` : null,
        matchedProduct.shortDescription ? `توضیح کوتاه: ${matchedProduct.shortDescription}` : null,
        `قیمت: ${
          matchedProduct.minPrice === matchedProduct.maxPrice
            ? formatToman(matchedProduct.minPrice)
            : `از ${formatToman(matchedProduct.minPrice)} تا ${formatToman(matchedProduct.maxPrice)}`
        }`,
        `موجودی: ${matchedProduct.isInStock ? "موجود" : "ناموجود"}`,
        colors.length > 0 ? `رنگ‌های موجود: ${colors.join("، ")}` : null,
        matchedProduct.hasActiveDiscount ? "این محصول در حال حاضر تخفیف فعال دارد." : null,
      ]
        .filter(Boolean)
        .join("\n")
    );
  } else {
    // اگر کد محصول در پیام نبود، چند گزینه‌ی نزدیک را هم به‌عنوان راهنما می‌دهیم
    const { results: candidates } = await lookup.search(customerMessage, 3);
    if (candidates.length > 0) {
      parts.push(
        "محصولات نزدیک به موضوع پیام مشتری (مطمئن نیستیم دقیقاً کدومه):\n" +
          candidates
            .map((c) => `- ${c.name} (${c.isInStock ? "موجود" : "ناموجود"}, ${formatToman(c.minPrice)})`)
            .join("\n")
      );
    }
  }

  const brandCount = await lookup.countActiveBrands();
  parts.push(`تعداد برندهای فعال فروشگاه: ${brandCount}`);

  return parts.join("\n\n");
}
