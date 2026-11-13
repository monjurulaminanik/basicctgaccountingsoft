import { normalizeBalance, signedAmount, type Account, type Effect } from "@/lib/accounting";
import { Party, Transaction } from "@/lib/models";
import { connectDB } from "@/lib/mongodb";

export type LedgerRow = {
  _id: string;
  referenceNo: string;
  type: string;
  account: Account;
  effect: Effect;
  amount: number;
  date: Date;
  note?: string;
  paymentMethod?: string;
  running: {
    receivable: { due: number; advance: number; raw: number };
    payable: { due: number; advance: number; raw: number };
  };
};

export type LedgerStatement = {
  party: {
    _id: string;
    name: string;
    phone?: string;
    address?: string;
    type: string;
    openingReceivable: number;
    openingPayable: number;
  };
  opening: {
    receivable: { due: number; advance: number; raw: number };
    payable: { due: number; advance: number; raw: number };
  };
  closing: {
    receivable: { due: number; advance: number; raw: number };
    payable: { due: number; advance: number; raw: number };
  };
  rows: LedgerRow[];
  count: number;
};

/** Builds a party statement exactly the way the ledger screen and the PDF share it. */
export async function getLedgerStatement(
  partyId: string,
  period: { from?: string; to?: string } = {}
): Promise<LedgerStatement | null> {
  await connectDB();
  const party = await Party.findById(partyId).lean();
  if (!party) return null;

  const { from, to } = period;
  const query: Record<string, unknown> = { partyId, status: "POSTED" };
  if (from || to) {
    query.date = {
      ...(from ? { $gte: new Date(from) } : {}),
      ...(to ? { $lte: new Date(`${to}T23:59:59.999Z`) } : {}),
    };
  }

  const before = from
    ? await Transaction.find({ partyId, status: "POSTED", date: { $lt: new Date(from) } })
        .select("account effect amount")
        .lean()
    : [];

  let receivable = party.openingReceivable;
  let payable = party.openingPayable;
  for (const t of before) {
    const value = signedAmount(t.effect as Effect, t.amount);
    if (t.account === "RECEIVABLE") receivable += value;
    else payable += value;
  }
  const opening = {
    receivable: normalizeBalance(receivable),
    payable: normalizeBalance(payable),
  };

  const items = await Transaction.find(query).sort({ date: 1, createdAt: 1 }).lean();
  const rows = items.map((t) => {
    const value = signedAmount(t.effect as Effect, t.amount);
    if (t.account === "RECEIVABLE") receivable += value;
    else payable += value;
    return {
      _id: String(t._id),
      referenceNo: t.referenceNo,
      type: t.type as string,
      account: t.account as Account,
      effect: t.effect as Effect,
      amount: t.amount,
      date: t.date as Date,
      note: t.note || "",
      paymentMethod: t.paymentMethod || "",
      running: {
        receivable: normalizeBalance(receivable),
        payable: normalizeBalance(payable),
      },
    };
  });

  return {
    party: {
      _id: String(party._id),
      name: party.name,
      phone: party.phone || "",
      address: party.address || "",
      type: party.type,
      openingReceivable: party.openingReceivable,
      openingPayable: party.openingPayable,
    },
    opening,
    closing: {
      receivable: normalizeBalance(receivable),
      payable: normalizeBalance(payable),
    },
    rows,
    count: rows.length,
  };
}
