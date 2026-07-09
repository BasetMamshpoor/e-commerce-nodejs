import { Router } from "express";
import * as mediaController from "../controllers/media.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { uploadMediaSingle, uploadMediaBulk } from "../services/media/upload-helper";

const router = Router();

router.post("/", authenticate, uploadMediaSingle(), mediaController.upload);
router.post("/bulk", authenticate, uploadMediaBulk(), mediaController.uploadBulk);

router.get("/", authenticate, authorize("ADMIN", "EDITOR"), mediaController.list);
router.get("/:id", authenticate, authorize("ADMIN", "EDITOR"), mediaController.getById);
router.get("/:id/usage", authenticate, authorize("ADMIN", "EDITOR"), mediaController.getUsage);
// دانلود فایل — فایل را به‌عنوان attachment (یا inline برای تصاویر) سرو می‌کند
router.get("/:id/download", authenticate, authorize("ADMIN", "EDITOR"), mediaController.download);
router.delete("/:id", authenticate, authorize("ADMIN", "EDITOR"), mediaController.remove);

export default router;
