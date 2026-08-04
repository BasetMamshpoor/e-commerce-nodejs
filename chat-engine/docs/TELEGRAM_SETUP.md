# راه‌اندازی ربات تلگرام

## همین الان (حالت polling — برای توسعه)

۱. توکنی که از BotFather گرفتی (برای بات `kakbaset_bot`) را در `chat-engine/.env` بگذار:

```env
TELEGRAM_MODE=polling
DEFAULT_TENANT_TELEGRAM_BOT_TOKEN=8768429641:AAFbqJ_0ggU_5Be7PMIXt-ZgiB91o_0WSPo
```

⚠️ این فایل (`.env`) هیچ‌وقت commit/zip نمی‌شود — همیشه همین‌جا محلی بماند.
اگر فکر می‌کنی این توکن جایی لو رفته، در تلگرام به BotFather پیام بده و
`/revoke` بزن تا یک توکن جدید بگیری.

۲. سرور را بالا بیاور:

```bash
cd chat-engine
npm install   # اگر قبلاً نزدی
npm run dev
```

در لاگ باید این را ببینی:
```
شروع polling تلگرام برای تنانت «default» (offset فعلی: 0)
```

۳. برو تو تلگرام دنبال `@kakbaset_bot` بگرد، `/start` بزن یا هر سوالی
   بپرس («قیمت این محصول چنده؟»). طبق همان سه لایه‌ای که برای سایت ساختیم
   جواب می‌گیری — چون هر دو کانال از یک pipeline مشترک رد می‌شوند.

همین. نیازی به دامنه، HTTPS، یا هیچ تنظیم دیگری در این مرحله نیست.

### چطور کار می‌کند؟

سرور هر چند ثانیه یک‌بار (long-polling، تا ۳۰ ثانیه صبر می‌کند) از تلگرام
می‌پرسد «پیام جدید داری؟». هر پیام از همان مسیر مشترک همه‌ی کانال‌ها
(`MessageService.processIncomingMessage`) رد می‌شود، جواب لایه ۱/۲/۳ ساخته
می‌شود، و بلافاصله با `sendMessage` به همان چت تلگرام برگردانده می‌شود. اگر
مکالمه به اپراتور ارجاع شود، جواب اپراتور هم از همین مسیر (پنل اپراتور →
`OutboundDeliveryService`) به تلگرام می‌رسد.

آخرین پیام پردازش‌شده (`offset`) در MongoDB ذخیره می‌شود، پس اگر سرور را
ری‌استارت کنی، پیام‌های قبلاً پاسخ‌داده‌شده دوباره پردازش نمی‌شوند.

---

## آینده: سوییچ به webhook (برای تولید)

وقتی سرور روی یک دامنه‌ی واقعی با HTTPS دیپلوی شد، فقط همین چند قدم لازم
است — **هیچ کد دیگری تغییر نمی‌کند** (کنترلر وبهوک از همین حالا در پروژه
هست، فقط فعال نیست):

۱. در `.env`:
```env
TELEGRAM_MODE=webhook
TELEGRAM_WEBHOOK_BASE_URL=https://chat.yourdomain.com
```

۲. یک‌بار (مثلاً در یک اسکریپت کوچک یا از طریق curl) وبهوک را به تلگرام معرفی کن:
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "content-type: application/json" \
  -d '{"url": "https://chat.yourdomain.com/api/telegram/webhook/default", "secret_token": "<یک رشته‌ی تصادفی دلخواه>"}'
```
همان `secret_token` را هم در فیلد `telegramWebhookSecret` سند تنانت در
Mongo ذخیره کن تا کنترلر بتواند اعتبار درخواست‌های ورودی را چک کند.

۳. سرور را ری‌استارت کن — چون `TELEGRAM_MODE=webhook` است، حلقه‌ی polling
   خودش شروع نمی‌شود؛ به‌جایش تلگرام مستقیم به
   `POST /api/telegram/webhook/default` پیام می‌فرستد.

هیچ تغییری در `TelegramUpdateHandlerService` (منطق اصلی پردازش پیام) لازم
نیست — همان کدی که در حالت polling استفاده می‌شد، عیناً برای webhook هم
استفاده می‌شود.
