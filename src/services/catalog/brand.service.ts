import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { slugify, ensureUniqueSlug } from "../../utils/slug";
import { CreateBrandInput, UpdateBrandInput } from "../../validations/brand.validation";

async function isSlugTaken(slug: string, excludeId?: number): Promise<boolean> {
  const existing = await prisma.brand.findUnique({ where: { slug } });
  return Boolean(existing && existing.id !== excludeId);
}

export async function createBrand(input: CreateBrandInput) {
  const slug = input.slug
    ? slugify(input.slug)
    : await ensureUniqueSlug(input.name, (c) => isSlugTaken(c));

  if (input.slug && (await isSlugTaken(slug))) {
    throw ApiError.conflict("این slug قبلاً استفاده شده است");
  }

  return prisma.brand.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
      logoUrl: input.logoUrl,
      isActive: input.isActive ?? true,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
    },
  });
}

export async function updateBrand(id: number, input: UpdateBrandInput) {
  const brand = await prisma.brand.findUnique({ where: { id } });
  if (!brand) throw ApiError.notFound("برند پیدا نشد");

  let slug: string | undefined;
  if (input.slug) {
    slug = slugify(input.slug);
    if (await isSlugTaken(slug, id)) {
      throw ApiError.conflict("این slug قبلاً استفاده شده است");
    }
  }

  return prisma.brand.update({
    where: { id },
    data: { ...input, slug },
  });
}

export async function deleteBrand(id: number): Promise<void> {
  const brand = await prisma.brand.findUnique({ where: { id } });
  if (!brand) throw ApiError.notFound("برند پیدا نشد");

  const productCount = await prisma.product.count({ where: { brandId: id } });
  if (productCount > 0) {
    throw ApiError.conflict(`این برند به ${productCount} محصول متصل است؛ ابتدا محصولات را به برند دیگری منتقل کنید`);
  }

  await prisma.brand.delete({ where: { id } });
}

export async function getBrandById(id: number) {
  const brand = await prisma.brand.findUnique({ where: { id } });
  if (!brand) throw ApiError.notFound("برند پیدا نشد");
  return brand;
}

export async function getBrandBySlug(slug: string) {
  const brand = await prisma.brand.findUnique({ where: { slug } });
  if (!brand) throw ApiError.notFound("برند پیدا نشد");
  return brand;
}

export async function listBrands(includeInactive: boolean) {
  return prisma.brand.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { name: "asc" },
  });
}
