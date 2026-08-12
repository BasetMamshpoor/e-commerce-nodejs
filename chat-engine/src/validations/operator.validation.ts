import { z } from "zod";

export const operatorReplySchema = z.object({
  conversationId: z.string().trim().min(1),
  text: z.string().trim().min(1).max(4000),
});

// بدون status یعنی همان پیش‌فرض قبلی (صف‌های مرتبط با اپراتور)؛ با status
// می‌شود هر وضعیتی (حتی OPEN/AI_HANDLING/CLOSED) را برای دید کامل ادمین دید
export const queueQuerySchema = z.object({
  status: z.enum(["OPEN", "AI_HANDLING", "NEEDS_OPERATOR", "WITH_OPERATOR", "CLOSED"]).optional(),
  channel: z.enum(["WEBSITE", "INSTAGRAM", "WHATSAPP", "TELEGRAM", "BALE"]).optional(),
});

export type OperatorReplyInput = z.infer<typeof operatorReplySchema>;
