import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

import { Party, ShareLink } from "@/lib/models";
import { connectDB } from "@/lib/mongodb";
import { errorMessage, requireSession } from "@/lib/http";

function activeFilter(partyId: string) {
  return {
    partyId,
    kind: "LEDGER",
    revokedAt: { $exists: false },
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
  };
}

function serialize(link: { token: string; expiresAt?: Date | null; createdAt?: Date; views?: number }) {
  return {
    token: link.token,
    path: `/share/ledger/${link.token}`,
    expiresAt: link.expiresAt ?? null,
    createdAt: link.createdAt ?? null,
    views: link.views ?? 0,
  };
}

export async function GET(request: Request) {
  try {
    const auth = await requireSession(); if (auth instanceof NextResponse) return auth;
    const partyId = new URL(request.url).searchParams.get("partyId");
    if (!partyId) return NextResponse.json({ error: "partyId প্রয়োজন" }, { status: 400 });
    await connectDB();
    const link = await ShareLink.findOne(activeFilter(partyId)).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ share: link ? serialize(link) : null });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireSession(); if (auth instanceof NextResponse) return auth;
    const body = await request.json().catch(() => ({}));
    const partyId = String(body.partyId || "");
    if (!partyId) return NextResponse.json({ error: "partyId প্রয়োজন" }, { status: 400 });

    const days = Math.min(Math.max(Number(body.days) || 30, 1), 365);
    await connectDB();

    const party = await Party.findById(partyId).select("name").lean();
    if (!party) return NextResponse.json({ error: "Party পাওয়া যায়নি" }, { status: 404 });

    const existing = await ShareLink.findOne(activeFilter(partyId)).sort({ createdAt: -1 }).lean();
    if (existing) return NextResponse.json({ share: serialize(existing), reused: true });

    const token = randomBytes(18).toString("base64url");
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const link = await ShareLink.create({
      token,
      kind: "LEDGER",
      partyId,
      createdBy: auth.id,
      expiresAt,
    });
    return NextResponse.json({ share: serialize(link), reused: false }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 400 });
  }
}
