import { AiAnswerRequest, AiAnswerResult, AiProvider } from "../ai.types";
import { parseAiJsonReply } from "./parseAiJsonReply";

// ----------------------------------------------------------------------------
// OpenAI، DeepSeek، OpenRouter، Kilo Gateway، و لایه‌ی سازگار Google AI
// Studio همگی همان API با شکل درخواست/پاسخ یکسان (/chat/completions) را
// پیاده‌سازی می‌کنند — فقط baseUrl و apiKey و model فرق دارد. برای همین یک
// پیاده‌سازی کافی است؛ هرکدام فقط با config متفاوت instantiate می‌شوند
// (factory.ts).
// ----------------------------------------------------------------------------

export interface OpenAiCompatibleConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export function createOpenAiCompatibleProvider(config: OpenAiCompatibleConfig): AiProvider {
  return {
    name: config.name,

    async answer(request: AiAnswerRequest): Promise<AiAnswerResult> {
      if (!config.apiKey) {
        throw new Error(`${config.name}: کلید API تنظیم نشده است`);
      }
      if (!config.baseUrl) {
        throw new Error(`${config.name}: base URL تنظیم نشده است`);
      }
      if (!config.model) {
        throw new Error(`${config.name}: model تنظیم نشده است`);
      }

      const messages = [
        { role: "system" as const, content: request.systemPrompt },
        ...request.history.map((turn) => ({
          role: turn.role === "customer" ? ("user" as const) : ("assistant" as const),
          content: turn.text,
        })),
        { role: "user" as const, content: request.customerMessage },
      ];

      const url = `${config.baseUrl.replace(/\/+$/, "")}/chat/completions`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 500,
          messages,
        }),
      });

      if (!res.ok) {
        throw new Error(`خطای ${config.name} API: ${res.status} ${await res.text()}`);
      }

      const data = (await res.json()) as { choices: { message: { content: string } }[] };
      const rawText = data.choices[0]?.message.content ?? "";

      return parseAiJsonReply(rawText);
    },
  };
}
