import { Router } from "express";
import * as notificationController from "../controllers/notification.controller";
import { validate } from "../middlewares/validate";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  listNotificationsQuerySchema,
  broadcastNotificationSchema,
} from "../validations/notification.validation";

const router = Router();
router.use(authenticate);

router.get("/", validate(listNotificationsQuerySchema, "query"), notificationController.list);
router.get("/unread-count", notificationController.unreadCount);
router.patch("/read-all", notificationController.markAllRead);
router.patch("/:id/read", notificationController.markRead);
router.delete("/:id", notificationController.remove);

router.post(
  "/admin/broadcast",
  authorize("ADMIN", "EDITOR"),
  validate(broadcastNotificationSchema),
  notificationController.broadcast
);

export default router;
