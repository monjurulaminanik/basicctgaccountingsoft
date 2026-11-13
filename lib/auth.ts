import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "change-this-in-production-32-char-secret");
const COOKIE = "party_accounts_session";

export type Session = { id: string; name: string; role: "ADMIN" | "OPERATOR" | "VIEWER" };

export async function createSession(user: Session) {
  return new SignJWT(user).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("8h").sign(secret);
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try { return (await jwtVerify(token, secret)).payload as unknown as Session; } catch { return null; }
}

export const sessionCookie = (value: string) => ({ name: COOKIE, value, httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 8 });
export const clearSessionCookie = { name: COOKIE, value: "", httpOnly: true, path: "/", maxAge: 0 };

export function canWrite(role: Session["role"]) { return role === "ADMIN" || role === "OPERATOR"; }
export function isAdmin(role: Session["role"]) { return role === "ADMIN"; }
