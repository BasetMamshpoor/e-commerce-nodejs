import { Router } from "express";
import * as comparisonController from "../controllers/comparison.controller";
import { validate } from "../middlewares/validate";
import { optionalAuthenticate } from "../middlewares/auth.middleware";
import { addComparisonItemSchema } from "../validations/comparison.validation";

const router = Router();

router.use(optionalAuthenticate); // هم مهمان هم کاربر عضو

router.get("/", comparisonController.get);
router.post("/", validate(addComparisonItemSchema), comparisonController.add);
router.delete("/:productId", comparisonController.remove);
router.delete("/", comparisonController.clear);

export default router;
