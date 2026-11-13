import { NextResponse } from "next/server";
import { getPartyBalanceRows } from "@/lib/reports";
import { errorMessage, requireSession } from "@/lib/http";

export async function GET() {
  try {
    const auth = await requireSession(); if (auth instanceof NextResponse) return auth;
    const rows = await getPartyBalanceRows();
    return NextResponse.json({ rows });
  } catch (error) { return NextResponse.json({ error: errorMessage(error) }, { status: 500 }); }
}
