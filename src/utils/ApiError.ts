// ----------------------------------------------------------------------------
// کلاس خطای استاندارد اپلیکیشن.
// در تمام سرویس‌ها/کنترلرها به‌جای throw new Error از این استفاده می‌کنیم تا
// errorHandler مرکزی بتواند statusCode و پیام مناسب را به کلاینت برگرداند.
// ----------------------------------------------------------------------------

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean; // خطای قابل‌انتظار (نه باگ برنامه)
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(message = "درخواست نامعتبر است", details?: unknown) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = "احراز هویت نشده‌اید") {
    return new ApiError(401, message);
  }

  static forbidden(message = "اجازه دسترسی ندارید") {
    return new ApiError(403, message);
  }

  static notFound(message = "موردی یافت نشد") {
    return new ApiError(404, message);
  }

  static conflict(message = "تعارض داده‌ای رخ داده است") {
    return new ApiError(409, message);
  }

  static tooMany(message = "تعداد درخواست‌ها بیش از حد مجاز است") {
    return new ApiError(429, message);
  }

  static internal(message = "خطای داخلی سرور") {
    return new ApiError(500, message);
  }
}
