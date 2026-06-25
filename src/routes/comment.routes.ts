import { Router } from "express";
import * as commentController from "../controllers/comment.controller";
import { validate } from "../middlewares/validate";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  createCommentSchema,
  updateCommentSchema,
  listCommentsQuerySchema,
  adminListCommentsQuerySchema,
  moderateCommentSchema,
} from "../validations/comment.validation";

const router = Router();
const manageOnly = [authenticate, authorize("ADMIN", "EDITOR")] as const;

// عمومی — لیست دیدگاه‌های تاییدشده‌ی یک محصول (SSR-friendly)
router.get(
  "/product/:productId",
  validate(listCommentsQuerySchema, "query"),
  commentController.listForProduct
);

// ثبت دیدگاه/پاسخ — نیاز به ورود
router.post(
  "/product/:productId",
  authenticate,
  validate(createCommentSchema),
  commentController.create
);

router.put("/:id", authenticate, validate(updateCommentSchema), commentController.update);
router.delete("/:id", authenticate, commentController.remove);
router.post("/:id/like", authenticate, commentController.like);

// مدیریت/بررسی — ادمین/ادیتور
router.get(
  "/admin",
  ...manageOnly,
  validate(adminListCommentsQuerySchema, "query"),
  commentController.listAdmin
);
router.put(
  "/admin/:id",
  ...manageOnly,
  validate(moderateCommentSchema),
  commentController.moderate
);

export default router;
