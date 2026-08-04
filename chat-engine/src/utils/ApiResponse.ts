// ----------------------------------------------------------------------------
// کنترلرها به‌جای دستکاری مستقیم res، همین envelope را return می‌کنند؛
// ResponseInterceptor سراسری (common/interceptors/response.interceptor.ts)
// آن را به شکل نهایی { success, message, data } با statusCode درست تبدیل
// می‌کند.
// ----------------------------------------------------------------------------

export interface ApiResponseEnvelope<T> {
  __isApiResponse: true;
  statusCode: number;
  message: string;
  data: T;
}

export class ApiResponse {
  static ok<T>(data?: T, message = "موفقیت‌آمیز بود"): ApiResponseEnvelope<T | null> {
    return { __isApiResponse: true, statusCode: 200, message, data: data ?? null };
  }

  static created<T>(data?: T, message = "با موفقیت ایجاد شد"): ApiResponseEnvelope<T | null> {
    return { __isApiResponse: true, statusCode: 201, message, data: data ?? null };
  }
}
