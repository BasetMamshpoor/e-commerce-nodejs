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
router.post(
  "/product/:productId",
  authenticate,
  validate(createCommentSchema),
  commentController.createForProduct
);

// عمومی — لیست دیدگاه‌های تاییدشده‌ی یک پست وبلاگ (همان مدل Comment، پلی‌مورفیک)
router.get(
  "/blog/:postId",
  validate(listCommentsQuerySchema, "query"),
  commentController.listForBlogPost
);
router.post(
  "/blog/:postId",
  authenticate,
  validate(createCommentSchema),
  commentController.createForBlogPost
);

router.put("/:id", authenticate, validate(updateCommentSchema), commentController.update);
router.delete("/:id", authenticate, commentController.remove);
router.post("/:id/like", authenticate, commentController.like);

// مدیریت/بررسی — ادمین/ادیتور (هم کامنت محصول هم وبلاگ از همینجا مدیریت می‌شود)
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
