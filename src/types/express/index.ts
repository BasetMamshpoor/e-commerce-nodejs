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
    }
  }
}

export {};
