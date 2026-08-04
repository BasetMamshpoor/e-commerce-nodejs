import { env } from "../../config/env";
import { AiProvider } from "./ai.types";
import { anthropicProvider } from "./providers/anthropic.provider";
import { openaiProvider } from "./providers/openai.provider";

// ----------------------------------------------------------------------------
// لایه‌ی دوم عمداً به هیچ سرویس خاصی قفل نیست — بین Anthropic و OpenAI با
// تنظیمات قابل تعویض است. tenantOverride اجازه می‌دهد در آینده (چند-مستاجری)
// هر کسب‌وکار سرویس AI خودش را انتخاب کند.
// ----------------------------------------------------------------------------

export function getAiProvider(tenantOverride?: "anthropic" | "openai" | null): AiProvider {
  const providerName = tenantOverride ?? env.AI_PROVIDER;
  return providerName === "openai" ? openaiProvider : anthropicProvider;
}
