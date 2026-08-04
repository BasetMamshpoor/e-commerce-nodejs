import { Injectable, Logger, OnApplicationShutdown } from "@nestjs/common";
import { env } from "../config/env";
import { TenantModel, TenantDocument } from "../tenancy/tenant.model";
import { TelegramPollingStateModel } from "./telegram-polling-state.model";
import { TelegramClientService } from "./telegram-client.service";
import { TelegramUpdateHandlerService } from "./telegram-update-handler.service";

const POLL_TIMEOUT_SECONDS = 30; // long-polling: تلگرام تا این‌قدر منتظر پیام جدید می‌ماند
const ERROR_BACKOFF_MS = 3000; // اگر خطا خورد، قبل از تلاش دوباره کمی صبر کن

// ----------------------------------------------------------------------------
// برای هر تنانتی که telegramBotToken دارد، یک حلقه‌ی long-polling جدا اجرا
// می‌شود. این یعنی از همین امروز هم اگر فردا تنانت دوم با بات تلگرام خودش
// اضافه شد، بدون هیچ تغییر کدی حلقه‌ی دومش هم خودکار بالا می‌آید.
//
// چرا این‌جا و نه در main.ts مستقیم؟ چون start() باید بعد از آماده‌شدن
// دیتابیس Mongo (و ensureDefaultTenant) صدا زده شود — همان ترتیبی که در
// main.ts رعایت می‌کنیم.
// ----------------------------------------------------------------------------

@Injectable()
export class TelegramPollingService implements OnApplicationShutdown {
  private readonly logger = new Logger(TelegramPollingService.name);
  private stopped = false;

  constructor(
    private readonly telegramClient: TelegramClientService,
    private readonly updateHandler: TelegramUpdateHandlerService
  ) {}

  async start(): Promise<void> {
    if (env.TELEGRAM_MODE !== "polling") {
      this.logger.log("TELEGRAM_MODE=webhook است — polling شروع نمی‌شود");
      return;
    }

    const tenants = await TenantModel.find({ isActive: true, telegramBotToken: { $nin: [null, ""] } });
    if (tenants.length === 0) {
      this.logger.warn("هیچ تنانتی با توکن تلگرام پیدا نشد — polling شروع نشد");
      return;
    }

    for (const tenant of tenants) {
      // عمداً await نمی‌کنیم — هر تنانت حلقه‌ی خودش را در پس‌زمینه اجرا می‌کند
      void this.pollLoop(tenant);
    }
  }

  onApplicationShutdown(): void {
    this.stopped = true;
  }

  private async pollLoop(tenant: TenantDocument): Promise<void> {
    const botToken = tenant.telegramBotToken as string;

    const state = await TelegramPollingStateModel.findOneAndUpdate(
      { tenantKey: tenant.key },
      { $setOnInsert: { tenantKey: tenant.key, offset: 0 } },
      { upsert: true, new: true }
    );
    let offset = state.offset;

    this.logger.log(`شروع polling تلگرام برای تنانت «${tenant.key}» (offset فعلی: ${offset})`);

    while (!this.stopped) {
      try {
        const updates = await this.telegramClient.getUpdates(botToken, offset, POLL_TIMEOUT_SECONDS);

        for (const update of updates) {
          await this.updateHandler.handle(tenant, update);
          offset = update.update_id + 1;
        }

        if (updates.length > 0) {
          await TelegramPollingStateModel.updateOne({ tenantKey: tenant.key }, { $set: { offset } });
        }
      } catch (err) {
        this.logger.error(
          `خطا در polling تنانت «${tenant.key}»: ${err instanceof Error ? err.message : String(err)}`
        );
        await sleep(ERROR_BACKOFF_MS);
      }
    }

    this.logger.log(`polling تلگرام برای تنانت «${tenant.key}» متوقف شد`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
