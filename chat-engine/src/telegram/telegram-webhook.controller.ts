import { Body, Controller, Headers, Param, Post } from "@nestjs/common";
import { TenancyService } from "../tenancy/tenancy.service";
import { TelegramUpdateHandlerService } from "./telegram-update-handler.service";
import { TelegramUpdate } from "./telegram-client.service";
import { ApiError } from "../utils/ApiError";

// ----------------------------------------------------------------------------
// این کنترلر همین الان هم build/deploy می‌شود، اما تا وقتی TELEGRAM_MODE
// روی polling است هیچ‌کس این آدرس را صدا نمی‌زند (تلگرام فقط وقتی صدا
// می‌زند که با setWebhook این URL را به او معرفی کرده باشیم). روز سوییچ به
// webhook، فقط کافی است:
//   ۱) TELEGRAM_MODE=webhook در env
//   ۲) یک‌بار telegramClient.setWebhook(token, `${DOMAIN}/api/telegram/webhook/${tenantKey}`, secret) صدا زده شود
// هیچ کد دیگری لازم نیست تغییر کند.
//
// tenantKey در مسیر است (نه هدر) چون تلگرام هیچ هدر سفارشی‌ای نمی‌فرستد؛
// اعتبار درخواست هم با هدر X-Telegram-Bot-Api-Secret-Token (اگر برای
// تنانت ست شده باشد) چک می‌شود تا کسی نتواند این آدرس را جعل کند.
// ----------------------------------------------------------------------------

@Controller("telegram")
export class TelegramWebhookController {
  constructor(
    private readonly tenancyService: TenancyService,
    private readonly updateHandler: TelegramUpdateHandlerService
  ) {}

  @Post("webhook/:tenantKey")
  async webhook(
    @Param("tenantKey") tenantKey: string,
    @Headers("x-telegram-bot-api-secret-token") secretHeader: string | undefined,
    @Body() update: TelegramUpdate
  ) {
    const tenant = await this.tenancyService.resolveTenant(tenantKey);

    if (tenant.telegramWebhookSecret && tenant.telegramWebhookSecret !== secretHeader) {
      throw ApiError.unauthorized("secret token نامعتبر است");
    }

    await this.updateHandler.handle(tenant, update);

    // تلگرام فقط یک ۲۰۰ لازم دارد؛ بدنه‌ی خاصی نمی‌خواهد
    return { ok: true };
  }
}
