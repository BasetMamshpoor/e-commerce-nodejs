import { Router } from "express";
import * as adminNotifController from "../controllers/admin-notification.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";

const router = Router();
const staffOnly = [authenticate, authorize("ADMIN", "SUPPORT", "EDITOR")] as const;

router.use(...staffOnly);

router.get("/", adminNotifController.list);
router.get("/unread-count", adminNotifController.unreadCount);
router.put("/:id/read", adminNotifController.markRead);
router.put("/read-all", adminNotifController.markAllRead);

export default router;
