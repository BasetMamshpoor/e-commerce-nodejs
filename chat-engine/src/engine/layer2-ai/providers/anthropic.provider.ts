import { env } from "../../../config/env";
import { AiAnswerRequest, AiAnswerResult, AiProvider } from "../ai.types";
import { parseAiJsonReply } from "./parseAiJsonReply";

// ----------------------------------------------------------------------------
// آداپتور Anthropic (Claude) برای لایه ۲. از fetch مستقیم به Messages API
// استفاده می‌کنیم تا وابستگی اضافه به SDK نداشته باشیم.
// ----------------------------------------------------------------------------

export const anthropicProvider: AiProvider = {
  name: "anthropic",

  async answer(request: AiAnswerRequest): Promise<AiAnswerResult> {
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY تنظیم نشده است");
    }

    const messages = [
      ...request.history.map((turn) => ({
        role: turn.role === "customer" ? ("user" as const) : ("assistant" as const),
        content: turn.text,
      })),
      { role: "user" as const, content: request.customerMessage },
    ];

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: env.ANTHROPIC_MODEL,
        max_tokens: 500,
        system: request.systemPrompt,
        messages,
      }),
    });

    if (!res.ok) {
      throw new Error(`خطای Anthropic API: ${res.status} ${await res.text()}`);
    }

    const data = (await res.json()) as { content: { type: string; text?: string }[] };
    const rawText = data.content.find((block) => block.type === "text")?.text ?? "";

    return parseAiJsonReply(rawText);
  },
};
