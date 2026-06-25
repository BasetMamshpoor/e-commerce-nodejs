import { Router } from "express";
import * as popupController from "../controllers/popup.controller";
import { validate } from "../middlewares/validate";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { createPopupSchema, updatePopupSchema } from "../validations/cms.validation";

const router = Router();
const manageOnly = [authenticate, authorize("ADMIN", "EDITOR")] as const;

router.get("/", popupController.listActive);
router.get("/admin", ...manageOnly, popupController.listAdmin);
router.post("/", ...manageOnly, validate(createPopupSchema), popupController.create);
router.put("/:id", ...manageOnly, validate(updatePopupSchema), popupController.update);
router.delete("/:id", ...manageOnly, popupController.remove);

export default router;
