import { env } from "../../../config/env";
import { AiAnswerRequest, AiAnswerResult, AiProvider } from "../ai.types";
import { parseAiJsonReply } from "./parseAiJsonReply";

// ----------------------------------------------------------------------------
// آداپتور OpenAI برای لایه ۲ (Chat Completions API).
// ----------------------------------------------------------------------------

export const openaiProvider: AiProvider = {
  name: "openai",

  async answer(request: AiAnswerRequest): Promise<AiAnswerResult> {
    if (!env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY تنظیم نشده است");
    }

    const messages = [
      { role: "system" as const, content: request.systemPrompt },
      ...request.history.map((turn) => ({
        role: turn.role === "customer" ? ("user" as const) : ("assistant" as const),
        content: turn.text,
      })),
      { role: "user" as const, content: request.customerMessage },
    ];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        max_tokens: 500,
        messages,
      }),
    });

    if (!res.ok) {
      throw new Error(`خطای OpenAI API: ${res.status} ${await res.text()}`);
    }

    const data = (await res.json()) as { choices: { message: { content: string } }[] };
    const rawText = data.choices[0]?.message.content ?? "";

    return parseAiJsonReply(rawText);
  },
};
