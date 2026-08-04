import { Schema, model, Document, Types } from "mongoose";

export type Channel = "WEBSITE" | "INSTAGRAM" | "WHATSAPP" | "TELEGRAM" | "BALE";

export interface CustomerDocument extends Document {
  _id: Types.ObjectId;
  tenantId: string;
  channel: Channel;
  externalId: string; // guestToken/userId سایت، IGSID، wa_id، chat id تلگرام/بله و ...
  storeUserId?: number | null; // اگر مشتری لاگین‌کرده در سایت شناخته شود
  displayName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<CustomerDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    channel: {
      type: String,
      enum: ["WEBSITE", "INSTAGRAM", "WHATSAPP", "TELEGRAM", "BALE"],
      required: true,
    },
    externalId: { type: String, required: true },
    storeUserId: { type: Number, default: null },
    displayName: { type: String },
  },
  { timestamps: true }
);

customerSchema.index({ tenantId: 1, channel: 1, externalId: 1 }, { unique: true });

export const CustomerModel = model<CustomerDocument>("Customer", customerSchema);
