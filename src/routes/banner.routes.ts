import { Router } from "express";
import * as bannerController from "../controllers/banner.controller";
import { validate } from "../middlewares/validate";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { createBannerSchema, updateBannerSchema } from "../validations/cms.validation";

const router = Router();
const manageOnly = [authenticate, authorize("ADMIN", "EDITOR")] as const;

router.get("/", bannerController.listActive);
router.get("/admin", ...manageOnly, bannerController.listAdmin);
router.post("/", ...manageOnly, validate(createBannerSchema), bannerController.create);
router.put("/:id", ...manageOnly, validate(updateBannerSchema), bannerController.update);
router.delete("/:id", ...manageOnly, bannerController.remove);

export default router;
