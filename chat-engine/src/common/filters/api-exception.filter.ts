import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import { ZodError } from "zod";
import mongoose from "mongoose";
import { isProd } from "../../config/env";

interface FastifyLikeReply {
  status(code: number): FastifyLikeReply;
  send(body: unknown): unknown;
}

interface FastifyLikeRequest {
  url?: string;
}

// ----------------------------------------------------------------------------
// آخرین لایه‌ی رسیدگی به خطا — همان نقشی که src/middlewares/errorHandler.ts
// پروژه‌ی اصلی دارد، اینجا به شکل ExceptionFilter نست پیاده شده است.
// ----------------------------------------------------------------------------

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<FastifyLikeReply>();
    const req = ctx.getRequest<FastifyLikeRequest>();

    let statusCode = 500;
    let message = "خطای داخلی سرور";
    let details: unknown;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === "string") {
        message = body;
      } else if (typeof body === "object" && body !== null) {
        const b = body as { message?: unknown; details?: unknown; errors?: unknown };
        message = typeof b.message === "string" ? b.message : message;
        details = b.details ?? b.errors;
      }
    } else if (exception instanceof ZodError) {
      statusCode = 400;
      message = "داده‌های ورودی نامعتبر است";
      details = exception.flatten().fieldErrors;
    } else if (exception instanceof mongoose.Error.CastError) {
      statusCode = 400;
      message = "شناسه‌ی نامعتبر است";
    } else if (exception instanceof mongoose.Error.ValidationError) {
      statusCode = 400;
      message = "داده‌های ورودی نامعتبر است";
      details = exception.errors;
    } else if (isMongoDuplicateKeyError(exception)) {
      statusCode = 409;
      message = "این مقدار قبلاً ثبت شده است (تکراری)";
    } else if (exception instanceof Error) {
      message = isProd ? message : exception.message;
    }

    if (!isProd && statusCode === 500) {
      // eslint-disable-next-line no-console
      console.error(exception);
    }

    res.status(statusCode).send({
      success: false,
      message,
      ...(details ? { errors: details } : {}),
      ...(isProd ? {} : { path: req.url }),
    });
  }
}

function isMongoDuplicateKeyError(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
}
