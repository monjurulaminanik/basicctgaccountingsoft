import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { Settings } from "@/lib/models";
import { connectDB } from "@/lib/mongodb";
import { errorMessage, requireSession } from "@/lib/http";
import { validateSettings } from "@/lib/validation";
export async function GET() { try { const auth = await requireSession(); if (auth instanceof NextResponse) return auth; await connectDB(); const settings = await Settings.findOneAndUpdate({}, { $setOnInsert: { companyName: "My Company" } }, { new: true, upsert: true }); return NextResponse.json({ settings }); } catch (error) { return NextResponse.json({ error: errorMessage(error) }, { status: 500 }); } }
export async function PATCH(request: Request) { try { const auth = await requireSession(); if (auth instanceof NextResponse) return auth; if (!isAdmin(auth.role)) return NextResponse.json({ error: "Admin permission required." }, { status: 403 }); const data = validateSettings(await request.json()); await connectDB(); const settings = await Settings.findOneAndUpdate({}, data, { new: true, upsert: true }); return NextResponse.json({ settings }); } catch (error) { return NextResponse.json({ error: errorMessage(error) }, { status: 400 }); } }
