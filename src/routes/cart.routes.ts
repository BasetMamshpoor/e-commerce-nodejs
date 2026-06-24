import { Router } from "express";
import * as cartController from "../controllers/cart.controller";
import { validate } from "../middlewares/validate";
import { authenticate, optionalAuthenticate } from "../middlewares/auth.middleware";
import {
  addCartItemSchema,
  updateCartItemSchema,
  mergeCartSchema,
} from "../validations/cart.validation";

const router = Router();

// سبد خرید هم برای مهمان و هم کاربر عضو کار می‌کند — آیتم ۷
router.get("/", optionalAuthenticate, cartController.getCart);
router.post("/items", optionalAuthenticate, validate(addCartItemSchema), cartController.addItem);
router.patch(
  "/items/:itemId",
  optionalAuthenticate,
  validate(updateCartItemSchema),
  cartController.updateItem
);
router.delete("/items/:itemId", optionalAuthenticate, cartController.removeItem);
router.delete("/", optionalAuthenticate, cartController.clearCart);

// ادغام سبد مهمان با سبد کاربر — باید بعد از لاگین صدا زده شود
router.post("/merge", authenticate, validate(mergeCartSchema), cartController.mergeCart);

export default router;
