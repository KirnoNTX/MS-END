import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 jours

function secret(): string {
  return process.env.ADMIN_PASSWORD ?? "poipoipoi";
}

function signSession(): string {
  return crypto
    .createHmac("sha256", secret())
    .update("clock-admin-v1")
    .digest("hex");
}

function verifyPassword(password: string): boolean {
  if (typeof password !== "string" || password.length === 0) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(secret());
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return !!token && token === signSession();
}

export async function createSession(): Promise<void> {
  const store = await cookies();
  const secure =
    process.env.SESSION_COOKIE_SECURE !== undefined
      ? process.env.SESSION_COOKIE_SECURE === "true"
      : process.env.NODE_ENV === "production";
  store.set(SESSION_COOKIE, signSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export { verifyPassword };