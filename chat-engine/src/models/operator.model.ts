import { Schema, model, Document, Types } from "mongoose";

export interface OperatorDocument extends Document {
  _id: Types.ObjectId;
  tenantId: string;
  storeUserId: number; // همان User.id در دیتابیس بک‌اند همان تنانت
  displayName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const operatorSchema = new Schema<OperatorDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    storeUserId: { type: Number, required: true },
    displayName: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

operatorSchema.index({ tenantId: 1, storeUserId: 1 }, { unique: true });

export const OperatorModel = model<OperatorDocument>("Operator", operatorSchema);
