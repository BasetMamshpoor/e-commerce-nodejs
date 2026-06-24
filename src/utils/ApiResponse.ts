import { Response } from "express";

// ----------------------------------------------------------------------------
// ساختار یکدست برای پاسخ‌های موفق:
// { success: true, message, data }
// ----------------------------------------------------------------------------

export class ApiResponse {
  static send<T>(
    res: Response,
    statusCode: number,
    message: string,
    data?: T
  ) {
    return res.status(statusCode).json({
      success: true,
      message,
      data: data ?? null,
    });
  }

  static ok<T>(res: Response, data?: T, message = "موفقیت‌آمیز بود") {
    return this.send(res, 200, message, data);
  }

  static created<T>(res: Response, data?: T, message = "با موفقیت ایجاد شد") {
    return this.send(res, 201, message, data);
  }

  static noContent(res: Response) {
    return res.status(204).send();
  }
}
