import { Injectable, Logger } from "@nestjs/common";

// ----------------------------------------------------------------------------
// یک wrapper نازک روی Bot API تلگرام (https://core.telegram.org/bots/api).
// عمداً بدون هیچ SDK ای — چون نیازمان فقط چند متد ساده است و یک وابستگی
// کمتر یعنی سطح حمله و مشکل نسخه کمتر.
// ----------------------------------------------------------------------------

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

export interface TelegramMessage {
  message_id: number;
  date: number;
  chat: { id: number; type: string };
  from?: { id: number; first_name?: string; last_name?: string; username?: string };
  text?: string;
}

@Injectable()
export class TelegramClientService {
  private readonly logger = new Logger(TelegramClientService.name);

  private baseUrl(botToken: string): string {
    return `https://api.telegram.org/bot${botToken}`;
  }

  // --- Polling ---
  // long-polling: درخواست تا timeout ثانیه باز می‌ماند و به محض رسیدن
  // پیام جدید یا رسیدن به timeout برمی‌گردد؛ offset یعنی «آخرین
  // update_id ای که پردازش کردم + ۱» — تلگرام هر چیزی با id کمتر از این
  // را دیگر دوباره نمی‌فرستد.
  async getUpdates(botToken: string, offset: number, timeoutSeconds = 30): Promise<TelegramUpdate[]> {
    const allowedUpdates = encodeURIComponent(JSON.stringify(["message"]));
    const url = `${this.baseUrl(botToken)}/getUpdates?offset=${offset}&timeout=${timeoutSeconds}&allowed_updates=${allowedUpdates}`;
    const res = await fetch(url);
    const data = (await res.json()) as { ok: boolean; result?: TelegramUpdate[]; description?: string };
    if (!data.ok) {
      throw new Error(`Telegram getUpdates failed: ${data.description ?? res.status}`);
    }
    return data.result ?? [];
  }

  async sendMessage(botToken: string, chatId: string | number, text: string): Promise<void> {
    const res = await fetch(`${this.baseUrl(botToken)}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`sendMessage failed for chat ${chatId}: ${body}`);
    }
  }

  // --- Webhook (برای وقتی تصمیم به تغییر از polling گرفته شد) ---
  async setWebhook(botToken: string, url: string, secretToken?: string): Promise<void> {
    const res = await fetch(`${this.baseUrl(botToken)}/setWebhook`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url, secret_token: secretToken, allowed_updates: ["message"] }),
    });
    const data = (await res.json()) as { ok: boolean; description?: string };
    if (!data.ok) {
      throw new Error(`Telegram setWebhook failed: ${data.description}`);
    }
    this.logger.log(`Webhook set to ${url}`);
  }

  async deleteWebhook(botToken: string): Promise<void> {
    await fetch(`${this.baseUrl(botToken)}/deleteWebhook`, { method: "POST" });
  }
}
