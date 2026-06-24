import { Router } from "express";
import * as orderController from "../controllers/order.controller";
import { validate } from "../middlewares/validate";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  createOrderSchema,
  cancelOrderSchema,
  returnOrderSchema,
  initiateOrderPaymentSchema,
  verifyOrderPaymentSchema,
  adminUpdateOrderStatusSchema,
  adminUpdateReturnSchema,
  listOrdersQuerySchema,
  adminListOrdersQuerySchema,
  adminListReturnsQuerySchema,
} from "../validations/order.validation";

const router = Router();
const staffOnly = [authenticate, authorize("ADMIN", "SUPPORT")] as const;

router.use(authenticate); // همه‌ی مسیرهای سفارش نیاز به ورود دارند (بدون مهمان)

// ⚠️ ترتیب: مسیرهای ثابت ادمین باید قبل از /:id تعریف شوند
router.get(
  "/admin",
  ...staffOnly,
  validate(adminListOrdersQuerySchema, "query"),
  orderController.listAdmin
);
router.get("/admin/returns", ...staffOnly, validate(adminListReturnsQuerySchema, "query"), orderController.listReturnsAdmin);
router.put(
  "/admin/returns/:returnId",
  ...staffOnly,
  validate(adminUpdateReturnSchema),
  orderController.updateReturnAdmin
);
router.get("/admin/:id", ...staffOnly, orderController.getByIdAdmin);
router.put(
  "/admin/:id/status",
  ...staffOnly,
  validate(adminUpdateOrderStatusSchema),
  orderController.updateStatusAdmin
);

// --- مشتری ---
router.get("/", validate(listOrdersQuerySchema, "query"), orderController.listMine);
router.post("/", validate(createOrderSchema), orderController.create);
router.get("/:id", orderController.getMine);

router.post("/:id/cancel", validate(cancelOrderSchema), orderController.cancel);
router.post("/:id/return", validate(returnOrderSchema), orderController.requestReturn);

router.post(
  "/:id/payment/initiate",
  validate(initiateOrderPaymentSchema),
  orderController.initiatePayment
);
router.post(
  "/:id/payment/verify",
  validate(verifyOrderPaymentSchema),
  orderController.verifyPayment
);

export default router;
