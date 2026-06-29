import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { slugify, ensureUniqueSlug } from "../../utils/slug";
import { serializeBrand } from "../../utils/serialize";
import { CreateBrandInput, UpdateBrandInput } from "../../validations/brand.validation";
import { Brand, Media } from "../../generated/prisma";

type BrandWithLogo = Brand & { logo: Media | null };

async function isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
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

  const brand = (await prisma.brand.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
      logoId: input.logoId,
      isActive: input.isActive ?? true,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
    },
    include: { logo: true },
  })) as unknown as BrandWithLogo;

  return serializeBrand(brand);
}

export async function updateBrand(id: string, input: UpdateBrandInput) {
  const brand = await prisma.brand.findUnique({ where: { id } });
  if (!brand) throw ApiError.notFound("برند پیدا نشد");

  let slug: string | undefined;
  if (input.slug) {
    slug = slugify(input.slug);
    if (await isSlugTaken(slug, id)) {
      throw ApiError.conflict("این slug قبلاً استفاده شده است");
    }
  }

  const updated = (await prisma.brand.update({
    where: { id },
    data: { ...input, slug },
    include: { logo: true },
  })) as unknown as BrandWithLogo;

  return serializeBrand(updated);
}

export async function deleteBrand(id: string): Promise<void> {
  const brand = await prisma.brand.findUnique({ where: { id } });
  if (!brand) throw ApiError.notFound("برند پیدا نشد");

  const productCount = await prisma.product.count({ where: { brandId: id } });
  if (productCount > 0) {
    throw ApiError.conflict(
      `این برند به ${productCount} محصول متصل است؛ ابتدا محصولات را به برند دیگری منتقل کنید`
    );
  }

  await prisma.brand.delete({ where: { id } });
}

export async function getBrandById(id: string) {
  const brand = (await prisma.brand.findUnique({
    where: { id },
    include: { logo: true },
  })) as unknown as BrandWithLogo | null;
  if (!brand) throw ApiError.notFound("برند پیدا نشد");
  return serializeBrand(brand);
}

export async function getBrandBySlug(slug: string) {
  const brand = (await prisma.brand.findUnique({
    where: { slug },
    include: { logo: true },
  })) as unknown as BrandWithLogo | null;
  if (!brand) throw ApiError.notFound("برند پیدا نشد");
  return serializeBrand(brand);
}

export async function listBrands(includeInactive: boolean) {
  const brands = (await prisma.brand.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { name: "asc" },
    include: { logo: true },
  })) as unknown as BrandWithLogo[];

  return brands.map(serializeBrand);
}
