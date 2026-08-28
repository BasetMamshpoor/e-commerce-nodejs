import { Router } from "express";
import * as newsletterController from "../controllers/newsletter.controller";
import { validate } from "../middlewares/validate";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { z } from "zod";

const router = Router();

router.post("/subscribe", validate(z.object({ email: z.string().email() })), newsletterController.subscribe);
router.post("/unsubscribe", validate(z.object({ email: z.string().email() })), newsletterController.unsubscribe);

router.get("/admin/subscribers", authenticate, authorize("ADMIN"), newsletterController.listSubscribers);
router.get("/admin/subscribers/export", authenticate, authorize("ADMIN"), newsletterController.exportSubscribers);

export default router;
