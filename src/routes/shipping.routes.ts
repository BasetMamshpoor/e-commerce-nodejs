import { Router } from "express";
import * as shippingController from "../controllers/shipping.controller";
import { validate } from "../middlewares/validate";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  createShippingCompanySchema,
  updateShippingCompanySchema,
} from "../validations/shipping.validation";

const router = Router();
const manageOnly = [authenticate, authorize("ADMIN", "EDITOR")] as const;

router.get("/", shippingController.list);
router.get("/:id", shippingController.getById);

router.post("/", ...manageOnly, validate(createShippingCompanySchema), shippingController.create);
router.put("/:id", ...manageOnly, validate(updateShippingCompanySchema), shippingController.update);
router.delete("/:id", ...manageOnly, shippingController.remove);

export default router;
