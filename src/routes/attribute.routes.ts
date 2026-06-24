import { Router } from "express";
import * as attributeController from "../controllers/attribute.controller";
import { validate } from "../middlewares/validate";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  createAttributeSchema,
  updateAttributeSchema,
  createAttributeValueSchema,
  updateAttributeValueSchema,
} from "../validations/attribute.validation";

const router = Router();
const manageOnly = [authenticate, authorize("ADMIN", "EDITOR")] as const;

router.get("/", attributeController.list);
router.get("/:id", attributeController.getById);

router.post("/", ...manageOnly, validate(createAttributeSchema), attributeController.create);
router.put("/:id", ...manageOnly, validate(updateAttributeSchema), attributeController.update);
router.delete("/:id", ...manageOnly, attributeController.remove);

router.post(
  "/:id/values",
  ...manageOnly,
  validate(createAttributeValueSchema),
  attributeController.addValue
);
router.put(
  "/values/:valueId",
  ...manageOnly,
  validate(updateAttributeValueSchema),
  attributeController.updateValue
);
router.delete("/values/:valueId", ...manageOnly, attributeController.removeValue);

export default router;
