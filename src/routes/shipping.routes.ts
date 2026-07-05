import { Router } from "express";
import * as shippingController from "../controllers/shipping.controller";
import { validate } from "../middlewares/validate";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { createShippingCompanySchema, updateShippingCompanySchema } from "../validations/shipping.validation";
import { entityUpload } from "../services/media/upload-helper";

const router = Router();
const manageOnly = [authenticate, authorize("ADMIN", "EDITOR")] as const;

router.get("/", shippingController.list);
router.get("/:id", shippingController.getById);

// آپلود لوگو به همراه فیلدهای فرم
router.post("/", ...manageOnly, entityUpload("shippingLogo"), validate(createShippingCompanySchema), shippingController.create);
router.put("/:id", ...manageOnly, entityUpload("shippingLogo"), validate(updateShippingCompanySchema), shippingController.update);
router.delete("/:id", ...manageOnly, shippingController.remove);

export default router;
