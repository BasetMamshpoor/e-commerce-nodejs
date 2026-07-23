import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { CartIdentity } from "../../utils/cartIdentity";
import { computeProductEffectivePrice } from "../../utils/pricing";
import { Prisma } from "../../generated/prisma";

const CART_INCLUDE = {
  items: {
    include: {
      variant: {
        include: {
          product: {
            select: {
              id: true, name: true, slug: true, status: true,
              basePrice: true, discountType: true, discountValue: true,
              pricingMode: true, currentPriceIRT: true, sourcePrice: true,
              priceBufferPercent: true,
            },
          },
          attributeValues: {
            include: { attributeValue: { include: { attribute: true } } },
          },
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

function whereForIdentity(identity: CartIdentity) {
  return "userId" in identity ? { userId: identity.userId } : { guestToken: identity.guestToken };
}

async function findRawCart(identity: CartIdentity) {
  return prisma.cart.findUnique({
    where: whereForIdentity(identity),
    include: CART_INCLUDE,
  });
}

async function getOrCreateCart(identity: CartIdentity) {
  const where = whereForIdentity(identity);
  const existing = await prisma.cart.findUnique({ where });
  if (existing) return existing;
  return prisma.cart.create({ data: where });
}

export interface CartSummary {
  id: number | null;
  itemCount: number;
  subtotal: number;
  totalDiscount: number;
  total: number;
  items: Array<{
    id: number;
    variantId: number;
    productName: string;
    productSlug: string;
    image: string | null;
    attributesLabel: string;
    quantity: number;
    unitPrice: number;
    originalPrice: number;
    lineTotal: number;
    isAvailable: boolean;
    availableStock: number;
  }>;
}

function summarize(cart: Record<string, unknown> | null): CartSummary {
  if (!cart) {
    return { id: null, itemCount: 0, subtotal: 0, totalDiscount: 0, total: 0, items: [] };
  }

  const items = ((cart as { items: Array<Record<string, unknown>> }).items || []).map((item: Record<string, unknown>) => {
    const variant = item.variant as Record<string, unknown>;
    const product = variant.product as Record<string, unknown>;
    const pricingMode = product.pricingMode as string;
    const basePrice = pricingMode === "CURRENCY_BASED"
      ? ((product.currentPriceIRT as number) ?? (product.basePrice as number))
      : (product.basePrice as number);
    const priceAdjustment = variant.priceAdjustment as number;
    const discountType = product.discountType as string | null;
    const discountValue = product.discountValue as number | null;

    const price = computeProductEffectivePrice(
      basePrice,
      priceAdjustment,
      discountType as "PERCENT" | "FIXED" | null,
      discountValue,
      null,
      null
    );

    const isAvailable =
      (variant.isActive as boolean) &&
      (product.status as string) === "PUBLISHED" &&
      (variant.stock as number) > 0;

    const attributesLabel = (variant.attributeValues as Array<Record<string, unknown>>)
      .map((av: Record<string, unknown>) => {
        const attrVal = av.attributeValue as Record<string, unknown>;
        const attr = attrVal.attribute as Record<string, unknown>;
        return `${attr.name}: ${attrVal.value}`;
      })
      .join("، ");

    const productImage = (product as { image?: string }).image ?? null;

    return {
      id: item.id as number,
      variantId: variant.id as number,
      productName: product.name as string,
      productSlug: product.slug as string,
      image: productImage as string | null,
      attributesLabel,
      quantity: item.quantity as number,
      unitPrice: price.unitPrice,
      originalPrice: price.originalPrice,
      lineTotal: price.unitPrice * (item.quantity as number),
      isAvailable,
      availableStock: variant.stock as number,
    };
  });

  return {
    id: cart.id as number,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotal: items.reduce((sum, i) => sum + i.originalPrice * i.quantity, 0),
    totalDiscount: items.reduce((sum, i) => sum + (i.originalPrice - i.unitPrice) * i.quantity, 0),
    total: items.reduce((sum, i) => sum + i.lineTotal, 0),
    items,
  };
}

export async function getCart(identity: CartIdentity): Promise<CartSummary> {
  return summarize(await findRawCart(identity));
}

export async function addItem(identity: CartIdentity, variantId: number, quantity: number): Promise<{ cart: CartSummary; wasAdjusted: boolean }> {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: { select: { status: true } } },
  });

  if (!variant || !variant.isActive) {
    throw ApiError.notFound("این تنوع کالا پیدا نشد یا غیرفعال است");
  }
  if (variant.product.status !== "PUBLISHED") {
    throw ApiError.badRequest("این محصول در حال حاضر قابل خرید نیست");
  }
  if (variant.stock <= 0) {
    throw ApiError.conflict("این کالا فعلاً موجود نیست");
  }

  const cart = await getOrCreateCart(identity);

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
  });

  const desiredQty = (existing?.quantity ?? 0) + quantity;
  const finalQty = Math.min(desiredQty, variant.stock);

  if (existing) {
    await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: finalQty } });
  } else {
    await prisma.cartItem.create({ data: { cartId: cart.id, variantId, quantity: finalQty } });
  }

  return { cart: await getCart(identity), wasAdjusted: finalQty !== desiredQty };
}

export async function updateItemQuantity(identity: CartIdentity, itemId: number, quantity: number): Promise<{ cart: CartSummary; wasAdjusted: boolean }> {
  const cart = await findRawCart(identity);
  const item = (cart?.items as Array<Record<string, unknown>> | undefined)?.find((i: Record<string, unknown>) => i.id === itemId);
  if (!cart || !item) throw ApiError.notFound("آیتم سبد خرید پیدا نشد");

  if (quantity === 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
    return { cart: await getCart(identity), wasAdjusted: false };
  }

  const variant = item.variant as Record<string, unknown>;
  const finalQty = Math.min(quantity, variant.stock as number);
  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity: finalQty } });

  return { cart: await getCart(identity), wasAdjusted: finalQty !== quantity };
}

export async function removeItem(identity: CartIdentity, itemId: number): Promise<CartSummary> {
  const cart = await findRawCart(identity);
  const item = (cart?.items as Array<Record<string, unknown>> | undefined)?.find((i: Record<string, unknown>) => i.id === itemId);
  if (!cart || !item) throw ApiError.notFound("آیتم سبد خرید پیدا نشد");

  await prisma.cartItem.delete({ where: { id: itemId } });
  return getCart(identity);
}

export async function clearCart(identity: CartIdentity): Promise<CartSummary> {
  const cart = await findRawCart(identity);
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
  return getCart(identity);
}

export async function mergeGuestCartIntoUser(userId: number, guestToken: string): Promise<CartSummary> {
  const guestCart = await prisma.cart.findUnique({
    where: { guestToken },
    include: { items: true },
  });

  if (!guestCart || guestCart.items.length === 0) {
    return getCart({ userId });
  }

  const userCart = await getOrCreateCart({ userId });

  for (const guestItem of guestCart.items) {
    const variant = await prisma.productVariant.findUnique({ where: { id: guestItem.variantId } });
    if (!variant || !variant.isActive || variant.stock <= 0) continue;

    const existing = await prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: userCart.id, variantId: guestItem.variantId } },
    });

    const desiredQty = (existing?.quantity ?? 0) + guestItem.quantity;
    const finalQty = Math.min(desiredQty, variant.stock);

    if (existing) {
      await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: finalQty } });
    } else {
      await prisma.cartItem.create({
        data: { cartId: userCart.id, variantId: guestItem.variantId, quantity: finalQty },
      });
    }
  }

  await prisma.cart.delete({ where: { id: guestCart.id } });

  return getCart({ userId });
}

export interface CartLineItemForDiscount {
  variantId: number;
  productId: number;
  categoryIds: number[];
  quantity: number;
  unitPrice: number;
}

export async function getCartLineItemsForDiscount(identity: CartIdentity): Promise<CartLineItemForDiscount[]> {
  const cart = await prisma.cart.findUnique({
    where: whereForIdentity(identity),
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: { categories: { select: { categoryId: true } } },
                select: { id: true, basePrice: true, discountType: true, discountValue: true, categories: true },
              },
            },
          },
        },
      },
    },
  });

  if (!cart) return [];

  return cart.items.map((item) => {
    const product = item.variant.product;
    const baseForPrice = product.pricingMode === "CURRENCY_BASED"
      ? product.currentPriceIRT
      : product.basePrice;
    const price = computeProductEffectivePrice(
      baseForPrice,
      item.variant.priceAdjustment,
      product.discountType,
      product.discountValue,
      null,
      null
    );
    return {
      variantId: item.variant.id,
      productId: product.id,
      categoryIds: product.categories.map((c) => c.categoryId),
      quantity: item.quantity,
      unitPrice: price.unitPrice,
    };
  });
}
