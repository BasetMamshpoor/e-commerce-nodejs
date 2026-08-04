import { Schema, model, Document } from "mongoose";

// ----------------------------------------------------------------------------
// آخرین update_id پردازش‌شده‌ی هر تنانت را نگه می‌دارد. اگر این عدد را
// جایی ذخیره نکنیم، هر بار که سرور ری‌استارت شود، getUpdates دوباره کل
// پیام‌های تاییدنشده (تا ۲۴ ساعت گذشته‌ی تلگرام) را برمی‌گرداند — که با
// این‌که dedup سطح پیام (externalMessageId) جلوی پاسخ تکراری را می‌گیرد،
// باز هم کوئری/پردازش اضافه است.
// ----------------------------------------------------------------------------

export interface TelegramPollingStateDocument extends Document {
  tenantKey: string;
  offset: number;
}

const schema = new Schema<TelegramPollingStateDocument>({
  tenantKey: { type: String, required: true, unique: true },
  offset: { type: Number, default: 0 },
});

export const TelegramPollingStateModel = model<TelegramPollingStateDocument>("TelegramPollingState", schema);
