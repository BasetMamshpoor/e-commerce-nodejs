# راهنمای اتصال فرانت‌اند به chat-engine (ویجت چت زنده‌ی سایت)

این سند همه‌چیزی است که برای وصل‌کردن فرانت‌اند سایت به موتور پاسخگو لازم
داری — از تولید هویت مهمان تا کد کامل و آماده‌ی اجرا. فرقی نمی‌کند فرانت
سایت با چه فریم‌ورکی نوشته شده باشد (React, Vue, Next.js, یا حتی HTML خام)؛
پروتکل زیرین همیشه همین است.

---

## ۱. مفاهیم پایه

### دو راه ارتباط، دو هدف متفاوت

| | استفاده | 
|---|---|
| **Socket.io (WebSocket)** | ارتباط اصلی و زنده‌ی ویجت چت — پاسخ لحظه‌ای، توصیه‌شده |
| **REST** | گرفتن تاریخچه‌ی مکالمه هنگام باز شدن ویجت + fallback اگر WebSocket وصل نشد |

هر دو مسیر از یک pipeline پشت صحنه رد می‌شوند، پس رفتار (لایه‌ی کلمات
رزرو شده → AI → اپراتور) در هر دو یکسان است؛ فقط شکل ارتباط فرق دارد.

### آدرس‌های پایه

فرض کن chat-engine روی همین سرور و پورت `PORT` (پیش‌فرض `4100`) بالاست:

```
API_BASE_URL = http://localhost:4100/api      # در تولید: https://chat.yourdomain.com/api
WS_BASE_URL  = http://localhost:4100          # در تولید: https://chat.yourdomain.com (خودش wss می‌شود)
```

اینها را در فرانت به‌عنوان متغیر محیطی بگذار (مثلاً در Next.js:
`NEXT_PUBLIC_CHAT_API_URL` و `NEXT_PUBLIC_CHAT_WS_URL`؛ در Vite:
`VITE_CHAT_API_URL` و `VITE_CHAT_WS_URL`).

### CORS

بک‌اند از env متغیر `CORS_ORIGIN` می‌خواند. در توسعه می‌تواند `*` باشد؛
**در تولید حتماً باید دقیقاً دامنه‌ی فرانت را بگذاری** (مثلاً
`https://shop.com`)، وگرنه هم REST و هم WebSocket بلاک می‌شوند.

---

## ۲. `guestToken` — هویت مشتری در چت

هر مشتری (لاگین‌کرده یا نه) با یک `guestToken` شناخته می‌شود که **خودِ
فرانت** آن را می‌سازد، در `localStorage` نگه می‌دارد و در تمام
درخواست‌ها/اتصال‌ها همان مقدار را می‌فرستد. این توکن است که مکالمه را بین
پیام‌های مختلف و حتی بعد از رفرش صفحه به هم وصل نگه می‌دارد.

- باید بین ۸ تا ۱۰۰ کاراکتر باشد (اعتبارسنجی سمت سرور)
- یک‌بار تولید می‌شود و **هرگز نباید عوض شود** (وگرنه مشتری تاریخچه‌اش را
  از دست می‌دهد و به چشم موتور یک نفر جدید می‌آید)
- اگر کاربر لاگین است، می‌توانی علاوه بر `guestToken`، شناسه‌ی کاربر سایت
  (`storeUserId`) را هم بفرستی تا مکالمه به حساب او لینک شود — اما
  `guestToken` باز هم لازم است

```js
function getGuestToken() {
  const KEY = "chat_guest_token";
  let token = localStorage.getItem(KEY);
  if (!token) {
    token = crypto.randomUUID(); // پشتیبانی همه‌ی مرورگرهای مدرن
    localStorage.setItem(KEY, token);
  }
  return token;
}
```

---

## ۳. اتصال زنده با Socket.io (روش اصلی)

### نصب

```bash
npm install socket.io-client
```

### اتصال

اتصال به namespace اختصاصی `/chat` با `guestToken` در query:

```js
import { io } from "socket.io-client";

const socket = io(`${WS_BASE_URL}/chat`, {
  query: { guestToken: getGuestToken() },
  // در محیط‌هایی که پروکسی/لودبالانسر sticky session ندارد، بهتر است
  // فقط websocket استفاده شود (به بخش «چک‌لیست تولید» پایین نگاه کن)
  transports: ["websocket", "polling"],
});
```

> ⚠️ اگر `guestToken` در query نباشد یا خالی باشد، سرور بلافاصله اتصال را
> قطع می‌کند (`socket.disconnect(true)`).

### رویدادهایی که گوش می‌دهی

| رویداد | چه‌وقت | payload |
|---|---|---|
| `connect` | اتصال برقرار شد | — |
| `disconnect` | اتصال قطع شد (Socket.io خودش تلاش برای وصل‌شدن دوباره می‌کند) | reason: string |
| `engine:reply` | موتور (لایه ۱ یا ۲) به پیام مشتری جواب داد | `{ conversationId, text, layer, needsOperator }` |
| `operator:reply` | یک اپراتور انسانی جواب داد | `{ conversationId, text }` |
| `error` | خطایی در پردازش پیام رخ داد (مثلاً محدودیت نرخ پیام) | `{ message }` |

### رویدادی که می‌فرستی

فقط یکی: `message:send`

```js
socket.emit("message:send", {
  text: "قیمت این محصول چنده؟",
  displayName: "نام مشتری",   // اختیاری
  tenantKey: undefined,       // فعلاً لازم نیست، تک‌تنانتی هستیم
});
```

### مثال کامل و آماده‌ی اجرا (Vanilla JS)

این کد را مستقیم در یک فایل `.html` بگذار و در مرورگر باز کن — بدون هیچ
build ای، از همین الان قابل تست است:

```html
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>تست ویجت چت</title>
  <script src="https://cdn.socket.io/4.8.1/socket.io.min.js"></script>
</head>
<body>
  <div id="messages" style="height:300px; overflow-y:auto; border:1px solid #ccc; padding:8px;"></div>
  <input id="input" placeholder="پیامت رو بنویس..." />
  <button id="send">ارسال</button>

  <script>
    const API_BASE_URL = "http://localhost:4100/api";
    const WS_BASE_URL = "http://localhost:4100";

    function getGuestToken() {
      const KEY = "chat_guest_token";
      let token = localStorage.getItem(KEY);
      if (!token) {
        token = crypto.randomUUID();
        localStorage.setItem(KEY, token);
      }
      return token;
    }

    const guestToken = getGuestToken();
    const messagesEl = document.getElementById("messages");

    function appendMessage(sender, text) {
      const div = document.createElement("div");
      div.textContent = `${sender}: ${text}`;
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    // ۱) تاریخچه‌ی قبلی را بگیر (اگر مشتری قبلاً چت کرده)
    fetch(`${API_BASE_URL}/chat/messages?guestToken=${guestToken}`)
      .then((r) => r.json())
      .then(({ data }) => {
        data.messages.forEach((m) => {
          const sender = m.senderType === "CUSTOMER" ? "شما" : m.senderType === "OPERATOR" ? "اپراتور" : "ربات";
          appendMessage(sender, m.content);
        });
      });

    // ۲) اتصال زنده
    const socket = io(`${WS_BASE_URL}/chat`, { query: { guestToken } });

    socket.on("connect", () => console.log("وصل شد ✅"));
    socket.on("disconnect", (reason) => console.log("قطع شد:", reason));

    socket.on("engine:reply", (payload) => {
      appendMessage("ربات", payload.text);
      if (payload.needsOperator) {
        appendMessage("سیستم", "درخواستت به یکی از همکارها ارجاع داده شد، چند لحظه صبر کن.");
      }
    });

    socket.on("operator:reply", (payload) => {
      appendMessage("اپراتور", payload.text);
    });

    socket.on("error", (err) => {
      appendMessage("خطا", err.message);
    });

    // ۳) فرستادن پیام
    document.getElementById("send").addEventListener("click", () => {
      const input = document.getElementById("input");
      const text = input.value.trim();
      if (!text) return;
      appendMessage("شما", text);
      socket.emit("message:send", { text });
      input.value = "";
    });
  </script>
</body>
</html>
```

### مثال React (custom hook)

```tsx
// useChatEngine.ts
import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_CHAT_API_URL!;
const WS_BASE_URL = process.env.NEXT_PUBLIC_CHAT_WS_URL!;

export interface ChatMessage {
  id?: string;
  senderType: "CUSTOMER" | "ENGINE" | "OPERATOR" | "SYSTEM";
  content: string;
  createdAt?: string;
}

function getGuestToken(): string {
  const KEY = "chat_guest_token";
  let token = localStorage.getItem(KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(KEY, token);
  }
  return token;
}

export function useChatEngine() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [waitingForOperator, setWaitingForOperator] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const guestTokenRef = useRef<string>("");

  useEffect(() => {
    const guestToken = getGuestToken();
    guestTokenRef.current = guestToken;

    // تاریخچه‌ی قبلی
    fetch(`${API_BASE_URL}/chat/messages?guestToken=${guestToken}`)
      .then((r) => r.json())
      .then(({ data }) => setMessages(data.messages ?? []))
      .catch(() => {});

    const socket = io(`${WS_BASE_URL}/chat`, { query: { guestToken } });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("engine:reply", (payload: { text: string; needsOperator: boolean }) => {
      setMessages((prev) => [...prev, { senderType: "ENGINE", content: payload.text }]);
      setWaitingForOperator(payload.needsOperator);
    });

    socket.on("operator:reply", (payload: { text: string }) => {
      setMessages((prev) => [...prev, { senderType: "OPERATOR", content: payload.text }]);
      setWaitingForOperator(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendMessage = useCallback((text: string, displayName?: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { senderType: "CUSTOMER", content: text }]);
    socketRef.current?.emit("message:send", { text, displayName });
  }, []);

  return { messages, connected, waitingForOperator, sendMessage };
}
```

استفاده در کامپوننت:

```tsx
function ChatWidget() {
  const { messages, connected, waitingForOperator, sendMessage } = useChatEngine();
  const [input, setInput] = useState("");

  return (
    <div>
      <div>{connected ? "🟢 آنلاین" : "🔴 در حال اتصال..."}</div>
      {messages.map((m, i) => (
        <div key={i}>
          <b>{m.senderType}:</b> {m.content}
        </div>
      ))}
      {waitingForOperator && <div>منتظر پاسخ اپراتور...</div>}
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button
        onClick={() => {
          sendMessage(input);
          setInput("");
        }}
      >
        ارسال
      </button>
    </div>
  );
}
```

---

## ۴. REST API (تاریخچه + fallback)

### `GET /api/chat/messages?guestToken=...`

برای گرفتن تاریخچه‌ی مکالمه هنگام باز شدن ویجت.

**پاسخ موفق:**
```json
{
  "success": true,
  "message": "موفقیت‌آمیز بود",
  "data": {
    "conversationId": "665f1a2b3c4d5e6f7a8b9c0d",
    "messages": [
      {
        "id": "665f...",
        "senderType": "CUSTOMER",
        "layer": null,
        "content": "قیمت این محصول چنده؟",
        "createdAt": "2026-08-04T10:00:00.000Z"
      },
      {
        "id": "665f...",
        "senderType": "ENGINE",
        "layer": "KEYWORD",
        "content": "قیمت «کراپ ورزشی»: ۱۵۰,۰۰۰ تومان",
        "createdAt": "2026-08-04T10:00:01.000Z"
      }
    ]
  }
}
```
اگر مشتری قبلاً چتی نداشته: `data: { conversationId: null, messages: [] }`.

### `POST /api/chat/messages`

fallback برای وقتی WebSocket در دسترس نیست (یا برای پیاده‌سازی ساده‌تر اگر
فعلاً نمی‌خواهی real-time بسازی).

**بدنه‌ی درخواست:**
```json
{
  "guestToken": "abc123...",
  "text": "قیمت این محصول چنده؟",
  "displayName": "علی رضایی"
}
```

**پاسخ موفق (۲۰۰):**
```json
{
  "success": true,
  "message": "موفقیت‌آمیز بود",
  "data": {
    "conversationId": "665f1a2b3c4d5e6f7a8b9c0d",
    "status": "AI_HANDLING",
    "reply": { "text": "...", "layer": "KEYWORD", "needsOperator": false }
  }
}
```
`status` یکی از: `OPEN`, `AI_HANDLING`, `NEEDS_OPERATOR`, `WITH_OPERATOR`, `CLOSED`.

**خطاها:**
- `409 Conflict` — یا پیام تکراری فرستاده شده، یا مشتری از سقف نرخ پیام
  (۲۰ پیام در دقیقه) رد شده. شکل خطا:
  ```json
  { "success": false, "message": "متن فارسی خطا" }
  ```
- `400 Bad Request` — ورودی نامعتبر (مثلاً `guestToken` کوتاه‌تر از ۸ کاراکتر)، همراه با `errors` که فیلد خطادار را مشخص می‌کند.

---

## ۵. جریان کامل پیشنهادی برای ویجت

1. صفحه لود می‌شود → `guestToken` از localStorage خوانده/ساخته می‌شود.
2. `GET /api/chat/messages` برای هیدریت‌کردن تاریخچه (اگر مشتری قبلی است).
3. اتصال Socket.io به `/chat` باز می‌شود.
4. مشتری تایپ می‌کند → `message:send` ارسال می‌شود → بلافاصله در UI به‌عنوان
   پیام خودش نشان داده می‌شود (بدون منتظرماندن پاسخ سرور — optimistic UI).
5. `engine:reply` می‌رسد → به لیست پیام‌ها اضافه می‌شود.
   - اگر `needsOperator: true` بود، یک نشانگر «منتظر اپراتور» نشان بده.
6. اگر بعداً `operator:reply` رسید (حتی دقیقه‌ها بعد، چون سوکت باز می‌ماند)،
   همان را هم اضافه کن و نشانگر «منتظر اپراتور» را بردار.

---

## ۶. چک‌لیست تولید (Production)

- [ ] `CORS_ORIGIN` را دقیقاً به دامنه‌ی فرانت (نه `*`) ست کن.
- [ ] بک‌اند پشت HTTPS باشد؛ آن‌وقت `wss://` خودکار استفاده می‌شود (فقط
      کافی است `WS_BASE_URL` را با `https://` بدهی، `socket.io-client`
      خودش تبدیل می‌کند).
- [ ] اگر پشت Nginx/لودبالانسر هستی، باید هدرهای upgrade وب‌سوکت را عبور
      بدهی:
      ```nginx
      location /socket.io/ {
        proxy_pass http://chat_engine_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
      }
      ```
- [ ] اگر چند نمونه (instance) از chat-engine پشت لودبالانسر داری: یا
      sticky session (ip_hash) روشن کن، یا `transports: ["websocket"]`
      (بدون polling) در کلاینت تنظیم کن. آداپتور Redis که در chat-engine
      هست همگام‌سازی بین نمونه‌ها را حل می‌کند، اما هندشیک اولیه‌ی هر
      سوکت باید به همان نمونه برسد.