import { Router } from "express";
import * as categoryController from "../controllers/category.controller";
import { validate } from "../middlewares/validate";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  createCategorySchema,
  updateCategorySchema,
  attachAttributeSchema,
} from "../validations/category.validation";

const router = Router();
const manageOnly = [authenticate, authorize("ADMIN", "EDITOR")] as const;

// --- عمومی (صفحه فروشگاه) ---
router.get("/tree", categoryController.getTree);
router.get("/", categoryController.listFlat);
router.get("/slug/:slug", categoryController.getBySlug);
router.get("/:id", categoryController.getById);
router.get("/:id/attributes", categoryController.listAttributes);

// --- مدیریت (ادمین/ادیتور) ---
router.post("/", ...manageOnly, validate(createCategorySchema), categoryController.create);
router.put("/:id", ...manageOnly, validate(updateCategorySchema), categoryController.update);
router.delete("/:id", ...manageOnly, categoryController.remove);

router.post(
  "/:id/attributes",
  ...manageOnly,
  validate(attachAttributeSchema),
  categoryController.attachAttribute
);
router.delete(
  "/:id/attributes/:attributeId",
  ...manageOnly,
  categoryController.detachAttribute
);

export default router;
