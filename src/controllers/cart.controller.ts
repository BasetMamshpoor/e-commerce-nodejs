import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { paramStr } from "../utils/params";
import { resolveCartIdentity } from "../utils/cartIdentity";
import * as cartService from "../services/shopping/cart.service";

// ----------------------------------------------------------------------------
// اگر کاربر مهمان باشد و هنوز X-Guest-Token نفرستاده باشد، یک توکن جدید
// ساخته و در data.guestToken برمی‌گردانیم. فرانت باید آن را ذخیره کند و در
// درخواست‌های بعدی به‌صورت هدر X-Guest-Token بفرستد.
// ----------------------------------------------------------------------------

function withGuestToken<T extends Record<string, unknown>>(
  data: T,
  guestToken: string | undefined
) {
  return guestToken ? { ...data, guestToken } : data;
}

export async function getCart(req: Request, res: Response) {
  const { identity, guestToken } = resolveCartIdentity(req);
  const cart = await cartService.getCart(identity);
  return ApiResponse.ok(res, withGuestToken({ cart }, guestToken));
}

export async function addItem(req: Request, res: Response) {
  const { identity, guestToken } = resolveCartIdentity(req);
  const result = await cartService.addItem(identity, req.body.variantId, req.body.quantity);
  return ApiResponse.created(
    res,
    withGuestToken(result, guestToken),
    result.wasAdjusted
      ? "تعداد به دلیل محدودیت موجودی اصلاح شد"
      : "کالا به سبد خرید اضافه شد"
  );
}

export async function updateItem(req: Request, res: Response) {
  const { identity, guestToken } = resolveCartIdentity(req);
  const result = await cartService.updateItemQuantity(
    identity,
    paramStr(req.params.itemId),
    req.body.quantity
  );
  return ApiResponse.ok(
    res,
    withGuestToken(result, guestToken),
    result.wasAdjusted ? "تعداد به دلیل محدودیت موجودی اصلاح شد" : "سبد خرید به‌روزرسانی شد"
  );
}

export async function removeItem(req: Request, res: Response) {
  const { identity, guestToken } = resolveCartIdentity(req);
  const cart = await cartService.removeItem(identity, paramStr(req.params.itemId));
  return ApiResponse.ok(res, withGuestToken({ cart }, guestToken), "آیتم از سبد خرید حذف شد");
}

export async function clearCart(req: Request, res: Response) {
  const { identity, guestToken } = resolveCartIdentity(req);
  const cart = await cartService.clearCart(identity);
  return ApiResponse.ok(res, withGuestToken({ cart }, guestToken), "سبد خرید خالی شد");
}

export async function mergeCart(req: Request, res: Response) {
  // این مسیر فقط برای کاربر لاگین‌کرده است (authenticate قبل از این اجرا شده)
  const cart = await cartService.mergeGuestCartIntoUser(req.user!.id, req.body.guestToken);
  return ApiResponse.ok(res, { cart }, "سبد خرید مهمان با سبد شما ادغام شد");
}
