import { z } from "zod";

export const operatorReplySchema = z.object({
  conversationId: z.string().trim().min(1),
  text: z.string().trim().min(1).max(4000),
});

export const queueQuerySchema = z.object({
  status: z.enum(["NEEDS_OPERATOR", "WITH_OPERATOR"]).optional(),
});

export type OperatorReplyInput = z.infer<typeof operatorReplySchema>;
