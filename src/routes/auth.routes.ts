import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { validate } from "../middlewares/validate";
import { authenticate } from "../middlewares/auth.middleware";
import { strictAuthLimiter } from "../middlewares/rateLimiter";
import {
  registerSchema,
  verifyOtpSchema,
  loginSchema,
  requestOtpSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validations/auth.validation";

const router = Router();

// همه‌ی مسیرهای حساس auth با یک لیمیتر سخت‌گیرانه‌تر از global limiter محافظت می‌شوند
const authLimiter = strictAuthLimiter();

router.post("/register", authLimiter, validate(registerSchema), authController.register);
router.post(
  "/register/verify-otp",
  authLimiter,
  validate(verifyOtpSchema),
  authController.verifyRegisterOtp
);

router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post(
  "/login/otp/request",
  authLimiter,
  validate(requestOtpSchema),
  authController.requestLoginOtp
);
router.post(
  "/login/otp/verify",
  authLimiter,
  validate(verifyOtpSchema),
  authController.verifyLoginOtp
);

router.post(
  "/refresh-token",
  validate(refreshTokenSchema),
  authController.refreshToken
);

router.post("/logout", authenticate, authController.logout);
router.post("/logout-all", authenticate, authController.logoutAll);

router.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  "/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword
);

export default router;
