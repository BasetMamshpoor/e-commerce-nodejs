import { Schema, model, Document, Types } from "mongoose";

export type SenderType = "CUSTOMER" | "ENGINE" | "OPERATOR" | "SYSTEM";
export type EngineLayer = "KEYWORD" | "AI";

export interface ConversationMessageDocument extends Document {
  _id: Types.ObjectId;
  tenantId: string;
  conversationId: Types.ObjectId;
  senderType: SenderType;
  layer?: EngineLayer | null; // فقط برای senderType=ENGINE
  operatorId?: Types.ObjectId | null;
  content: string;
  // اطلاعات کمکی برای دیباگ/آنالیز: intent تشخیص‌داده‌شده، شناسه‌ی محصولات
  // مرتبط، امتیاز اطمینان لایه AI و ...
  metadata?: Record<string, unknown> | null;
  // برای جلوگیری از پردازش دوباره‌ی وبهوک‌های تکراری پلتفرم‌های بیرونی
  externalMessageId?: string | null;
  createdAt: Date;
}

const conversationMessageSchema = new Schema<ConversationMessageDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    senderType: { type: String, enum: ["CUSTOMER", "ENGINE", "OPERATOR", "SYSTEM"], required: true },
    layer: { type: String, enum: ["KEYWORD", "AI", null], default: null },
    operatorId: { type: Schema.Types.ObjectId, ref: "Operator", default: null },
    content: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: null },
    externalMessageId: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

conversationMessageSchema.index({ conversationId: 1, createdAt: 1 });
conversationMessageSchema.index({ tenantId: 1, externalMessageId: 1 });

export const ConversationMessageModel = model<ConversationMessageDocument>(
  "ConversationMessage",
  conversationMessageSchema
);
