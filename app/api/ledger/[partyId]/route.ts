import { NextResponse } from "next/server";
import { getLedgerStatement } from "@/lib/ledger";
import { errorMessage, requireSession } from "@/lib/http";

export async function GET(request: Request, { params }: { params: Promise<{ partyId: string }> }) {
  try {
    const auth = await requireSession(); if (auth instanceof NextResponse) return auth;
    const { partyId } = await params;
    const sp = new URL(request.url).searchParams;
    const statement = await getLedgerStatement(partyId, {
      from: sp.get("from") || undefined,
      to: sp.get("to") || undefined,
    });
    if (!statement) return NextResponse.json({ error: "Party not found" }, { status: 404 });
    return NextResponse.json(statement);
  } catch (error) { return NextResponse.json({ error: errorMessage(error) }, { status: 500 }); }
}
