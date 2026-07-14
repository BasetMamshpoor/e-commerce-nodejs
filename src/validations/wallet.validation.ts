import { z } from "zod";

export const chargeWalletSchema = z.object({
  amount: z.coerce.number().int().positive().max(1_000_000_000),
  gatewaySlug: z.string().trim().min(1),
});

export const verifyPaymentSchema = z.object({
  providerParams: z.record(z.string(), z.string()).optional().default({}),
});

export const withdrawalRequestSchema = z.object({
  amount: z.coerce.number().int().positive(),
  description: z.string().max(500).optional(),
  bankSheba: z.string().trim().max(34).optional(),
  bankCardNumber: z.string().trim().max(19).optional(),
  bankAccountOwnerName: z.string().trim().max(100).optional(),
});

export const adminReviewWithdrawalSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  adminNote: z.string().max(500).optional(),
  trackingCode: z.string().trim().max(100).optional(),
});

export type ChargeWalletInput = z.infer<typeof chargeWalletSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type WithdrawalRequestInput = z.infer<typeof withdrawalRequestSchema>;
export type AdminReviewWithdrawalInput = z.infer<typeof adminReviewWithdrawalSchema>;
