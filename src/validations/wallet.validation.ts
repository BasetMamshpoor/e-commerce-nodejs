import { z } from "zod";

export const chargeWalletSchema = z.object({
  amount: z.coerce.number().int().positive().max(1_000_000_000),
  gatewaySlug: z.string().trim().min(1),
});

export const verifyPaymentSchema = z.object({
  providerParams: z.record(z.string(), z.string()).optional().default({}),
});

export type ChargeWalletInput = z.infer<typeof chargeWalletSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
