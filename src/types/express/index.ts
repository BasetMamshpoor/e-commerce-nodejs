import { Role } from "../../generated/prisma";

// این فایل تایپ Request اکسپرس را گسترش می‌دهد تا بعد از میدلور احراز هویت
// بتوانیم req.user و req.sessionId را با تایپ درست در همه‌جا استفاده کنیم.

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
      };
      sessionId?: string;
      // ⚠️ در Express 5، req.query فقط getter دارد (هر بار از روی URL دوباره
      // ساخته می‌شود) و قابل بازنویسی نیست. برای همین، خروجی اعتبارسنجی‌شده‌ی
      // zod روی query را اینجا نگه می‌داریم، نه روی خودِ req.query.
      // (نگاه کنید به src/middlewares/validate.ts)
      validatedQuery?: Record<string, unknown>;
    }
  }
}

export {};
