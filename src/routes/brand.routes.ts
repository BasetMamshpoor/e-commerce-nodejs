import { Router } from "express";
import * as brandController from "../controllers/brand.controller";
import { validate } from "../middlewares/validate";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { createBrandSchema, updateBrandSchema } from "../validations/brand.validation";
import { entityUpload } from "../services/media/upload-helper";

const router = Router();
const manageOnly = [authenticate, authorize("ADMIN", "EDITOR")] as const;

router.get("/", brandController.list);
router.get("/slug/:slug", brandController.getBySlug);
router.get("/:id", brandController.getById);

// آپلود لوگو به همراه فیلدهای فرم
router.post("/", ...manageOnly, entityUpload("brand"), validate(createBrandSchema), brandController.create);
router.put("/:id", ...manageOnly, entityUpload("brand"), validate(updateBrandSchema), brandController.update);
router.delete("/:id", ...manageOnly, brandController.remove);

export default router;
