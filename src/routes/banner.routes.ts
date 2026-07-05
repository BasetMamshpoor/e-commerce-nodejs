import { Router } from "express";
import * as bannerController from "../controllers/banner.controller";
import { validate } from "../middlewares/validate";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { createBannerSchema, updateBannerSchema } from "../validations/cms.validation";
import { entityUpload } from "../services/media/upload-helper";

const router = Router();
const manageOnly = [authenticate, authorize("ADMIN", "EDITOR")] as const;

router.get("/", bannerController.listActive);
router.get("/admin", ...manageOnly, bannerController.listAdmin);

// آپلود فایل به همراه فیلدهای فرم در یک درخواست multipart/form-data
router.post("/", ...manageOnly, entityUpload("banner"), validate(createBannerSchema), bannerController.create);
router.put("/:id", ...manageOnly, entityUpload("banner"), validate(updateBannerSchema), bannerController.update);
router.delete("/:id", ...manageOnly, bannerController.remove);

export default router;
