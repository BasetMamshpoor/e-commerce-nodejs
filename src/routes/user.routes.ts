import { Router } from "express";
import * as userAdminController from "../controllers/user-admin.controller";
import { validate } from "../middlewares/validate";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  adminListUsersQuerySchema,
  blockUserSchema,
  updateUserRoleSchema,
} from "../validations/user-admin.validation";

const router = Router();
const adminOnly = [authenticate, authorize("ADMIN")] as const;

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
