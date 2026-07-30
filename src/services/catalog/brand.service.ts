import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { slugify, ensureUniqueSlug } from "../../utils/slug";
import { CreateBrandInput, UpdateBrandInput } from "../../validations/brand.validation";
import { syncUrlWithMediaId } from "../../utils/mediaSync";
import { getOrSetCache, invalidateCache } from "../../lib/cache";

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

  const synced = syncUrlWithMediaId(input, "logoMediaId", "logoUrl");

  const created = await prisma.brand.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
      logoUrl: synced.logoUrl,
      logoMediaId: synced.logoMediaId,
      isActive: input.isActive ?? true,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
    },
  });
  await invalidateCache("brand");
  return created;
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

  const updated = await prisma.brand.update({
    where: { id },
    data: { ...syncUrlWithMediaId(input, "logoMediaId", "logoUrl"), slug },
  });
  await invalidateCache("brand");
  return updated;
}

export async function deleteBrand(id: number): Promise<void> {
  const brand = await prisma.brand.findUnique({ where: { id } });
  if (!brand) throw ApiError.notFound("برند پیدا نشد");

  const productCount = await prisma.product.count({ where: { brandId: id } });
  if (productCount > 0) {
    throw ApiError.conflict(`این برند به ${productCount} محصول متصل است؛ ابتدا محصولات را به برند دیگری منتقل کنید`);
  }

  await prisma.brand.delete({ where: { id } });
  await invalidateCache("brand");
}

export async function getBrandById(id: number) {
  const brand = await prisma.brand.findUnique({ where: { id } });
  if (!brand) throw ApiError.notFound("برند پیدا نشد");
  return brand;
}

export async function getBrandBySlug(slug: string) {
  return getOrSetCache(`brand:slug:${slug}`, 300, async () => {
    const brand = await prisma.brand.findUnique({ where: { slug } });
    if (!brand) throw ApiError.notFound("برند پیدا نشد");
    return brand;
  });
}

export async function listBrands(includeInactive: boolean) {
  return getOrSetCache(`brand-list:${includeInactive}`, 300, () =>
    prisma.brand.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: "asc" },
    })
  );
}
