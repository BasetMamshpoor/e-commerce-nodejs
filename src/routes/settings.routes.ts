import { Router } from "express";
import * as settingsController from "../controllers/settings.controller";
import { validate } from "../middlewares/validate";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { upsertSettingSchema } from "../validations/settings.validation";

const router = Router();
const adminOnly = [authenticate, authorize("ADMIN")] as const;

router.get("/", settingsController.getPublic);
router.get("/admin", ...adminOnly, settingsController.listAdmin);
router.put("/admin/:key", ...adminOnly, validate(upsertSettingSchema), settingsController.upsert);
router.delete("/admin/:key", ...adminOnly, settingsController.remove);

export default router;
