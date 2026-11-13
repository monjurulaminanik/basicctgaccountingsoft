import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const partySchema = new Schema(
  {
    code: { type: String, trim: true, unique: true, sparse: true },
    name: { type: String, required: true, trim: true, index: true },
    phone: { type: String, trim: true, index: true },
    address: { type: String, trim: true },
    type: { type: String, enum: ["CUSTOMER", "SUPPLIER", "BOTH"], default: "BOTH" },
    openingReceivable: { type: Number, default: 0, min: 0 },
    openingPayable: { type: Number, default: 0, min: 0 },
    openingDate: { type: Date, default: () => new Date() },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const allocationSchema = new Schema(
  {
    transactionId: { type: Schema.Types.ObjectId, ref: "Transaction", required: true },
    amount: { type: Number, required: true, min: 0.01 },
  },
  { _id: false }
);

const transactionSchema = new Schema(
  {
    referenceNo: { type: String, required: true, unique: true, index: true },
    partyId: { type: Schema.Types.ObjectId, ref: "Party", required: true, index: true },
    date: { type: Date, required: true, index: true },
    type: {
      type: String,
      enum: [
        "SALES_BILL", "PURCHASE_BILL", "RECEIPT", "PAYMENT", "SALES_RETURN",
        "PURCHASE_RETURN", "RECEIPT_REFUND", "PAYMENT_REFUND", "ADJUSTMENT",
      ],
      required: true,
      index: true,
    },
    account: { type: String, enum: ["RECEIVABLE", "PAYABLE"], required: true },
    effect: { type: String, enum: ["INCREASE", "DECREASE"], required: true },
    amount: { type: Number, required: true, min: 0.01 },
    note: { type: String, trim: true, maxlength: 1000 },
    paymentMethod: { type: String, enum: ["CASH", "BANK", "MFS", "CHEQUE", "OTHER"], default: "CASH" },
    allocations: { type: [allocationSchema], default: [] },
    originalTransactionId: { type: Schema.Types.ObjectId, ref: "Transaction" },
    status: { type: String, enum: ["POSTED", "VOIDED", "REVERSED"], default: "POSTED", index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    voidReason: { type: String, trim: true },
  },
  { timestamps: true }
);
transactionSchema.index({ partyId: 1, date: 1, createdAt: 1 });
transactionSchema.index({ type: 1, date: 1 });

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["ADMIN", "OPERATOR", "VIEWER"], default: "OPERATOR" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const auditLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    ip: String,
  },
  { timestamps: true }
);

const settingsSchema = new Schema(
  {
    companyName: { type: String, default: "My Company" },
    address: String,
    phone: String,
    currency: { type: String, default: "BDT" },
    currencySymbol: { type: String, default: "৳" },
    printSettings: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const counterSchema = new Schema({ name: { type: String, unique: true }, sequence: { type: Number, default: 0 } });

const shareLinkSchema = new Schema(
  {
    token: { type: String, required: true, unique: true, index: true },
    kind: { type: String, enum: ["LEDGER"], default: "LEDGER" },
    partyId: { type: Schema.Types.ObjectId, ref: "Party", required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    expiresAt: { type: Date },
    revokedAt: { type: Date },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type PartyDoc = InferSchemaType<typeof partySchema>;
export type TransactionDoc = InferSchemaType<typeof transactionSchema>;
export const Party = (models.Party as Model<PartyDoc>) || model<PartyDoc>("Party", partySchema);
export const Transaction = (models.Transaction as Model<TransactionDoc>) || model<TransactionDoc>("Transaction", transactionSchema);
export const User = models.User || model("User", userSchema);
export const AuditLog = models.AuditLog || model("AuditLog", auditLogSchema);
export const Settings = models.Settings || model("Settings", settingsSchema);
export const Counter = models.Counter || model("Counter", counterSchema);
export const ShareLink = models.ShareLink || model("ShareLink", shareLinkSchema);
