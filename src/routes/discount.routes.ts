import { Router } from "express";
import * as discountController from "../controllers/discount.controller";
import { validate } from "../middlewares/validate";
import { authenticate, authorize, optionalAuthenticate } from "../middlewares/auth.middleware";
import {
  createDiscountCodeSchema,
  updateDiscountCodeSchema,
  applyDiscountCodeSchema,
  adminListDiscountCodesQuerySchema,
} from "../validations/discount.validation";

const router = Router();
const manageOnly = [authenticate, authorize("ADMIN", "EDITOR")] as const;

// عمومی (مهمان یا کاربر عضو) — اعمال/پیش‌نمایش کد تخفیف روی سبد فعلی
router.post(
  "/apply",
  optionalAuthenticate,
  validate(applyDiscountCodeSchema),
  discountController.apply
);

// مدیریت (ادمین/ادیتور)
router.get(
  "/",
  ...manageOnly,
  validate(adminListDiscountCodesQuerySchema, "query"),
  discountController.list
);
router.get("/:id", ...manageOnly, discountController.getById);
router.post(
  "/",
  ...manageOnly,
  validate(createDiscountCodeSchema),
  discountController.create
);
router.put(
  "/:id",
  ...manageOnly,
  validate(updateDiscountCodeSchema),
  discountController.update
);
router.delete("/:id", ...manageOnly, discountController.remove);

export default router;
