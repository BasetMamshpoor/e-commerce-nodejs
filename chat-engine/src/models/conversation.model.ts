import { Schema, model, Document, Types } from "mongoose";
import { Channel } from "./customer.model";

export type ConversationStatus = "OPEN" | "AI_HANDLING" | "NEEDS_OPERATOR" | "WITH_OPERATOR" | "CLOSED";

export interface ConversationDocument extends Document {
  _id: Types.ObjectId;
  tenantId: string;
  channel: Channel;
  customerId: Types.ObjectId;
  status: ConversationStatus;
  assignedOperatorId?: Types.ObjectId | null;
  // شناسه‌ی نخِ مکالمه در پلتفرم مبدا (برای فوروارد پست/دایرکت اینستاگرام و ...)
  externalThreadId?: string | null;
  lastMessageAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<ConversationDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    channel: {
      type: String,
      enum: ["WEBSITE", "INSTAGRAM", "WHATSAPP", "TELEGRAM", "BALE"],
      required: true,
    },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    status: {
      type: String,
      enum: ["OPEN", "AI_HANDLING", "NEEDS_OPERATOR", "WITH_OPERATOR", "CLOSED"],
      default: "OPEN",
    },
    assignedOperatorId: { type: Schema.Types.ObjectId, ref: "Operator", default: null },
    externalThreadId: { type: String, default: null },
    lastMessageAt: { type: Date, default: null },
  },
  { timestamps: true }
);

conversationSchema.index({ tenantId: 1, status: 1, lastMessageAt: -1 });

export const ConversationModel = model<ConversationDocument>("Conversation", conversationSchema);
