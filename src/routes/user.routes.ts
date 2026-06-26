import { Router } from "express";
import * as userAdminController from "../controllers/user-admin.controller";
import * as profileController from "../controllers/profile.controller";
import { validate } from "../middlewares/validate";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  adminListUsersQuerySchema,
  blockUserSchema,
  updateUserRoleSchema,
} from "../validations/user-admin.validation";
import {
  updateMyProfileSchema,
  setAvatarSchema,
  changePasswordSchema,
  requestChangeIdentifierSchema,
  verifyChangeIdentifierSchema,
} from "../validations/profile.validation";

const router = Router();
const adminOnly = [authenticate, authorize("ADMIN")] as const;

// --- پروفایل خودِ کاربر ---
router.get("/me", authenticate, profileController.getMe);
router.put("/me", authenticate, validate(updateMyProfileSchema), profileController.updateMe);
router.put("/me/avatar", authenticate, validate(setAvatarSchema), profileController.setAvatar);
router.put(
  "/me/password",
  authenticate,
  validate(changePasswordSchema),
  profileController.changePassword
);
router.post(
  "/me/change-identifier/request",
  authenticate,
  validate(requestChangeIdentifierSchema),
  profileController.requestChangeIdentifier
);
router.post(
  "/me/change-identifier/verify",
  authenticate,
  validate(verifyChangeIdentifierSchema),
  profileController.verifyChangeIdentifier
);

// --- مدیریت کاربران از پنل ادمین ---
router.get(
  "/admin",
  ...adminOnly,
  validate(adminListUsersQuerySchema, "query"),
  userAdminController.list
);
router.get("/admin/:id", ...adminOnly, userAdminController.getById);
router.put("/admin/:id/block", ...adminOnly, validate(blockUserSchema), userAdminController.block);
router.put("/admin/:id/unblock", ...adminOnly, userAdminController.unblock);
router.put(
  "/admin/:id/role",
  ...adminOnly,
  validate(updateUserRoleSchema),
  userAdminController.updateRole
);

router.get("/admin/:id/sessions", ...adminOnly, userAdminController.listSessions);
router.delete(
  "/admin/:id/sessions/:sessionId",
  ...adminOnly,
  userAdminController.revokeSession
);
router.delete("/admin/:id/sessions", ...adminOnly, userAdminController.revokeAllSessions);

export default router;
