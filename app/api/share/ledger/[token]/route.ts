import { NextResponse } from "next/server";

import { ShareLink } from "@/lib/models";
import { connectDB } from "@/lib/mongodb";
import { errorMessage, requireSession } from "@/lib/http";

/** Revokes a share link so the public URL stops working immediately. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const auth = await requireSession(); if (auth instanceof NextResponse) return auth;
    const { token } = await params;
    await connectDB();
    const link = await ShareLink.findOneAndUpdate(
      { token, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } },
      { new: true }
    );
    if (!link) return NextResponse.json({ error: "লিংক পাওয়া যায়নি" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
