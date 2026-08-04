import { z } from "zod";

export const sendMessageSchema = z.object({
  guestToken: z.string().trim().min(8).max(100),
  text: z.string().trim().min(1).max(2000),
  displayName: z.string().trim().max(100).optional(),
  storeUserId: z.coerce.number().int().positive().optional(),
});

export const historyQuerySchema = z.object({
  guestToken: z.string().trim().min(8).max(100),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
