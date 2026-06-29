import { Router } from "express";
import * as mediaController from "../controllers/media.controller";
import { validate } from "../middlewares/validate";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";
import { listMediaQuerySchema, getMediaByIdsQuerySchema } from "../validations/media.validation";

const router = Router();

// آپلود: هر کاربر لاگین‌کرده (ادمین/ادیتور/خریدار) — آیتم ۱۷
router.post("/", authenticate, upload.single("file"), mediaController.uploadOne);
router.post("/bulk", authenticate, upload.array("files", 10), mediaController.uploadMany);

// عمومی — resolve چند media id یک‌جا (برای جلوگیری از N+1 در فرانت)
router.get("/by-ids", validate(getMediaByIdsQuerySchema, "query"), mediaController.getByIds);

// مدیریت کتابخانه‌ی رسانه: فقط ادمین/ادیتور
router.get(
  "/",
  authenticate,
  authorize("ADMIN", "EDITOR"),
  validate(listMediaQuerySchema, "query"),
  mediaController.list
);
router.get("/:id", authenticate, authorize("ADMIN", "EDITOR"), mediaController.getById);
router.delete("/:id", authenticate, authorize("ADMIN", "EDITOR"), mediaController.remove);

export default router;
