import { NextResponse } from "next/server";
import { canWrite } from "@/lib/auth";
import { AuditLog, Party, Transaction } from "@/lib/models";
import { connectDB } from "@/lib/mongodb";
import { errorMessage, requireSession } from "@/lib/http";
import { validateParty } from "@/lib/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSession(); if (auth instanceof NextResponse) return auth;
    if (!canWrite(auth.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = validateParty(await request.json(), false); const { id } = await params; await connectDB();
    const before = await Party.findById(id).lean(); if (!before) return NextResponse.json({ error: "Party not found" }, { status: 404 });
    const party = await Party.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    await AuditLog.create({ userId: auth.id, action: "UPDATE", entityType: "Party", entityId: id, before, after: party?.toObject() });
    return NextResponse.json({ party });
  } catch (error) { return NextResponse.json({ error: errorMessage(error) }, { status: 400 }); }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSession(); if (auth instanceof NextResponse) return auth;
    if (auth.role !== "ADMIN") return NextResponse.json({ error: "Only Admin can deactivate a party." }, { status: 403 });
    const { id } = await params; await connectDB();
    const hasTransactions = await Transaction.exists({ partyId: id });
    if (hasTransactions) return NextResponse.json({ error: "লেনদেন আছে—Party delete করা যাবে না। Deactivate করুন।" }, { status: 409 });
    await Party.findByIdAndDelete(id); await AuditLog.create({ userId: auth.id, action: "DELETE", entityType: "Party", entityId: id });
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: errorMessage(error) }, { status: 500 }); }
}
