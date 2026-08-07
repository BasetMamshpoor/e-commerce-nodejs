import { Injectable } from "@nestjs/common";
import { runEnginePipeline } from "../engine/pipeline";
import { IncomingMessage, EngineReply, ConversationContext } from "../engine/types";
import { ProductLookupPort } from "../engine/productMatcher/types";
import { AiHistoryTurn } from "../engine/layer2-ai/ai.types";

// ----------------------------------------------------------------------------
// engine/* عمداً framework-agnostic نوشته شده (بدون هیچ import ای از نست) تا
// مستقل و مستقیماً قابل تست باشد. این سرویس فقط یک پوستهٔ نازک تزریق‌پذیر
// دور همان pipeline است تا بقیه‌ی موتور (که به سبک نست است) بتواند آن را
// inject کند.
// ----------------------------------------------------------------------------

@Injectable()
export class EngineService {
  run(
    lookup: ProductLookupPort,
    message: IncomingMessage,
    history: AiHistoryTurn[],
    context: ConversationContext,
    tenantAiOverride?: string | null
  ): Promise<EngineReply> {
    return runEnginePipeline(lookup, message, history, context, tenantAiOverride);
  }
}
