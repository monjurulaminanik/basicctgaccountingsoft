import { NextResponse } from "next/server";
import { getPartyBalances } from "@/lib/accounting";
import { Party, Transaction } from "@/lib/models";
import { connectDB } from "@/lib/mongodb";
import { errorMessage, requireSession } from "@/lib/http";

/**
 * Lightweight snapshot of one party used by the entry screen: current due /
 * advance plus the most recent posted transactions, so the operator sees where
 * the party stands before saving a new entry.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSession(); if (auth instanceof NextResponse) return auth;
    const { id } = await params;
    const limit = Math.min(Number(new URL(request.url).searchParams.get("limit") || 5), 20);
    await connectDB();

    const party = await Party.findById(id).select("name phone type openingReceivable openingPayable active").lean();
    if (!party) return NextResponse.json({ error: "Party not found" }, { status: 404 });

    const [balances, recent, count] = await Promise.all([
      getPartyBalances(id, party.openingReceivable, party.openingPayable),
      Transaction.find({ partyId: id, status: "POSTED" })
        .select("referenceNo type account effect amount date note paymentMethod")
        .sort({ date: -1, createdAt: -1 })
        .limit(limit)
        .lean(),
      Transaction.countDocuments({ partyId: id, status: "POSTED" }),
    ]);

    return NextResponse.json({
      party: {
        _id: party._id,
        name: party.name,
        phone: party.phone || "",
        type: party.type,
      },
      balances,
      recent,
      count,
    });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
