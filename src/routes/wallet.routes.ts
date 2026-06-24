import { Router } from "express";
import * as walletController from "../controllers/wallet.controller";
import { validate } from "../middlewares/validate";
import { authenticate } from "../middlewares/auth.middleware";
import { chargeWalletSchema, verifyPaymentSchema } from "../validations/wallet.validation";

const router = Router();
router.use(authenticate);

router.get("/", walletController.overview);
router.post("/charge/initiate", validate(chargeWalletSchema), walletController.chargeInitiate);
router.post(
  "/charge/:transactionId/verify",
  validate(verifyPaymentSchema),
  walletController.chargeVerify
);

export default router;
