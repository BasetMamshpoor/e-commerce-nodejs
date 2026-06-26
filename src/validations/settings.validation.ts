import { z } from "zod";

export const upsertSettingSchema = z.object({
  value: z.string(),
  type: z.enum(["string", "number", "boolean", "json"]).optional().default("string"),
});

export type UpsertSettingInput = z.infer<typeof upsertSettingSchema>;
