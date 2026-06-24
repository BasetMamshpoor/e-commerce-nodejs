import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { ComparisonIdentity } from "../../utils/comparisonIdentity";

// ----------------------------------------------------------------------------
// مقایسه‌ی چند محصول با هم — آیتم ۶
// ----------------------------------------------------------------------------

const MAX_COMPARISON_ITEMS = 4;

const COMPARISON_INCLUDE = {
  items: {
    include: {
      product: {
        include: {
          brand: true,
          categories: { include: { category: true } },
          images: { where: { isMain: true }, take: 1, include: { media: true } },
          variants: {
            where: { isActive: true },
            include: {
              attributeValues: {
                include: { attributeValue: { include: { attribute: true } } },
              },
            },
          },
        },
      },
    },
  },
};

function whereForIdentity(identity: ComparisonIdentity) {
  return "userId" in identity ? { userId: identity.userId } : { sessionToken: identity.sessionToken };
}

async function findOrCreateComparison(identity: ComparisonIdentity) {
  const where = whereForIdentity(identity);
  const existing = await prisma.productComparison.findUnique({ where });
  if (existing) return existing;
  return prisma.productComparison.create({ data: where });
}

export async function getComparison(identity: ComparisonIdentity) {
  const where = whereForIdentity(identity);
  const comparison = await prisma.productComparison.findUnique({
    where,
    include: COMPARISON_INCLUDE,
  });
  return comparison ?? { id: null, items: [] };
}

export async function addToComparison(identity: ComparisonIdentity, productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw ApiError.notFound("محصول پیدا نشد");

  const comparison = await findOrCreateComparison(identity);

  const currentCount = await prisma.productComparisonItem.count({
    where: { comparisonId: comparison.id },
  });

  const alreadyAdded = await prisma.productComparisonItem.findUnique({
    where: { comparisonId_productId: { comparisonId: comparison.id, productId } },
  });

  if (!alreadyAdded && currentCount >= MAX_COMPARISON_ITEMS) {
    throw ApiError.conflict(
      `حداکثر ${MAX_COMPARISON_ITEMS} محصول می‌توانید هم‌زمان مقایسه کنید`
    );
  }

  await prisma.productComparisonItem.upsert({
    where: { comparisonId_productId: { comparisonId: comparison.id, productId } },
    create: { comparisonId: comparison.id, productId },
    update: {},
  });

  return getComparison(identity);
}

export async function removeFromComparison(identity: ComparisonIdentity, productId: string) {
  const where = whereForIdentity(identity);
  const comparison = await prisma.productComparison.findUnique({ where });
  if (comparison) {
    await prisma.productComparisonItem.deleteMany({ where: { comparisonId: comparison.id, productId } });
  }
  return getComparison(identity);
}

export async function clearComparison(identity: ComparisonIdentity) {
  const where = whereForIdentity(identity);
  const comparison = await prisma.productComparison.findUnique({ where });
  if (comparison) {
    await prisma.productComparisonItem.deleteMany({ where: { comparisonId: comparison.id } });
  }
  return getComparison(identity);
}
