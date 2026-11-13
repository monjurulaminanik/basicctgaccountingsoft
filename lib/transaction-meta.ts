export type TxType =
  | "SALES_BILL"
  | "PURCHASE_BILL"
  | "RECEIPT"
  | "PAYMENT"
  | "SALES_RETURN"
  | "PURCHASE_RETURN"
  | "RECEIPT_REFUND"
  | "PAYMENT_REFUND"
  | "ADJUSTMENT";

export type TxAccount = "RECEIVABLE" | "PAYABLE";
export type TxEffect = "INCREASE" | "DECREASE";

export type TxMeta = {
  label: string;
  account: TxAccount;
  effect: TxEffect;
  /** Short Bengali text explaining what the entry does to the party balance. */
  hint: string;
};

/**
 * Client-safe mirror of `TRANSACTION_META` in lib/accounting.ts. The accounting
 * module pulls in mongoose, so UI code imports this file instead.
 */
export const TX_META: Record<Exclude<TxType, "ADJUSTMENT">, TxMeta> = {
  SALES_BILL: { label: "বিক্রয় বিল", account: "RECEIVABLE", effect: "INCREASE", hint: "পার্টির কাছে পাওনা বাড়বে" },
  RECEIPT: { label: "গ্রহণ / আদায়", account: "RECEIVABLE", effect: "DECREASE", hint: "পার্টির পাওনা কমবে" },
  SALES_RETURN: { label: "বিক্রয় ফেরত", account: "RECEIVABLE", effect: "DECREASE", hint: "ফেরতের কারণে পাওনা কমবে" },
  RECEIPT_REFUND: { label: "গ্রহণ ফেরত", account: "RECEIVABLE", effect: "INCREASE", hint: "টাকা ফেরত দিলে পাওনা বাড়বে" },
  PURCHASE_BILL: { label: "ক্রয় বিল", account: "PAYABLE", effect: "INCREASE", hint: "পার্টিকে দেনা বাড়বে" },
  PAYMENT: { label: "পরিশোধ", account: "PAYABLE", effect: "DECREASE", hint: "পার্টির দেনা কমবে" },
  PURCHASE_RETURN: { label: "ক্রয় ফেরত", account: "PAYABLE", effect: "DECREASE", hint: "ফেরতের কারণে দেনা কমবে" },
  PAYMENT_REFUND: { label: "পেমেন্ট ফেরত", account: "PAYABLE", effect: "INCREASE", hint: "টাকা ফেরত পেলে দেনা বাড়বে" },
};

export const ADJUSTMENT_META: TxMeta = {
  label: "ম্যানুয়াল সমন্বয়",
  account: "RECEIVABLE",
  effect: "INCREASE",
  hint: "হিসাবের সংশোধনী এন্ট্রি",
};

export const TX_LABELS: Record<string, string> = {
  ...Object.fromEntries(Object.entries(TX_META).map(([k, v]) => [k, v.label])),
  ADJUSTMENT: ADJUSTMENT_META.label,
};

export function txMeta(type: string): TxMeta {
  return (TX_META as Record<string, TxMeta>)[type] || ADJUSTMENT_META;
}

export const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "BANK", label: "Bank" },
  { value: "MFS", label: "MFS (bKash/Nagad)" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "OTHER", label: "Other" },
];
