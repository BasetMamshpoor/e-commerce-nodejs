import { Router } from "express";
import * as analyticsController from "../controllers/analytics.controller";
import { validate } from "../middlewares/validate";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { dateRangeQuerySchema, topProductsQuerySchema } from "../validations/analytics.validation";

const router = Router();
router.use(authenticate, authorize("ADMIN"));

router.get("/overview", analyticsController.overview);
router.get(
  "/sales-over-time",
  validate(dateRangeQuerySchema, "query"),
  analyticsController.salesOverTime
);
router.get("/order-status-breakdown", analyticsController.orderStatusBreakdown);
router.get(
  "/top-products",
  validate(topProductsQuerySchema, "query"),
  analyticsController.topProducts
);
router.get(
  "/new-users-over-time",
  validate(dateRangeQuerySchema, "query"),
  analyticsController.newUsersOverTime
);

export default router;
