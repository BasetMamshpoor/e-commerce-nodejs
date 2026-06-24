import { Router } from "express";
import * as brandController from "../controllers/brand.controller";
import { validate } from "../middlewares/validate";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { createBrandSchema, updateBrandSchema } from "../validations/brand.validation";

const router = Router();
const manageOnly = [authenticate, authorize("ADMIN", "EDITOR")] as const;

router.get("/", brandController.list);
router.get("/slug/:slug", brandController.getBySlug);
router.get("/:id", brandController.getById);

router.post("/", ...manageOnly, validate(createBrandSchema), brandController.create);
router.put("/:id", ...manageOnly, validate(updateBrandSchema), brandController.update);
router.delete("/:id", ...manageOnly, brandController.remove);

export default router;
