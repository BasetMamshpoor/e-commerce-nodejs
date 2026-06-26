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
import addressRoutes from "./address.routes";
import shippingRoutes from "./shipping.routes";
import paymentGatewayRoutes from "./payment-gateway.routes";
import walletRoutes from "./wallet.routes";
import orderRoutes from "./order.routes";
import mediaRoutes from "./media.routes";
import notificationRoutes from "./notification.routes";
import ticketRoutes from "./ticket.routes";
import commentRoutes from "./comment.routes";
import bannerRoutes from "./banner.routes";
import popupRoutes from "./popup.routes";
import userRoutes from "./user.routes";
import securityRoutes from "./security.routes";
import analyticsRoutes from "./analytics.routes";
import settingsRoutes from "./settings.routes";

// ----------------------------------------------------------------------------
// هر ماژول جدید را همین‌جا mount کنید.
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
router.use("/addresses", addressRoutes);
router.use("/shipping-companies", shippingRoutes);
router.use("/payment-gateways", paymentGatewayRoutes);
router.use("/wallet", walletRoutes);
router.use("/orders", orderRoutes);
router.use("/media", mediaRoutes);
router.use("/notifications", notificationRoutes);
router.use("/tickets", ticketRoutes);
router.use("/comments", commentRoutes);
router.use("/banners", bannerRoutes);
router.use("/popups", popupRoutes);
router.use("/users", userRoutes);
router.use("/security", securityRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/settings", settingsRoutes);

export default router;
