import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, map } from "rxjs";
import { ApiResponseEnvelope } from "../../utils/ApiResponse";

function isApiResponseEnvelope(value: unknown): value is ApiResponseEnvelope<unknown> {
  return typeof value === "object" && value !== null && (value as { __isApiResponse?: boolean }).__isApiResponse === true;
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((result) => {
        const httpCtx = context.switchToHttp();
        const res = httpCtx.getResponse<{ status?: (code: number) => unknown }>();

        if (isApiResponseEnvelope(result)) {
          res.status?.(result.statusCode);
          return { success: true, message: result.message, data: result.data };
        }

        return { success: true, message: "موفقیت‌آمیز بود", data: result ?? null };
      })
    );
  }
}
