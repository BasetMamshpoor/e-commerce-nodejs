import { Router } from "express";
import * as gatewayController from "../controllers/payment-gateway.controller";
import { validate } from "../middlewares/validate";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  createPaymentGatewaySchema,
  updatePaymentGatewaySchema,
} from "../validations/payment-gateway.validation";

const router = Router();
const manageOnly = [authenticate, authorize("ADMIN")] as const;

// لیست عمومی (برای نمایش درگاه‌های فعال در صفحه‌ی پرداخت)
router.get("/", gatewayController.list);

// مدیریت — فقط ادمین
router.post("/", ...manageOnly, validate(createPaymentGatewaySchema), gatewayController.create);
router.put("/:id", ...manageOnly, validate(updatePaymentGatewaySchema), gatewayController.update);
router.delete("/:id", ...manageOnly, gatewayController.remove);

export default router;
