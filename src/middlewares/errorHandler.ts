import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError";
import { isProd } from "../config/env";
import { Prisma } from "../generated/prisma";

// ----------------------------------------------------------------------------
// میدلور خطا — باید آخرین چیزی باشد که در app.ts با app.use ثبت می‌شود.
// در Express 5 اگر هندلر/میدلور Promise برگرداند و reject شود، خودِ اکسپرس
// خطا را به همین میدلور forward می‌کند؛ پس لازم نیست هیچ‌جا try/catch دستی
// یا asyncHandler بنویسیم.
// ----------------------------------------------------------------------------

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  let statusCode = 500;
  let message = "خطای داخلی سرور";
  let details: unknown;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = "داده‌های ورودی نامعتبر است";
    details = err.flatten().fieldErrors;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = mapPrismaError(err);
    statusCode = mapped.statusCode;
    message = mapped.message;
  } else if (err instanceof Error) {
    message = isProd ? message : err.message;
  }

  if (!isProd && statusCode === 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { errors: details } : {}),
    ...(isProd ? {} : { path: req.originalUrl }),
  });
}

function mapPrismaError(err: Prisma.PrismaClientKnownRequestError): {
  statusCode: number;
  message: string;
} {
  switch (err.code) {
    case "P2002": // unique constraint
      return { statusCode: 409, message: "این مقدار قبلاً ثبت شده است (تکراری)" };
    case "P2025": // record not found
      return { statusCode: 404, message: "موردی یافت نشد" };
    case "P2003": // foreign key constraint
      return { statusCode: 400, message: "ارجاع داده‌ای نامعتبر است" };
    default:
      return { statusCode: 500, message: "خطا در ارتباط با دیتابیس" };
  }
}
