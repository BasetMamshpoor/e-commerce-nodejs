import { prisma } from "../src/lib/prisma";
import { createComment } from "../src/services/comment/comment.service";
import { requestReturn } from "../src/services/order/order-return.service";
import { ApiError } from "../src/utils/ApiError";

// ----------------------------------------------------------------------------
// این باگ در حین رفع مورد ۶ (attachmentMediaIds کامنت) کشف شد: چون حالا
// mediaId ها می‌توانند مستقیماً در بدنه‌ی JSON فرستاده شوند (نه فقط از
// طریق میدل‌ور آپلود که خودش رسانه را تازه با uploadedById درست می‌سازد)،
// بدون یک بررسی مالکیت، هر کاربری می‌توانست شناسه‌ی رسانه‌ی کاربر دیگری
// را به کامنت/تیکت/درخواست مرجوعی خودش وصل کند. همین باگ در ticket.service.ts
// (که الگوی اولیه بود) و order-return.service.ts هم از قبل وجود داشت.
// ----------------------------------------------------------------------------

describe("مالکیت رسانه‌های پیوست‌شده (کامنت / مرجوعی سفارش)", () => {
  let ownerUserId: number;
  let attackerUserId: number;
  let ownerMediaId: number;
  let productId: number;
  let orderId: number;
  let orderItemId: number;

  beforeAll(async () => {
    const owner = await prisma.user.create({
      data: { phone: `0900${Date.now()}`.slice(0, 15), role: "CUSTOMER" },
    });
    ownerUserId = owner.id;

    const attacker = await prisma.user.create({
      data: { phone: `0901${Date.now()}`.slice(0, 15), role: "CUSTOMER" },
    });
    attackerUserId = attacker.id;

    const media = await prisma.media.create({
      data: {
        fileName: `test-${Date.now()}.jpg`,
        originalName: "test.jpg",
        filePath: "comments/test.jpg",
        url: "/uploads/comments/test.jpg",
        mimeType: "image/jpeg",
        size: 100,
        type: "IMAGE",
        entityType: "comments",
        uploadedById: ownerUserId,
      },
    });
    ownerMediaId = media.id;

    const product = await prisma.product.create({
      data: {
        name: `Media Ownership Test Product ${Date.now()}`,
        slug: `media-ownership-test-${Date.now()}`,
        basePrice: 10000,
        status: "PUBLISHED",
      },
    });
    productId = product.id;

    const variant = await prisma.productVariant.create({
      data: { productId, sku: `media-own-test-${Date.now()}`, stock: 5, isActive: true },
    });

    const order = await prisma.order.create({
      data: {
        userId: attackerUserId,
        orderNumber: `TESTORD${Date.now()}`,
        status: "DELIVERED",
        subtotal: 10000,
        totalAmount: 10000,
        shippingCost: 0,
        items: {
          create: [{ variantId: variant.id, productName: "Test Item", quantity: 1, price: 10000, finalPriceIRT: 10000 }],
        },
      },
    });
    orderId = order.id;
    const items = await prisma.orderItem.findMany({ where: { orderId } });
    orderItemId = items[0].id;
  });

  afterAll(async () => {
    await prisma.orderReturn.deleteMany({ where: { orderId } }).catch(() => {});
    await prisma.orderItem.deleteMany({ where: { orderId } }).catch(() => {});
    await prisma.order.deleteMany({ where: { id: orderId } }).catch(() => {});
    await prisma.comment.deleteMany({ where: { commentableId: productId, commentableType: "PRODUCT" } }).catch(() => {});
    await prisma.productVariant.deleteMany({ where: { productId } }).catch(() => {});
    await prisma.product.deleteMany({ where: { id: productId } }).catch(() => {});
    await prisma.media.deleteMany({ where: { id: ownerMediaId } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [ownerUserId, attackerUserId] } } }).catch(() => {});
  });

  it("نباید بگذارد کاربری رسانه‌ی متعلق به کاربر دیگر را به کامنت خودش وصل کند", async () => {
    await expect(
      createComment(attackerUserId, "PRODUCT", productId, { content: "test comment" } as never, [ownerMediaId])
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("باید بگذارد کاربر رسانه‌ی خودش را به کامنت وصل کند", async () => {
    const comment = await createComment(ownerUserId, "PRODUCT", productId, { content: "test comment" } as never, [ownerMediaId]);
    expect(comment).toBeDefined();
  });

  it("نباید بگذارد کاربری رسانه‌ی متعلق به کاربر دیگر را به درخواست مرجوعی خودش وصل کند", async () => {
    await expect(
      requestReturn(attackerUserId, orderId, {
        orderItemId,
        reason: "test",
        imageMediaIds: [ownerMediaId],
      } as never)
    ).rejects.toBeInstanceOf(ApiError);
  });
});
