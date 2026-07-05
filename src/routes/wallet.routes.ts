import { Router } from "express";
import * as walletController from "../controllers/wallet.controller";
import { validate } from "../middlewares/validate";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { chargeWalletSchema, verifyPaymentSchema, withdrawalRequestSchema, adminReviewWithdrawalSchema } from "../validations/wallet.validation";

const router = Router();
const adminOnly = [authenticate, authorize("ADMIN")] as const;

router.use(authenticate);

router.get("/", walletController.overview);
router.post("/charge/initiate", validate(chargeWalletSchema), walletController.chargeInitiate);
router.post(
  "/charge/:transactionId/verify",
  validate(verifyPaymentSchema),
  walletController.chargeVerify
);
router.post("/withdrawals", validate(withdrawalRequestSchema), walletController.requestWithdrawal);
router.get("/withdrawals", walletController.listMyWithdrawals);

router.get("/admin/withdrawals", ...adminOnly, walletController.listWithdrawalsAdmin);
router.put("/admin/withdrawals/:id", ...adminOnly, validate(adminReviewWithdrawalSchema), walletController.reviewWithdrawalAdmin);

export default router;
