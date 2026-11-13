export type PartyInput = { name: string; phone?: string; address?: string; type: "CUSTOMER" | "SUPPLIER" | "BOTH"; openingReceivable?: number; openingPayable?: number; openingDate?: Date };
export type TransactionType = "SALES_BILL" | "PURCHASE_BILL" | "RECEIPT" | "PAYMENT" | "SALES_RETURN" | "PURCHASE_RETURN" | "RECEIPT_REFUND" | "PAYMENT_REFUND" | "ADJUSTMENT";
export type TransactionInput = { partyId: string; date: Date; type: TransactionType; amount: number; note?: string; paymentMethod: "CASH" | "BANK" | "MFS" | "CHEQUE" | "OTHER"; account?: "RECEIVABLE" | "PAYABLE"; effect?: "INCREASE" | "DECREASE"; allocations: { transactionId: string; amount: number }[] };

const partyTypes = new Set(["CUSTOMER", "SUPPLIER", "BOTH"]);
const transactionTypes = new Set(["SALES_BILL", "PURCHASE_BILL", "RECEIPT", "PAYMENT", "SALES_RETURN", "PURCHASE_RETURN", "RECEIPT_REFUND", "PAYMENT_REFUND", "ADJUSTMENT"]);
const paymentMethods = new Set(["CASH", "BANK", "MFS", "CHEQUE", "OTHER"]);
const accounts = new Set(["RECEIVABLE", "PAYABLE"]);
const effects = new Set(["INCREASE", "DECREASE"]);

const text = (value: unknown, max = 500) => typeof value === "string" ? value.trim().slice(0, max) : "";
const number = (value: unknown, fallback = 0) => { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; };
function validDate(value: unknown) { const date = new Date(String(value)); if (Number.isNaN(date.getTime())) throw new Error("Valid date দিন।"); return date; }

export function validateParty(body: unknown, includeOpening = true): PartyInput {
  const data = body as Record<string, unknown>; const name = text(data.name, 150); const type = text(data.type, 20);
  if (name.length < 2) throw new Error("Party name must be at least 2 characters.");
  if (!partyTypes.has(type)) throw new Error("Valid party type নির্বাচন করুন।");
  const payload: PartyInput = { name, type: type as PartyInput["type"], phone: text(data.phone, 30), address: text(data.address, 500) };
  if (includeOpening) { const receivable = number(data.openingReceivable); const payable = number(data.openingPayable); if (receivable < 0 || payable < 0) throw new Error("Opening balance negative হতে পারবে না।"); payload.openingReceivable = receivable; payload.openingPayable = payable; if (data.openingDate) payload.openingDate = validDate(data.openingDate); }
  return payload;
}

export function validateTransaction(body: unknown): TransactionInput {
  const data = body as Record<string, unknown>; const partyId = text(data.partyId, 80); const type = text(data.type, 50); const amount = number(data.amount); const paymentMethod = text(data.paymentMethod || "CASH", 20);
  if (!partyId) throw new Error("Party নির্বাচন করুন।"); if (!transactionTypes.has(type)) throw new Error("Valid transaction type নির্বাচন করুন।"); if (amount <= 0) throw new Error("Amount অবশ্যই শূন্যের চেয়ে বেশি হতে হবে।"); if (!paymentMethods.has(paymentMethod)) throw new Error("Valid payment method নির্বাচন করুন।");
  const account = text(data.account, 20); const effect = text(data.effect, 20); if (account && !accounts.has(account)) throw new Error("Valid account নির্বাচন করুন।"); if (effect && !effects.has(effect)) throw new Error("Valid effect নির্বাচন করুন।");
  const allocations = Array.isArray(data.allocations) ? data.allocations.map(row => { const r = row as Record<string, unknown>; const value = number(r.amount); if (!text(r.transactionId, 80) || value <= 0) throw new Error("Invalid allocation."); return { transactionId: text(r.transactionId, 80), amount: value }; }) : [];
  return { partyId, date: validDate(data.date), type: type as TransactionType, amount, note: text(data.note, 1000), paymentMethod: paymentMethod as TransactionInput["paymentMethod"], account: account as TransactionInput["account"] || undefined, effect: effect as TransactionInput["effect"] || undefined, allocations };
}

export function validateSettings(body: unknown) { const data = body as Record<string, unknown>; const companyName = text(data.companyName, 150); if (companyName.length < 2) throw new Error("Company name দিন।"); return { companyName, address: text(data.address, 500), phone: text(data.phone, 40), currency: text(data.currency, 10) || "BDT", currencySymbol: text(data.currencySymbol, 5) || "৳" }; }
