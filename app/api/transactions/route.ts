import { NextResponse } from "next/server";
import { canWrite } from "@/lib/auth";
import { nextReference, resolveTransaction } from "@/lib/accounting";
import { AuditLog, Party, Transaction } from "@/lib/models";
import { connectDB } from "@/lib/mongodb";
import { errorMessage, requireSession } from "@/lib/http";
import { validateTransaction } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const auth = await requireSession(); if (auth instanceof NextResponse) return auth; await connectDB();
    const sp = new URL(request.url).searchParams; const query: Record<string, unknown> = {};
    if (sp.get("partyId")) query.partyId = sp.get("partyId"); if (sp.get("from") || sp.get("to")) query.date = { ...(sp.get("from") ? { $gte: new Date(sp.get("from")!) } : {}), ...(sp.get("to") ? { $lte: new Date(`${sp.get("to")}T23:59:59.999Z`) } : {}) };
    if (sp.get("status")) query.status = sp.get("status");
    const transactions = await Transaction.find(query).populate("partyId", "name phone").sort({ date: -1, createdAt: -1 }).limit(Math.min(Number(sp.get("limit") || 50), 200)).lean();
    return NextResponse.json({ transactions });
  } catch (error) { return NextResponse.json({ error: errorMessage(error) }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const auth = await requireSession(); if (auth instanceof NextResponse) return auth;
    if (!canWrite(auth.role)) return NextResponse.json({ error: "আপনার entry permission নেই।" }, { status: 403 });
    const data = validateTransaction(await request.json()); await connectDB();
    const party = await Party.findById(data.partyId); if (!party || !party.active) return NextResponse.json({ error: "Valid active party পাওয়া যায়নি।" }, { status: 400 });
    const meta = resolveTransaction(data.type, data.account, data.effect);
    const allocationTotal = data.allocations.reduce((sum, row) => sum + row.amount, 0);
    if (allocationTotal > data.amount) return NextResponse.json({ error: "Allocation total amount-এর চেয়ে বেশি হতে পারবে না।" }, { status: 400 });
    const transaction = await Transaction.create({ ...data, account: meta.account, effect: meta.effect, referenceNo: await nextReference(data.type), createdBy: auth.id, status: "POSTED" });
    await AuditLog.create({ userId: auth.id, action: "CREATE", entityType: "Transaction", entityId: transaction._id, after: transaction.toObject() });
    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: errorMessage(error) }, { status: 400 }); }
}
