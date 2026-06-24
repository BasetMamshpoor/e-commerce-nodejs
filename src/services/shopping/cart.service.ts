import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { CartIdentity } from "../../utils/cartIdentity";
import { computeVariantEffectivePrice } from "../../utils/pricing";
import { Cart, CartItem, DiscountType, ProductVariant } from "../../generated/prisma";

// ----------------------------------------------------------------------------
// سبد خرید بدون احراز هویت و با احراز هویت — آیتم ۷
// ----------------------------------------------------------------------------

const CART_INCLUDE = {
  items: {
    include: {
      variant: {
        include: {
          product: { select: { id: true, name: true, slug: true, status: true } },
          images: { take: 1, orderBy: { order: "asc" as const }, include: { media: true } },
          attributeValues: {
            include: { attributeValue: { include: { attribute: true } } },
          },
        },
      },
    },
  },
};

type CartWithItems = Cart & {
  items: {
    id: string;
    quantity: number;
    variant: {
      id: string;
      price: number;
      stock: number;
      isActive: boolean;
      discountType: DiscountType | null;
      discountValue: number | null;
      discountStartAt: Date | null;
      discountEndAt: Date | null;
      product: { id: string; name: string; slug: string; status: string };
      images: { media: { url: string } }[];
      attributeValues: {
        attributeValue: { value: string; colorHex: string | null; attribute: { name: string } };
      }[];
    };
  }[];
};

function whereForIdentity(identity: CartIdentity) {
  return "userId" in identity ? { userId: identity.userId } : { guestToken: identity.guestToken };
}

async function findRawCart(identity: CartIdentity): Promise<CartWithItems | null> {
  return prisma.cart.findUnique({
    where: whereForIdentity(identity),
    include: CART_INCLUDE,
  }) as Promise<CartWithItems | null>;
}

async function getOrCreateCart(identity: CartIdentity): Promise<Cart> {
  const where = whereForIdentity(identity);
  const existing = await prisma.cart.findUnique({ where });
  if (existing) return existing;
  return prisma.cart.create({ data: where });
}

export interface CartSummary {
  id: string | null;
  itemCount: number;
  subtotal: number;
  totalDiscount: number;
  total: number;
  items: Array<{
    id: string;
    variantId: string;
    productName: string;
    productSlug: string;
    image: string | null;
    attributesLabel: string; // مثلا "رنگ: قرمز، سایز: L"
    quantity: number;
    unitPrice: number;
    originalPrice: number;
    lineTotal: number;
    isAvailable: boolean;
    availableStock: number;
  }>;
}

function summarize(cart: CartWithItems | null): CartSummary {
  if (!cart) {
    return { id: null, itemCount: 0, subtotal: 0, totalDiscount: 0, total: 0, items: [] };
  }

  const items = cart.items.map((item) => {
    const price = computeVariantEffectivePrice(item.variant);
    const isAvailable =
      item.variant.isActive &&
      item.variant.product.status === "PUBLISHED" &&
      item.variant.stock > 0;

    const attributesLabel = item.variant.attributeValues
      .map((av) => `${av.attributeValue.attribute.name}: ${av.attributeValue.value}`)
      .join("، ");

    return {
      id: item.id,
      variantId: item.variant.id,
      productName: item.variant.product.name,
      productSlug: item.variant.product.slug,
      image: item.variant.images[0]?.media.url ?? null,
      attributesLabel,
      quantity: item.quantity,
      unitPrice: price.unitPrice,
      originalPrice: price.originalPrice,
      lineTotal: price.unitPrice * item.quantity,
      isAvailable,
      availableStock: item.variant.stock,
    };
  });

  return {
    id: cart.id,
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

export async function addItem(
  identity: CartIdentity,
  variantId: string,
  quantity: number
): Promise<{ cart: CartSummary; wasAdjusted: boolean }> {
  const variant = (await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: { select: { status: true } } },
  })) as (ProductVariant & { product: { status: string } }) | null;

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

export async function updateItemQuantity(
  identity: CartIdentity,
  itemId: string,
  quantity: number
): Promise<{ cart: CartSummary; wasAdjusted: boolean }> {
  const cart = await findRawCart(identity);
  const item = cart?.items.find((i) => i.id === itemId);
  if (!cart || !item) throw ApiError.notFound("آیتم سبد خرید پیدا نشد");

  if (quantity === 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
    return { cart: await getCart(identity), wasAdjusted: false };
  }

  const finalQty = Math.min(quantity, item.variant.stock);
  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity: finalQty } });

  return { cart: await getCart(identity), wasAdjusted: finalQty !== quantity };
}

export async function removeItem(identity: CartIdentity, itemId: string): Promise<CartSummary> {
  const cart = await findRawCart(identity);
  const item = cart?.items.find((i) => i.id === itemId);
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

/**
 * بعد از لاگین، سبد خرید مهمان (با guestToken) را با سبد خرید کاربر ادغام
 * می‌کند: اگر همان تنوع در هر دو سبد بود جمع می‌شوند (با رعایت سقف موجودی)،
 * در غیر این صورت آیتم جدید اضافه می‌شود. در پایان سبد مهمان حذف می‌شود.
 */
export async function mergeGuestCartIntoUser(
  userId: string,
  guestToken: string
): Promise<CartSummary> {
  const guestCart = (await prisma.cart.findUnique({
    where: { guestToken },
    include: { items: true },
  })) as (Cart & { items: CartItem[] }) | null;

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

// ----------------------------------------------------------------------------
// برای ماژول کد تخفیف: شکل ساده‌شده‌ی آیتم‌های سبد به‌همراه دسته‌بندی هر
// محصول (برای تشخیص اینکه کد تخفیف محصول‌محور/دسته‌محور روی کدام آیتم‌ها
// قابل‌اعمال است) و قیمت مؤثر هر واحد (بعد از تخفیف خودِ تنوع، قبل از کد
// تخفیف). این یک کوئری مستقل و سبک است تا شکل اصلی CartSummary/CART_INCLUDE
// دست‌نخورده بماند.
// ----------------------------------------------------------------------------

export interface CartLineItemForDiscount {
  productId: string;
  categoryIds: string[];
  quantity: number;
  unitPrice: number;
}

export async function getCartLineItemsForDiscount(
  identity: CartIdentity
): Promise<CartLineItemForDiscount[]> {
  const cart = (await prisma.cart.findUnique({
    where: whereForIdentity(identity),
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: { include: { categories: { select: { categoryId: true } } } },
            },
          },
        },
      },
    },
  })) as
    | (Cart & {
        items: {
          quantity: number;
          variant: ProductVariant & {
            product: { id: string; categories: { categoryId: string }[] };
          };
        }[];
      })
    | null;

  if (!cart) return [];

  return cart.items.map((item) => {
    const price = computeVariantEffectivePrice(item.variant);
    return {
      productId: item.variant.product.id,
      categoryIds: item.variant.product.categories.map((c) => c.categoryId),
      quantity: item.quantity,
      unitPrice: price.unitPrice,
    };
  });
}
