import { HttpException, HttpStatus } from "@nestjs/common";

// ----------------------------------------------------------------------------
// خطای استاندارد اپلیکیشن — روی HttpException نست ساخته شده تا هم با
// pipe/guard/filter های نست همسو باشد و هم همان API آشنای پروژه‌ی اصلی
// (badRequest/notFound/...) را داشته باشیم.
// ----------------------------------------------------------------------------

export class ApiError extends HttpException {
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super({ message, details }, statusCode);
    this.details = details;
  }

  static badRequest(message = "درخواست نامعتبر است", details?: unknown) {
    return new ApiError(HttpStatus.BAD_REQUEST, message, details);
  }

  static unauthorized(message = "احراز هویت نشده‌اید") {
    return new ApiError(HttpStatus.UNAUTHORIZED, message);
  }

  static forbidden(message = "اجازه دسترسی ندارید") {
    return new ApiError(HttpStatus.FORBIDDEN, message);
  }

  static notFound(message = "موردی یافت نشد") {
    return new ApiError(HttpStatus.NOT_FOUND, message);
  }

  static conflict(message = "تعارض داده‌ای رخ داده است") {
    return new ApiError(HttpStatus.CONFLICT, message);
  }

  static internal(message = "خطای داخلی سرور") {
    return new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, message);
  }
}
