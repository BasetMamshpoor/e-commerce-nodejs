import { Router } from "express";
import * as categoryController from "../controllers/category.controller";
import { validate } from "../middlewares/validate";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  createCategorySchema,
  updateCategorySchema,
  attachAttributeSchema,
} from "../validations/category.validation";
import { entityUpload } from "../services/media/upload-helper";

const router = Router();
const manageOnly = [authenticate, authorize("ADMIN", "EDITOR")] as const;

router.get("/tree", categoryController.getTree);
router.get("/", categoryController.listFlat);
router.get("/slug/:slug", categoryController.getBySlug);
router.get("/:id", categoryController.getById);
router.get("/:id/attributes", categoryController.listAttributes);

// آپلود تصویر به همراه فیلدهای فرم
router.post("/", ...manageOnly, entityUpload("category"), validate(createCategorySchema), categoryController.create);
router.put("/:id", ...manageOnly, entityUpload("category"), validate(updateCategorySchema), categoryController.update);
router.delete("/:id", ...manageOnly, categoryController.remove);

router.post("/:id/attributes", ...manageOnly, validate(attachAttributeSchema), categoryController.attachAttribute);
router.delete("/:id/attributes/:attributeId", ...manageOnly, categoryController.detachAttribute);

export default router;
