import { z } from "zod";

const isoDate = z.coerce.date();

export const variantInputSchema = z.object({
  sku: z.string().trim().min(1).max(80),
  price: z.coerce.number().int().positive(),
  compareAtPrice: z.coerce.number().int().positive().optional(),
  discountType: z.enum(["PERCENT", "FIXED"]).optional(),
  discountValue: z.coerce.number().int().positive().optional(),
  discountStartAt: isoDate.optional(),
  discountEndAt: isoDate.optional(),
  stock: z.coerce.number().int().min(0).default(0),
  weight: z.coerce.number().positive().optional(),
  isDefault: z.coerce.boolean().optional().default(false),
  isActive: z.coerce.boolean().optional().default(true),
  // شناسه‌ی AttributeValue هایی که این تنوع را تعریف می‌کنند (مثلاً [قرمز, سایزL])
  attributeValueIds: z.array(z.string()).default([]),
});

const imageInputSchema = z.object({
  mediaId: z.string().min(1),
  order: z.coerce.number().int().optional().default(0),
  isMain: z.coerce.boolean().optional().default(false),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(2).max(250),
  slug: z.string().trim().min(2).max(260).optional(),
  brandId: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  description: z.string().optional(), // HTML از تکست ادیتور
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional().default("DRAFT"),
  isFeatured: z.coerce.boolean().optional().default(false),
  metaTitle: z.string().max(160).optional(),
  metaDescription: z.string().max(300).optional(),
  canonicalUrl: z.string().url().optional(),
  categoryIds: z.array(z.string()).min(1, "حداقل یک دسته‌بندی الزامی است"),
  images: z.array(imageInputSchema).optional().default([]),
  variants: z.array(variantInputSchema).min(1, "حداقل یک تنوع کالا الزامی است"),
});

export const updateProductSchema = z.object({
  name: z.string().trim().min(2).max(250).optional(),
  slug: z.string().trim().min(2).max(260).optional(),
  brandId: z.string().nullable().optional(),
  shortDescription: z.string().max(500).optional(),
  description: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  isFeatured: z.coerce.boolean().optional(),
  metaTitle: z.string().max(160).optional(),
  metaDescription: z.string().max(300).optional(),
  canonicalUrl: z.string().url().optional(),
  categoryIds: z.array(z.string()).min(1).optional(),
});

export const addVariantSchema = variantInputSchema;
export const updateVariantSchema = variantInputSchema.partial();
export const addProductImageSchema = imageInputSchema;

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  categorySlug: z.string().optional(),
  brandIds: z.string().optional(), // comma-separated
  attributeValueIds: z.string().optional(), // comma-separated
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  inStock: z.coerce.boolean().optional(),
  hasDiscount: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  search: z.string().optional(),
  sort: z
    .enum(["newest", "price_asc", "price_desc", "popular"])
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
