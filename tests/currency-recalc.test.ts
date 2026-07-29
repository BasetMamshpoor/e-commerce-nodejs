import { prisma } from "../src/lib/prisma";
import { recalculateProductsForCurrency } from "../src/services/exchangeRateFetcher";
import { buildComboKey } from "../src/utils/variantCombo";

// ----------------------------------------------------------------------------
// این باگ حین اضافه‌کردن Redis پیدا شد: recalculateProductsForCurrency
// (که هر بار نرخ ارز رفرش می‌شود اجرا می‌شود) بازه‌ی قیمتی محصول
// (minPrice/maxPrice) را به قیمت تک تنوعِ پیش‌فرض کولاپس می‌کرد، و اثر
// مدیفایرهای هر تنوع دیگر (که در تسک‌های قبلی برای همین محصولات درست
// شده بود) را از بین می‌برد. این تست تضمین می‌کند بعد از رفرش نرخ ارز،
// بازه‌ی قیمتی همچنان درست (متفاوت بین تنوع‌ها) باقی می‌ماند.
// ----------------------------------------------------------------------------

describe("recalculateProductsForCurrency (رگرسیون min/max بعد از رفرش نرخ ارز)", () => {
  let currencyId: number;
  let productId: number;
  let cheapVariantId: number;
  let expensiveVariantId: number;
  let colorAttrId: number;

  beforeAll(async () => {
    const currency = await prisma.currency.create({
      data: { code: `RCT${Date.now() % 100000}`, name: "Recalc Test Currency", isActive: true, currentRate: 100000 },
    });
    currencyId = currency.id;

    const attr = await prisma.attribute.create({
      data: { name: "Color-RecalcTest", slug: `color-recalc-${Date.now()}`, inputType: "COLOR", isVariant: true },
    });
    colorAttrId = attr.id;
    const red = await prisma.attributeValue.create({ data: { attributeId: attr.id, value: "Red" } });
    const blue = await prisma.attributeValue.create({ data: { attributeId: attr.id, value: "Blue" } });

    const product = await prisma.product.create({
      data: {
        name: `Recalc Test Product ${Date.now()}`,
        slug: `recalc-test-product-${Date.now()}`,
        basePrice: 0,
        pricingMode: "CURRENCY_BASED",
        currencyId,
        sourcePrice: 10,
        priceBufferPercent: 0,
        currentPriceIRT: 1000000,
        status: "PUBLISHED",
      },
    });
    productId = product.id;

    const cheap = await prisma.productVariant.create({
      data: {
        productId, sku: `recalc-cheap-${Date.now()}`, stock: 5, isActive: true, isDefault: true,
        comboKey: buildComboKey([red.id]),
        attributeValues: { create: [{ attributeValueId: red.id }] },
      },
    });
    cheapVariantId = cheap.id;

    const expensive = await prisma.productVariant.create({
      data: {
        productId, sku: `recalc-expensive-${Date.now()}`, stock: 5, isActive: true,
        comboKey: buildComboKey([blue.id]),
        attributeValues: { create: [{ attributeValueId: blue.id, modifierType: "PERCENTAGE", modifierValue: 20 }] },
      },
    });
    expensiveVariantId = expensive.id;
  });

  afterAll(async () => {
    await prisma.productVariant.deleteMany({ where: { id: { in: [cheapVariantId, expensiveVariantId] } } });
    await prisma.product.deleteMany({ where: { id: productId } });
    await prisma.attributeValue.deleteMany({ where: { attributeId: colorAttrId } });
    await prisma.attribute.deleteMany({ where: { id: colorAttrId } });
    await prisma.currency.deleteMany({ where: { id: currencyId } });
  });

  it("بعد از رفرش نرخ ارز، minPrice/maxPrice باید همچنان بین تنوع‌ها فرق داشته باشد", async () => {
    await prisma.currency.update({ where: { id: currencyId }, data: { currentRate: 100000 } });
    await recalculateProductsForCurrency(currencyId, 100000);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    // ارزان (بدون مدیفایر): 10 * 100,000 = 1,000,000
    // گران (٪۲۰ بیشتر): 12 * 100,000 = 1,200,000
    expect(product?.minPrice).toBe(1000000);
    expect(product?.maxPrice).toBe(1200000);
    expect(product?.minPrice).not.toBe(product?.maxPrice);
  });

  it("بعد از تغییر نرخ ارز به مقدار دیگر، بازه‌ی قیمتی متناسب آپدیت و همچنان متفاوت می‌ماند", async () => {
    await prisma.currency.update({ where: { id: currencyId }, data: { currentRate: 200000 } });
    await recalculateProductsForCurrency(currencyId, 200000);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    expect(product?.minPrice).toBe(2000000);
    expect(product?.maxPrice).toBe(2400000);
  });
});
