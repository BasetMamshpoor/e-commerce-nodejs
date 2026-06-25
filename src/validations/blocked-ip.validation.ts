import { z } from "zod";

export const createBlockedIpSchema = z.object({
  ip: z.string().trim().min(3).max(45), // IPv4 یا IPv6
  reason: z.string().trim().max(500).optional(),
  expiresAt: z.coerce.date().optional(), // اگر نباشد یعنی برای همیشه
});

export type CreateBlockedIpInput = z.infer<typeof createBlockedIpSchema>;
