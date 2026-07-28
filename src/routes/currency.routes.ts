import { Router } from "express";
import * as currencyController from "../controllers/currency.controller";
import { validate } from "../middlewares/validate";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { z } from "zod";

const adminOnly = [authenticate, authorize("ADMIN")] as const;

const createCurrencySchema = z.object({
  code: z.string().trim().min(2).max(10),
  name: z.string().trim().min(1).max(100),
  symbol: z.string().trim().max(10).optional(),
});

const updateCurrencySchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  isActive: z.coerce.boolean().optional(),
  currentRate: z.coerce.number().nonnegative().optional(),
});

const router = Router();

router.get("/", ...adminOnly, currencyController.list);
router.post("/", ...adminOnly, validate(createCurrencySchema), currencyController.create);
router.patch("/:id", ...adminOnly, validate(updateCurrencySchema), currencyController.update);

export default router;
