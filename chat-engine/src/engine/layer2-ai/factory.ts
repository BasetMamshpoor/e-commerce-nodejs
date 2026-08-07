import { env } from "../../config/env";
import { AiProvider } from "./ai.types";
import { anthropicProvider } from "./providers/anthropic.provider";
import { createOpenAiCompatibleProvider, OpenAiCompatibleConfig } from "./providers/openaiCompatible.provider";

// ----------------------------------------------------------------------------
// لایه‌ی دوم به هیچ سرویس خاصی قفل نیست. AI_PROVIDER در env مشخص می‌کند
// کدام یک فعال است؛ هرکدام از OpenAI/DeepSeek/OpenRouter/Kilo/Google یک
// baseUrl پیش‌فرض verify‌شده دارند ولی کاملاً قابل override با env هستند —
// یعنی می‌شود همین factory را بدون تغییر کد برای هر gateway سازگار با
// OpenAI دیگری هم استفاده کرد (AI_PROVIDER=custom + سه متغیر CUSTOM_*).
//
// tenantOverride اجازه می‌دهد در آینده (چند-مستاجری) هر کسب‌وکار سرویس AI
// خودش را جدا از بقیه انتخاب کند.
// ----------------------------------------------------------------------------

function openAiCompatiblePresets(): Record<string, OpenAiCompatibleConfig> {
  return {
    openai: { name: "openai", baseUrl: env.OPENAI_BASE_URL, apiKey: env.OPENAI_API_KEY, model: env.OPENAI_MODEL },
    deepseek: { name: "deepseek", baseUrl: env.DEEPSEEK_BASE_URL, apiKey: env.DEEPSEEK_API_KEY, model: env.DEEPSEEK_MODEL },
    openrouter: {
      name: "openrouter",
      baseUrl: env.OPENROUTER_BASE_URL,
      apiKey: env.OPENROUTER_API_KEY,
      model: env.OPENROUTER_MODEL,
    },
    kilo: { name: "kilo", baseUrl: env.KILO_BASE_URL, apiKey: env.KILO_API_KEY, model: env.KILO_MODEL },
    google: { name: "google", baseUrl: env.GOOGLE_BASE_URL, apiKey: env.GOOGLE_API_KEY, model: env.GOOGLE_MODEL },
    custom: { name: "custom", baseUrl: env.CUSTOM_BASE_URL, apiKey: env.CUSTOM_API_KEY, model: env.CUSTOM_MODEL },
  };
}

export function getAiProvider(tenantOverride?: string | null): AiProvider {
  const providerName = tenantOverride ?? env.AI_PROVIDER;

  if (providerName === "anthropic") {
    return anthropicProvider;
  }

  const preset = openAiCompatiblePresets()[providerName];
  if (!preset) {
    throw new Error(
      `AI_PROVIDER «${providerName}» شناخته‌شده نیست. یکی از این‌ها را بگذارید: anthropic, openai, deepseek, openrouter, kilo, google, custom`
    );
  }

  return createOpenAiCompatibleProvider(preset);
}
