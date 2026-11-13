import { NextResponse } from "next/server";
import { canWrite } from "@/lib/auth";
import { getPartyBalances } from "@/lib/accounting";
import { AuditLog, Party } from "@/lib/models";
import { connectDB } from "@/lib/mongodb";
import { errorMessage, requireSession } from "@/lib/http";
import { validateParty } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const auth = await requireSession(); if (auth instanceof NextResponse) return auth;
    await connectDB();
    const q = new URL(request.url).searchParams.get("q") || "";
    const parties = await Party.find(q ? { $or: [{ name: new RegExp(q, "i") }, { phone: new RegExp(q, "i") }] } : {}).sort({ name: 1 }).limit(100).lean();
    const data = await Promise.all(parties.map(async (p) => ({ ...p, balances: await getPartyBalances(p._id.toString(), p.openingReceivable, p.openingPayable) })));
    return NextResponse.json({ parties: data });
  } catch (error) { return NextResponse.json({ error: errorMessage(error) }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const auth = await requireSession(); if (auth instanceof NextResponse) return auth;
    if (!canWrite(auth.role)) return NextResponse.json({ error: "আপনার entry permission নেই।" }, { status: 403 });
    const payload = validateParty(await request.json());
    await connectDB();
    const party = await Party.create(payload);
    await AuditLog.create({ userId: auth.id, action: "CREATE", entityType: "Party", entityId: party._id, after: party.toObject() });
    return NextResponse.json({ party }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: errorMessage(error) }, { status: 400 }); }
}
