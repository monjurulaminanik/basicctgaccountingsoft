import { Counter, Transaction } from "@/lib/models";

export type Account = "RECEIVABLE" | "PAYABLE";
export type Effect = "INCREASE" | "DECREASE";

export const TRANSACTION_META: Record<string, { account: Account; effect: Effect; label: string }> = {
  SALES_BILL: { account: "RECEIVABLE", effect: "INCREASE", label: "বিক্রয় বিল" },
  RECEIPT: { account: "RECEIVABLE", effect: "DECREASE", label: "গ্রহণ / আদায়" },
  SALES_RETURN: { account: "RECEIVABLE", effect: "DECREASE", label: "বিক্রয় ফেরত" },
  RECEIPT_REFUND: { account: "RECEIVABLE", effect: "INCREASE", label: "গ্রহণ ফেরত" },
  PURCHASE_BILL: { account: "PAYABLE", effect: "INCREASE", label: "ক্রয় বিল" },
  PAYMENT: { account: "PAYABLE", effect: "DECREASE", label: "পরিশোধ" },
  PURCHASE_RETURN: { account: "PAYABLE", effect: "DECREASE", label: "ক্রয় ফেরত" },
  PAYMENT_REFUND: { account: "PAYABLE", effect: "INCREASE", label: "পেমেন্ট ফেরত" },
};

export function resolveTransaction(type: string, account?: Account, effect?: Effect) {
  if (type === "ADJUSTMENT") {
    if (!account || !effect) throw new Error("Adjustment needs account and effect.");
    return { account, effect, label: "সমন্বয়" };
  }
  const meta = TRANSACTION_META[type];
  if (!meta) throw new Error("Unsupported transaction type.");
  return meta;
}

export function normalizeBalance(raw: number) {
  return { due: Math.max(raw, 0), advance: Math.max(-raw, 0), raw };
}

export function signedAmount(effect: Effect, amount: number) {
  return effect === "INCREASE" ? amount : -amount;
}

export async function nextReference(type: string) {
  const counter = await Counter.findOneAndUpdate({ name: "transaction" }, { $inc: { sequence: 1 } }, { new: true, upsert: true });
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `${type.slice(0, 3)}-${date}-${String(counter.sequence).padStart(5, "0")}`;
}

export async function getPartyBalances(partyId: string, openingReceivable = 0, openingPayable = 0) {
  const items = await Transaction.find({ partyId, status: "POSTED" }).select("account effect amount").lean();
  let receivable = openingReceivable;
  let payable = openingPayable;
  for (const item of items) {
    const value = signedAmount(item.effect as Effect, item.amount);
    if (item.account === "RECEIVABLE") receivable += value;
    else payable += value;
  }
  return { receivable: normalizeBalance(receivable), payable: normalizeBalance(payable) };
}
