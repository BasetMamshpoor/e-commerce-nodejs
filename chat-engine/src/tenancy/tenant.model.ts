import { Schema, model, Document } from "mongoose";

// ----------------------------------------------------------------------------
// هر سند این کالکشن یک «کسب‌وکار/بک‌اند» است. فعلاً فقط یک تنانت پیش‌فرض
// داریم (همین فروشگاه)، اما کل داستان چند-مستاجری‌شدن در آینده همین است:
// یک سند دیگر این‌جا اضافه شود، نه هیچ تغییری در کد موتور.
// ----------------------------------------------------------------------------

export interface TenantDocument extends Document {
  key: string; // شناسه‌ی کوتاه و یکتا (مثلاً در URL/هدر درخواست استفاده می‌شود)
  name: string;
  storeDatabaseUrl: string; // کانکشن‌استرینگ Postgres همان بک‌اند (فقط خواندنی)
  isActive: boolean;
  aiProviderOverride?: "anthropic" | "openai" | null;
  createdAt: Date;
  updatedAt: Date;
}

const tenantSchema = new Schema<TenantDocument>(
  {
    key: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true },
    storeDatabaseUrl: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    aiProviderOverride: { type: String, enum: ["anthropic", "openai", null], default: null },
  },
  { timestamps: true }
);

export const TenantModel = model<TenantDocument>("Tenant", tenantSchema);
