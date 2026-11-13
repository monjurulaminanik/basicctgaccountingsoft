import { NextResponse } from "next/server";
import { getSession, Session } from "@/lib/auth";

export async function requireSession(): Promise<Session | NextResponse> {
  const session = await getSession();
  return session || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}
