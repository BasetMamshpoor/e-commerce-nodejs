import { prisma } from "../src/lib/prisma";
import { recomputeProductAggregates } from "../src/services/catalog/product.service";
import { getCart } from "../src/services/shopping/cart.service";
import { evaluateDiscountCode } from "../src/services/discount/discount-apply.service";
import { buildComboKey } from "../src/utils/variantCombo";

// نکته: ستون ProductVariant.comboKey تازه به schema.prisma اضافه شده و
// کلاینت Prisma این محیط هنوز regenerate نشده (چون این محیط به
// binaries.prisma.sh دسترسی ندارد)، پس هنوز comboKey را نمی‌شناسد و
// prisma.productVariant.create مقدارش را قبول نمی‌کند. به همین دلیل، فقط
// برای ساخت داده‌ی تست از SQL خام استفاده می‌کنیم؛ خودِ اپلیکیشن
// (product-variant.service.ts, product.service.ts) comboKey را از طریق
// کلاینت واقعی ست می‌کند و بعد از regenerate شدن کلاینت درست کار می‌کند.
async function createVariantRaw(input: {
  productId: number;
  sku: string;
  priceAdjustment: number;
  stock: number;
  attributeValueIds: number[];
}): Promise<number> {
  const comboKey = buildComboKey(input.attributeValueIds);
  const rows = await prisma.$queryRaw<{ id: number }[]>`
    INSERT INTO "ProductVariant" ("productId", sku, "priceAdjustment", stock, "isActive", "comboKey", "createdAt", "updatedAt")
    VALUES (${input.productId}, ${input.sku}, ${input.priceAdjustment}, ${input.stock}, true, ${comboKey}, now(), now())
    RETURNING id
  `;
  return rows[0].id;
}

// ----------------------------------------------------------------------------
// این تست‌ها سناریوی واقعی «محصول + تنوع‌های ترکیبی (رنگ/سایز/ارز) + سبد
// خرید + کد تخفیف» را با داده‌ی واقعی در دیتابیس شبیه‌سازی می‌کنند تا سه
// باگی که در بازبینی سیستم قیمت‌گذاری پیدا شد دیگر برنگردند:
//
//   ۱) modifierValue های مقدار ویژگی (رنگ/سایز) روی قیمت واقعی سبد خرید
//      اثر نمی‌گذاشت (فقط priceAdjustment دیده می‌شد).
//   ۲) minPrice/maxPrice محصول ارزی همیشه با هم برابر بود (تفاوت تنوع‌ها
//      نادیده گرفته می‌شد).
//   ۳) اعمال کد تخفیف روی سبد خرید به‌خاطر ترکیب نامعتبر include/select در
//      Prisma با خطای 500 کرش می‌کرد.
// ----------------------------------------------------------------------------

describe("قیمت‌گذاری تنوع محصول (priceAdjustment + modifierValue)", () => {
  let sizeAttrId: number;
  let sizeSmallId: number;
  let sizeXlId: number;
  let fixedProductId: number;
  let fixedVariantCheapId: number;
  let fixedVariantExpensiveId: number;

  let colorAttrId: number;
  let colorRedId: number;
  let colorBlueId: number;
  let currencyId: number;
  let currencyProductId: number;
  let currencyVariantCheapId: number;
  let currencyVariantExpensiveId: number;

  const guestToken = `test-variant-pricing-${Date.now()}`;
  let discountCodeId: number;
  let discountCodeStr: string;

  beforeAll(async () => {
    const sizeAttr = await prisma.attribute.create({
      data: { name: "Size-Test", slug: `size-test-${Date.now()}`, inputType: "SELECT", isVariant: true },
    });
    sizeAttrId = sizeAttr.id;
    const small = await prisma.attributeValue.create({ data: { attributeId: sizeAttrId, value: "S" } });
    const xl = await prisma.attributeValue.create({ data: { attributeId: sizeAttrId, value: "XL" } });
    sizeSmallId = small.id;
    sizeXlId = xl.id;

    // محصول با قیمت‌گذاری ثابت تومانی (FIXED_IRT): basePrice = 100,000
    // تنوع «ارزان» بدون هیچ تعدیلی، تنوع «گران» هم priceAdjustment و هم
    // modifierValue روی همان مقدار ویژگی (XL) دارد.
    const fixedProduct = await prisma.product.create({
      data: {
        name: `Test Fixed Product ${Date.now()}`,
        slug: `test-fixed-product-${Date.now()}`,
        basePrice: 100000,
        pricingMode: "FIXED_IRT",
        status: "PUBLISHED",
      },
    });
    fixedProductId = fixedProduct.id;

    const cheapVariantId = await createVariantRaw({
      productId: fixedProductId,
      sku: `fixed-cheap-${Date.now()}`,
      priceAdjustment: 0,
      stock: 10,
      attributeValueIds: [sizeSmallId],
    });
    await prisma.productVariantAttributeValue.create({
      data: { variantId: cheapVariantId, attributeValueId: sizeSmallId },
    });
    fixedVariantCheapId = cheapVariantId;

    const expensiveVariantId = await createVariantRaw({
      productId: fixedProductId,
      sku: `fixed-expensive-${Date.now()}`,
      priceAdjustment: 5000, // تعدیل دستیِ کل تنوع
      stock: 10,
      attributeValueIds: [sizeXlId],
    });
    await prisma.productVariantAttributeValue.create({
      data: { variantId: expensiveVariantId, attributeValueId: sizeXlId, modifierType: "FIXED_IRT", modifierValue: 20000 },
    });
    fixedVariantExpensiveId = expensiveVariantId;

    // محصول با قیمت‌گذاری ارزی: sourcePrice = 10 (مثلاً دلار)، نرخ ارز = 100,000
    const currency = await prisma.currency.create({
      data: { code: `TST${Date.now() % 100000}`, name: "Test Currency", isActive: true, currentRate: 100000 },
    });
    currencyId = currency.id;

    const colorAttr = await prisma.attribute.create({
      data: { name: "Color-Test", slug: `color-test-${Date.now()}`, inputType: "COLOR", isVariant: true },
    });
    colorAttrId = colorAttr.id;
    const red = await prisma.attributeValue.create({ data: { attributeId: colorAttrId, value: "Red" } });
    const blue = await prisma.attributeValue.create({ data: { attributeId: colorAttrId, value: "Blue" } });
    colorRedId = red.id;
    colorBlueId = blue.id;

    const currencyProduct = await prisma.product.create({
      data: {
        name: `Test Currency Product ${Date.now()}`,
        slug: `test-currency-product-${Date.now()}`,
        basePrice: 0,
        pricingMode: "CURRENCY_BASED",
        currencyId,
        sourcePrice: 10,
        priceBufferPercent: 0,
        currentPriceIRT: 1000000,
        status: "PUBLISHED",
      },
    });
    currencyProductId = currencyProduct.id;

    const cheapCurrencyVariantId = await createVariantRaw({
      productId: currencyProductId,
      sku: `cur-cheap-${Date.now()}`,
      priceAdjustment: 0,
      stock: 10,
      attributeValueIds: [colorRedId],
    });
    await prisma.productVariantAttributeValue.create({
      data: { variantId: cheapCurrencyVariantId, attributeValueId: colorRedId },
    });
    currencyVariantCheapId = cheapCurrencyVariantId;

    const expensiveCurrencyVariantId = await createVariantRaw({
      productId: currencyProductId,
      sku: `cur-expensive-${Date.now()}`,
      priceAdjustment: 0,
      stock: 10,
      attributeValueIds: [colorBlueId],
    });
    await prisma.productVariantAttributeValue.create({
      data: { variantId: expensiveCurrencyVariantId, attributeValueId: colorBlueId, modifierType: "PERCENTAGE", modifierValue: 10 },
    });
    currencyVariantExpensiveId = expensiveCurrencyVariantId;

    const discountCode = await prisma.discountCode.create({
      data: { code: `VARTEST${Date.now()}`, type: "PERCENT", value: 10, isActive: true },
    });
    discountCodeId = discountCode.id;
    discountCodeStr = discountCode.code;

    const cart = await prisma.cart.create({ data: { guestToken } });
    await prisma.cartItem.create({
      data: { cartId: cart.id, variantId: fixedVariantExpensiveId, quantity: 1 },
    });
  });

  afterAll(async () => {
    const cart = await prisma.cart.findUnique({ where: { guestToken } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      await prisma.cart.delete({ where: { id: cart.id } });
    }
    await prisma.discountCode.delete({ where: { id: discountCodeId } });
    await prisma.productVariant.deleteMany({
      where: { id: { in: [fixedVariantCheapId, fixedVariantExpensiveId, currencyVariantCheapId, currencyVariantExpensiveId] } },
    });
    await prisma.product.deleteMany({ where: { id: { in: [fixedProductId, currencyProductId] } } });
    await prisma.attributeValue.deleteMany({ where: { attributeId: { in: [sizeAttrId, colorAttrId] } } });
    await prisma.attribute.deleteMany({ where: { id: { in: [sizeAttrId, colorAttrId] } } });
    await prisma.currency.delete({ where: { id: currencyId } });
  });

  it("سبد خرید باید هم priceAdjustment و هم modifierValue تنوع انتخاب‌شده را لحاظ کند", async () => {
    const cart = await getCart({ guestToken });
    const item = cart.items.find((i) => i.variantId === fixedVariantExpensiveId);
    expect(item).toBeDefined();
    // 100,000 (basePrice) + 5,000 (priceAdjustment) + 20,000 (modifier XL) = 125,000
    expect(item?.originalPrice).toBe(125000);
  });

  it("minPrice/maxPrice محصول FIXED_IRT باید بین تنوع‌های واقعی فرق داشته باشد", async () => {
    await recomputeProductAggregates(fixedProductId);
    const product = await prisma.product.findUnique({ where: { id: fixedProductId } });
    expect(product?.minPrice).toBe(100000);
    expect(product?.maxPrice).toBe(125000);
  });

  it("minPrice/maxPrice محصول ارزی نباید همیشه برابر باشد (رگرسیون باگ)", async () => {
    await recomputeProductAggregates(currencyProductId);
    const product = await prisma.product.findUnique({ where: { id: currencyProductId } });
    // ارزان: 10 * 100,000 = 1,000,000 | گران: (10 + 10*10%) * 100,000 = 1,100,000
    expect(product?.minPrice).toBe(1000000);
    expect(product?.maxPrice).toBe(1100000);
    expect(product?.minPrice).not.toBe(product?.maxPrice);
  });

  it("اعمال کد تخفیف روی سبد خرید نباید کرش کند (رگرسیون باگ include/select)", async () => {
    const result = await evaluateDiscountCode(discountCodeStr, { guestToken });
    expect(result.cartTotal).toBeGreaterThan(0);
    expect(result.discountAmount).toBeGreaterThan(0);
  });
});
