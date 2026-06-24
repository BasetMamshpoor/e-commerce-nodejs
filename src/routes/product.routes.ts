import { Router } from "express";
import * as productController from "../controllers/product.controller";
import { validate } from "../middlewares/validate";
import { authenticate, authorize, optionalAuthenticate } from "../middlewares/auth.middleware";
import {
  createProductSchema,
  updateProductSchema,
  addVariantSchema,
  updateVariantSchema,
  addProductImageSchema,
  listProductsQuerySchema,
  adminListProductsQuerySchema,
} from "../validations/product.validation";
import { z } from "zod";

const router = Router();
const manageOnly = [authenticate, authorize("ADMIN", "EDITOR")] as const;

// ⚠️ ترتیب route ها مهم است: مسیرهای ثابت (filters/admin) باید قبل از
// مسیرهای پارامتری مثل /:slug تعریف شوند، وگرنه اکسپرس آن‌ها را به‌اشتباه
// به‌عنوان مقدار slug تشخیص می‌دهد.

router.get("/filters", productController.filters);

router.get(
  "/admin",
  ...manageOnly,
  validate(adminListProductsQuerySchema, "query"),
  productController.listAdmin
);
router.get("/admin/:id", ...manageOnly, productController.getByIdAdmin);

router.get("/", validate(listProductsQuerySchema, "query"), productController.listPublic);
router.get("/:slug", productController.getBySlugPublic);

router.post("/:id/view", optionalAuthenticate, productController.trackView);

router.post("/", ...manageOnly, validate(createProductSchema), productController.create);
router.put("/:id", ...manageOnly, validate(updateProductSchema), productController.update);
router.delete("/:id", ...manageOnly, productController.remove);

router.post(
  "/:id/variants",
  ...manageOnly,
  validate(addVariantSchema),
  productController.addVariant
);
router.put(
  "/:id/variants/:variantId",
  ...manageOnly,
  validate(updateVariantSchema),
  productController.updateVariant
);
router.delete("/:id/variants/:variantId", ...manageOnly, productController.removeVariant);

router.post(
  "/:id/variants/:variantId/images",
  ...manageOnly,
  validate(z.object({ mediaId: z.string().min(1), order: z.coerce.number().int().optional() })),
  productController.addVariantImage
);
router.delete(
  "/:id/variants/:variantId/images/:imageId",
  ...manageOnly,
  productController.removeVariantImage
);

router.post(
  "/:id/images",
  ...manageOnly,
  validate(addProductImageSchema),
  productController.addImage
);
router.delete("/:id/images/:imageId", ...manageOnly, productController.removeImage);

export default router;
