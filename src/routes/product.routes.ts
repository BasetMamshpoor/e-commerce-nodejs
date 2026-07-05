import { Router } from "express";
import * as productController from "../controllers/product.controller";
import { validate } from "../middlewares/validate";
import { authenticate, authorize, optionalAuthenticate } from "../middlewares/auth.middleware";
import {
  createProductSchema,
  updateProductSchema,
  addVariantSchema,
  updateVariantSchema,
  listProductsQuerySchema,
  adminListProductsQuerySchema,
} from "../validations/product.validation";
import { uploadProductImagesMiddleware } from "../services/media/upload-helper";
import { uploadProductImages } from "../middlewares/upload.middleware";
import { saveFileToMedia } from "../services/media/media.service";

const router = Router();
const manageOnly = [authenticate, authorize("ADMIN", "EDITOR")] as const;

// ⚠️ ترتیب route ها مهم است: مسیرهای ثابت (filters/admin) باید قبل از
// مسیرهای پارامتری مثل /:slug تعریف شوند، وگرنه اکسپرس آن‌ها را به‌اشتباه
// به‌عنوان مقدار slug تشخیص می‌دهد.

router.get("/filters", productController.filters);

router.get("/admin", ...manageOnly, validate(adminListProductsQuerySchema, "query"), productController.listAdmin);
router.get("/admin/:id", ...manageOnly, productController.getByIdAdmin);

router.get("/", validate(listProductsQuerySchema, "query"), productController.listPublic);
router.get("/by-id/:id", optionalAuthenticate, productController.getByIdPublic);
router.get("/:slug", optionalAuthenticate, productController.getBySlugPublic);

router.post("/", ...manageOnly, validate(createProductSchema), productController.create);
router.put("/:id", ...manageOnly, (req, res, next) => {
  // پردازش فایل‌های تصویر جدید در حین ویرایش محصول
  // فیلد images می‌تواند حاوی فایل‌های جدید باشد (multipart)
  // فیلد deletedImages (آرایه‌ای از شناسه ProductImage) برای حذف تصاویر موجود
  uploadProductImages.array("images", 20)(req, res, async (err) => {
    if (err) return next(err);
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      try {
        const results = await Promise.all(
          req.files.map((f) => saveFileToMedia(f, "products", req.user?.id))
        );
        (req as unknown as Record<string, unknown>).uploadedImages = results.map((r) => ({
          mediaId: r.id,
          url: r.url,
        }));
      } catch (e) { return next(e); }
    }
    next();
  });
}, validate(updateProductSchema), productController.update);

router.delete("/:id", ...manageOnly, productController.remove);

router.post("/:id/variants", ...manageOnly, validate(addVariantSchema), productController.addVariant);
router.put("/:id/variants/:variantId", ...manageOnly, validate(updateVariantSchema), productController.updateVariant);
router.delete("/:id/variants/:variantId", ...manageOnly, productController.removeVariant);

// تصاویر محصول از طریق PUT /:id مدیریت می‌شوند — endpoint های جداگانه حذف شده‌اند
// POST  /:id/images  → حذف شد (به جای آن از PUT /:id با uploadedImages استفاده کنید)
// DELETE /:id/images/:imageId → حذف شد (به جای آن از PUT /:id با deletedImages استفاده کنید)

export default router;
