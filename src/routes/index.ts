import { Router } from "express";
import authRoutes from "./auth.routes";
import categoryRoutes from "./category.routes";
import brandRoutes from "./brand.routes";
import attributeRoutes from "./attribute.routes";
import productRoutes from "./product.routes";
import cartRoutes from "./cart.routes";
import wishlistRoutes from "./wishlist.routes";
import comparisonRoutes from "./comparison.routes";
import discountRoutes from "./discount.routes";

// ----------------------------------------------------------------------------
// هر ماژول جدید (orders, ...) را همین‌جا mount کنید:
//   router.use("/orders", orderRoutes);
// ----------------------------------------------------------------------------

const router = Router();

router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/brands", brandRoutes);
router.use("/attributes", attributeRoutes);
router.use("/products", productRoutes);
router.use("/cart", cartRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/comparison", comparisonRoutes);
router.use("/discount-codes", discountRoutes);

export default router;
