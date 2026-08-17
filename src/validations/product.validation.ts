import { z } from "zod";

export const variantAttributeValueSchema = z.object({
  attributeValueId: z.coerce.number().int().positive(),
  // .nullable() added alongside .optional(): the Prisma column is nullable
  // (modifierType/modifierValue are cleared to null when an admin removes a
  // price modifier from an attribute value), and any client that sends the
  // field back as an explicit `null` — rather than omitting the key
  // entirely — used to get its whole request rejected by zod, since
  // .optional() alone only accepts `undefined`, not `null`.
  modifierType: z.enum(["PERCENTAGE", "FIXED_SOURCE_CURRENCY", "FIXED_IRT"]).nullable().optional(),
  modifierValue: z.coerce.number().nullable().optional(),
});

export const variantInputSchema = z.object({
  sku: z.string().trim().min(1).max(80),
  priceAdjustment: z.coerce.number().int().min(0).default(0),
  stock: z.coerce.number().int().min(0).default(0),
  weight: z.coerce.number().positive().optional(),
  isDefault: z.coerce.boolean().optional().default(false),
  isActive: z.coerce.boolean().optional().default(true),
  attributeValues: z.array(variantAttributeValueSchema).default([]),
});

const imageInputSchema = z.object({
  mediaId: z.coerce.number().int().positive(),
  order: z.coerce.number().int().optional().default(0),
  isMain: z.coerce.boolean().optional().default(false),
});

const displayAttributeSchema = z.object({
  attributeId: z.coerce.number().int().positive(),
  value: z.string().min(1),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(2).max(250),
  slug: z.string().trim().min(2).max(260).optional(),
  brandId: z.coerce.number().int().positive().optional(),
  shortDescription: z.string().max(500).optional(),
  description: z.string().optional(),
  basePrice: z.coerce.number().int().min(0).default(0),
  pricingMode: z.enum(["FIXED_IRT", "CURRENCY_BASED"]).optional().default("FIXED_IRT"),
  currencyId: z.coerce.number().int().positive().optional(),
  sourcePrice: z.coerce.number().nonnegative().optional(),
  priceBufferPercent: z.coerce.number().nonnegative().optional().default(0),
  discountType: z.enum(["PERCENT", "FIXED"]).optional(),
  discountValue: z.coerce.number().int().positive().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional().default("DRAFT"),
  isFeatured: z.coerce.boolean().optional().default(false),
  metaTitle: z.string().max(160).optional(),
  metaDescription: z.string().max(300).optional(),
  canonicalUrl: z.string().url().optional(),
  categoryIds: z.array(z.coerce.number()).min(1, "حداقل یک دسته‌بندی الزامی است"),
  images: z.array(imageInputSchema).optional().default([]),
  variants: z.array(variantInputSchema).min(1, "حداقل یک تنوع کالا الزامی است"),
  displayAttributes: z.array(displayAttributeSchema).optional().default([]),
});

export const updateProductSchema = z.object({
  name: z.string().trim().min(2).max(250).optional(),
  slug: z.string().trim().min(2).max(260).optional(),
  brandId: z.coerce.number().int().positive().nullable().optional(),
  shortDescription: z.string().max(500).optional(),
  description: z.string().optional(),
  basePrice: z.coerce.number().int().min(0).optional(),
  pricingMode: z.enum(["FIXED_IRT", "CURRENCY_BASED"]).optional(),
  currencyId: z.coerce.number().int().positive().nullable().optional(),
  sourcePrice: z.coerce.number().nonnegative().nullable().optional(),
  priceBufferPercent: z.coerce.number().nonnegative().nullable().optional(),
  discountType: z.enum(["PERCENT", "FIXED"]).nullable().optional(),
  discountValue: z.coerce.number().int().positive().nullable().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  isFeatured: z.coerce.boolean().optional(),
  metaTitle: z.string().max(160).optional(),
  metaDescription: z.string().max(300).optional(),
  canonicalUrl: z.string().url().optional(),
  categoryIds: z.array(z.coerce.number()).min(1).optional(),
  displayAttributes: z.array(displayAttributeSchema).optional(),
});

export const addVariantSchema = variantInputSchema;
export const updateVariantSchema = variantInputSchema.partial();

// تصاویر در حین ایجاد محصول از طریق images[] ارسال می‌شوند
// و در حین ویرایش از طریق deletedImages + آپلود فایل جدید
export const deleteProductImagesSchema = z.object({
  deletedImages: z.array(z.coerce.number().int().positive()).optional().default([]),
});

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  categorySlug: z.string().optional(),
  brandIds: z.string().optional(),
  attributeValueIds: z.string().optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  inStock: z.coerce.boolean().optional(),
  hasDiscount: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  search: z.string().optional(),
  sort: z
    .enum(["newest", "price_asc", "price_desc", "popular", "bestselling", "most_viewed", "most_popular"])
    .optional()
    .default("newest"),
});

export const adminListProductsQuerySchema = listProductsQuerySchema.extend({
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

export type VariantInput = z.infer<typeof variantInputSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
export type AdminListProductsQuery = z.infer<typeof adminListProductsQuerySchema>;
