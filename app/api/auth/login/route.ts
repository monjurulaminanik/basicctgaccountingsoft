import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createSession, sessionCookie } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models";
import { errorMessage } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase(), active: true }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return NextResponse.json({ error: "Email বা password সঠিক নয়।" }, { status: 401 });
    const token = await createSession({ id: user._id.toString(), name: user.name, role: user.role });
    const response = NextResponse.json({ ok: true, user: { name: user.name, role: user.role } });
    response.cookies.set(sessionCookie(token));
    return response;
  } catch (error) { return NextResponse.json({ error: errorMessage(error) }, { status: 500 }); }
}
