import { NextResponse } from "next/server";
import { signedAmount } from "@/lib/accounting";
import { Party, Transaction } from "@/lib/models";
import { connectDB } from "@/lib/mongodb";
import { errorMessage, requireSession } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const auth = await requireSession(); if (auth instanceof NextResponse) return auth;
    await connectDB(); const sp = new URL(request.url).searchParams;
    const from = sp.get("from") ? new Date(sp.get("from")!) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const to = sp.get("to") ? new Date(`${sp.get("to")}T23:59:59.999Z`) : new Date();
    const [parties, transactions, recent] = await Promise.all([
      Party.find({ active: true }).select("openingReceivable openingPayable").lean(),
      Transaction.find({ status: "POSTED", date: { $lte: to } }).select("account effect amount type date").lean(),
      Transaction.find({ status: "POSTED" }).populate("partyId", "name").sort({ date: -1, createdAt: -1 }).limit(8).lean(),
    ]);
    let receivable = parties.reduce((s, p) => s + p.openingReceivable, 0); let payable = parties.reduce((s, p) => s + p.openingPayable, 0); let collected = 0; let paid = 0;
    for (const t of transactions) {
      const signed = signedAmount(t.effect as "INCREASE" | "DECREASE", t.amount);
      if (t.account === "RECEIVABLE") receivable += signed; else payable += signed;
      if (t.date >= from && t.date <= to && t.type === "RECEIPT") collected += t.amount;
      if (t.date >= from && t.date <= to && t.type === "PAYMENT") paid += t.amount;
    }
    return NextResponse.json({ totals: { receivable: Math.max(receivable, 0), payable: Math.max(payable, 0), collected, paid }, recent });
  } catch (error) { return NextResponse.json({ error: errorMessage(error) }, { status: 500 }); }
}
