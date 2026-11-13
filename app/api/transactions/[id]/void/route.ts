import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { AuditLog, Transaction } from "@/lib/models";
import { connectDB } from "@/lib/mongodb";
import { errorMessage, requireSession } from "@/lib/http";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSession(); if (auth instanceof NextResponse) return auth;
    if (!isAdmin(auth.role)) return NextResponse.json({ error: "Only Admin can void a financial entry." }, { status: 403 });
    const { reason } = await request.json(); if (!reason?.trim()) return NextResponse.json({ error: "Void reason is required." }, { status: 400 });
    const { id } = await params; await connectDB(); const before = await Transaction.findById(id).lean();
    const transaction = await Transaction.findOneAndUpdate({ _id: id, status: "POSTED" }, { status: "VOIDED", voidReason: reason.trim() }, { new: true });
    if (!transaction) return NextResponse.json({ error: "Posted transaction not found." }, { status: 404 });
    await AuditLog.create({ userId: auth.id, action: "VOID", entityType: "Transaction", entityId: id, before, after: transaction.toObject() });
    return NextResponse.json({ transaction });
  } catch (error) { return NextResponse.json({ error: errorMessage(error) }, { status: 500 }); }
}
