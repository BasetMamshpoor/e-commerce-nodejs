import { Router } from "express";
import * as blockedIpController from "../controllers/blocked-ip.controller";
import { validate } from "../middlewares/validate";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { createBlockedIpSchema } from "../validations/blocked-ip.validation";

const router = Router();
const adminOnly = [authenticate, authorize("ADMIN")] as const;

router.get("/blocked-ips", ...adminOnly, blockedIpController.list);
router.post(
  "/blocked-ips",
  ...adminOnly,
  validate(createBlockedIpSchema),
  blockedIpController.block
);
router.delete("/blocked-ips/:id", ...adminOnly, blockedIpController.unblock);

export default router;
