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

router.post("/", ...manageOnly, uploadProductImagesMiddleware(), validate(createProductSchema), productController.create);
router.put("/:id", ...manageOnly, uploadProductImagesMiddleware(), validate(updateProductSchema), productController.update);

router.delete("/:id", ...manageOnly, productController.remove);

router.post("/:id/variants", ...manageOnly, validate(addVariantSchema), productController.addVariant);
router.put("/:id/variants/:variantId", ...manageOnly, validate(updateVariantSchema), productController.updateVariant);
router.delete("/:id/variants/:variantId", ...manageOnly, productController.removeVariant);

// تصاویر محصول از طریق PUT /:id مدیریت می‌شوند — endpoint های جداگانه حذف شده‌اند

export default router;
