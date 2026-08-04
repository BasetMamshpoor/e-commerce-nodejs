export interface AiHistoryTurn {
  role: "customer" | "engine";
  text: string;
}

export interface AiAnswerRequest {
  systemPrompt: string;
  history: AiHistoryTurn[];
  customerMessage: string;
}

export interface AiAnswerResult {
  text: string;
  // بین ۰ و ۱ — خودِ مدل تخمین می‌زند که چقدر از پاسخش مطمئن است
  confidence: number;
}

export interface AiProvider {
  readonly name: "anthropic" | "openai";
  answer(request: AiAnswerRequest): Promise<AiAnswerResult>;
}
