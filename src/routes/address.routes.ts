import { Router } from "express";
import * as addressController from "../controllers/address.controller";
import { validate } from "../middlewares/validate";
import { authenticate } from "../middlewares/auth.middleware";
import { createAddressSchema, updateAddressSchema } from "../validations/address.validation";

const router = Router();
router.use(authenticate);

router.get("/", addressController.list);
router.get("/:id", addressController.getById);
router.post("/", validate(createAddressSchema), addressController.create);
router.put("/:id", validate(updateAddressSchema), addressController.update);
router.delete("/:id", addressController.remove);

export default router;
