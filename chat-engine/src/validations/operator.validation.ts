import { z } from "zod";

export const operatorReplySchema = z.object({
  conversationId: z.string().trim().min(1),
  text: z.string().trim().min(1).max(4000),
  // اگر اپراتور می‌خواهد به یک پیام مشخص (نه فقط آخرین پیام) ریپلای بزند
  replyToMessageId: z.string().trim().min(1).optional(),
});

const STATUS_VALUES = ["OPEN", "AI_HANDLING", "NEEDS_OPERATOR", "WITH_OPERATOR", "CLOSED"] as const;

// بدون status یعنی همه‌ی مکالمات (چت با بات را هم شامل می‌شود). می‌شود هم
// یک وضعیت داد (status=CLOSED) هم چندتا با کاما (status=NEEDS_OPERATOR,WITH_OPERATOR)
export const queueQuerySchema = z.object({
  status: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(",").map((s) => s.trim()) : undefined))
    .pipe(z.array(z.enum(STATUS_VALUES)).optional()),
  channel: z.enum(["WEBSITE", "INSTAGRAM", "WHATSAPP", "TELEGRAM", "BALE"]).optional(),
});

export type OperatorReplyInput = z.infer<typeof operatorReplySchema>;
