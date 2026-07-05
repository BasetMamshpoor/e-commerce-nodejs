import { Router } from "express";
import * as wishlistController from "../controllers/wishlist.controller";
import { validate } from "../middlewares/validate";
import { authenticate } from "../middlewares/auth.middleware";
import { addWishlistItemSchema } from "../validations/wishlist.validation";

const router = Router();

router.use(authenticate); // لیست علاقه‌مندی فقط برای کاربر عضو است

router.get("/", wishlistController.list);
router.post("/", validate(addWishlistItemSchema), wishlistController.add);
router.delete("/:productId", wishlistController.remove);

export default router;
