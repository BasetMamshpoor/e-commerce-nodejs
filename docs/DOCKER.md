# راه‌اندازی با Docker

این پروژه (بک‌اند اصلی + chat-engine) با Docker Compose اجرا می‌شود — هم
برای تست لوکال (با hot reload) و هم برای دیپلوی روی سرور، با **همان یک
مجموعه فایل**. تفاوت فقط در این است که لوکال از `docker-compose.override.yml`
هم استفاده می‌شود (خودکار)، روی سرور نه.

## سرویس‌ها

| سرویس | چیه | پورت روی هاست |
|---|---|---|
| `postgres` | دیتابیس فروشگاه — هم بک‌اند می‌نویسه، هم chat-engine فقط می‌خونه | `127.0.0.1:5432` |
| `redis` | Redis بک‌اند اصلی (rate limit، کش، قفل جاب‌ها) | `127.0.0.1:6379` |
| `mongo` | دیتابیس مستقل chat-engine (مکالمات/پیام‌ها/تنانت‌ها) | `127.0.0.1:27017` |
| `chat-redis` | Redis مستقل chat-engine (Socket.io adapter + کش) | `127.0.0.1:6380` |
| `backend` | بک‌اند اصلی فروشگاه | `4000` |
| `chat-engine` | موتور پاسخگو (سایت + تلگرام) | `4100` |

پورت‌های دیتابیس/Redis فقط روی `127.0.0.1` باز می‌شوند (نه به بیرون) — فقط
برای اینکه بتوانی از خودِ سرور با یک ابزار GUI بهشان وصل شوی.

---

## پیش‌نیاز

- Docker + Docker Compose نصب باشد (`docker compose version` را چک کن)

---

## قدم‌به‌قدم (اولین اجرا، لوکال)

### ۱. فایل‌های `.env` را بساز

```bash
cp .env.example .env
cp chat-engine/.env.example chat-engine/.env
```

### ۲. مقادیر ضروری را در `.env` (ریشه‌ی پروژه) پر کن

حداقل این‌ها را عوض کن (مقدار پیش‌فرض فقط برای تست است، برای production
حتماً عوضش کن):

```env
JWT_ACCESS_SECRET=یک-رشته‌ی-تصادفی-طولانی-اینجا
JWT_REFRESH_SECRET=یک-رشته‌ی-تصادفی-طولانی-دیگر-اینجا
POSTGRES_PASSWORD=یک-رمز-قوی
```

> `JWT_ACCESS_SECRET` را جایی یادداشت کن — همین مقدار خودکار به chat-engine
> هم پاس داده می‌شود (نیازی نیست جای دیگری هم بنویسی‌اش).

### ۳. مقادیر chat-engine را در `chat-engine/.env` پر کن

```env
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...

# تلگرام (توکن از BotFather — طبق docs/TELEGRAM_SETUP.md)
TELEGRAM_MODE=polling
DEFAULT_TENANT_TELEGRAM_BOT_TOKEN=your-telegram-bot-token
```

(بقیه‌ی مقادیر این فایل — `MONGO_URI`, `REDIS_URL`,
`DEFAULT_TENANT_STORE_DATABASE_URL`, `JWT_ACCESS_SECRET`, `PORT` — را
docker-compose خودش override می‌کند، دست نزن بهشان.)

### ۴. بالا بیار

```bash
docker compose up --build
```

اولین بار کمی طول می‌کشد (نصب پکیج‌ها + build ایمیج‌ها). بعد از آن:
- migration های Postgres خودکار اجرا می‌شوند
- تنانت پیش‌فرض chat-engine خودکار ساخته می‌شود
- اگر توکن تلگرام را گذاشته باشی، polling خودکار شروع می‌شود

وقتی این خط‌ها را دیدی یعنی همه‌چیز بالاست:
```
backend       | 🚀 سرور روی پورت 4000 اجرا شد
chat-engine   | 🚀 chat-engine روی پورت 4100 در حالت development اجرا شد
chat-engine   | شروع polling تلگرام برای تنانت «default» ...
```

بک‌اند اصلی: http://localhost:4000
chat-engine: http://localhost:4100/health

### حالت توسعه (پیش‌فرض) چطور کار می‌کند؟

چون `docker-compose.override.yml` هم هست، Compose خودکار آن را با فایل
اصلی ترکیب می‌کند — یعنی:
- کد از روی سیستم خودت داخل کانتینر mount می‌شود (`ts-node-dev` /
  `nest start --watch`) — هر تغییری در کد بدون rebuild ایمیج، خودش را
  نشان می‌دهد.
- `node_modules` مال خودِ کانتینر است (با سیستم‌عامل کانتینر سازگار)، نه
  چیزی که روی هاست نصب کردی.

اگر پکیج جدیدی اضافه کردی (`package.json` عوض شد)، باید rebuild کنی:
```bash
docker compose up --build
```

---

## دستورات پرکاربرد

```bash
# اجرا در پس‌زمینه
docker compose up -d --build

# دیدن لاگ‌ها
docker compose logs -f backend
docker compose logs -f chat-engine

# اجرای یک دستور داخل کانتینر (مثلاً seed زدن دیتابیس)
docker compose exec backend npx tsx prisma/seed.ts

# باز کردن یک شل داخل کانتینر
docker compose exec backend sh

# متوقف کردن همه‌چیز (دیتا در volume ها می‌ماند)
docker compose down

# متوقف کردن و پاک‌کردن دیتابیس‌ها هم (⚠️ همه‌ی دیتا پاک می‌شود)
docker compose down -v

# ری‌استارت فقط یک سرویس
docker compose restart chat-engine
```

---

## دیپلوی روی سرور (Production)

تفاوت اصلی با لوکال: `docker-compose.override.yml` نباید استفاده شود (آن
فایل مخصوص hot-reload لوکال است).

### روش ۱ — ساده‌ترین: حذف فایل override روی سرور

اگر کد را با `git clone`/`git pull` روی سرور می‌آوری، کافی است
`docker-compose.override.yml` را در سرور نداشته باشی (مثلاً در `.gitignore`
سرور یا با `rm` بعد از pull) و فقط بزنی:

```bash
docker compose up -d --build
```

### روش ۲ — صریح: همیشه فقط فایل اصلی را بده

```bash
docker compose -f docker-compose.yml up -d --build
```

این روش امن‌تر است چون حتی اگر فایل override هم روی سرور باشد، نادیده
گرفته می‌شود.

### چک‌لیست قبل از production

- [ ] `.env` و `chat-engine/.env` را با مقادیر واقعی (نه پیش‌فرض‌های تست) پر کن — مخصوصاً `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `POSTGRES_PASSWORD`.
- [ ] `CORS_ORIGIN` (هم در `.env` هم در `chat-engine/.env`) را به دامنه‌ی واقعی فرانت‌اند بگذار، نه `*`.
- [ ] سرور را پشت یک reverse proxy (Nginx/Caddy) با HTTPS بگذار؛ هدرهای upgrade وب‌سوکت را برای `chat-engine` عبور بده (نمونه‌ی کانفیگ در `chat-engine/docs/FRONTEND_INTEGRATION.md`).
- [ ] اگر تلگرام آماده‌ی production است، طبق `chat-engine/docs/TELEGRAM_SETUP.md` به حالت `webhook` سوییچ کن.
- [ ] برای Postgres یک role با دسترسی فقط `SELECT` بساز و connection string آن را برای chat-engine استفاده کن (به‌جای همان کاربر ادمین بک‌اند) — دستورش:
  ```sql
  CREATE ROLE chat_engine_reader WITH LOGIN PASSWORD 'یک-رمز-قوی';
  GRANT CONNECT ON DATABASE shopdb TO chat_engine_reader;
  GRANT USAGE ON SCHEMA public TO chat_engine_reader;
  GRANT SELECT ON ALL TABLES IN SCHEMA public TO chat_engine_reader;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO chat_engine_reader;
  ```
  و بعد در `docker-compose.yml` مقدار `DEFAULT_TENANT_STORE_DATABASE_URL` سرویس `chat-engine` را با این کاربر عوض کن.
- [ ] یک بک‌آپ خودکار برای volume های `postgres_data` و `mongo_data` تنظیم کن (این‌ها با `docker compose down -v` پاک می‌شوند، پس مراقب باش).
- [ ] پورت‌های دیتابیس/Redis (`5432`, `6379`, `6380`, `27017`) را اصلاً به بیرون از سرور expose نکن — همین الان هم فقط روی `127.0.0.1` هستند، اما اگر فایروال سرور باز است دوباره چک کن.

---

## عیب‌یابی سریع

**`backend` بالا نمی‌آید / خطای اتصال به دیتابیس:**
```bash
docker compose logs postgres
docker compose ps   # ببین postgres واقعاً healthy شده یا نه
```

**chat-engine می‌گوید تنانتی با توکن تلگرام پیدا نشد:**
یعنی `DEFAULT_TENANT_TELEGRAM_BOT_TOKEN` را در `chat-engine/.env` خالی
گذاشته‌ای یا تنانت قبل از اضافه‌کردن توکن ساخته شده. کافی است توکن را در
`.env` بگذاری و کانتینر را ری‌استارت کنی — چون همین‌طور که `TENANT`
service (`tenancy.service.ts`) نوشته شده، خودش موقع بالا آمدن توکن را روی
تنانت موجود sync می‌کند.

**تغییرات کد دیده نمی‌شود (حالت dev):**
مطمئن شو `docker-compose.override.yml` وجود دارد و صریحاً `-f docker-compose.yml` نزدی.
