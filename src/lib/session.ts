import { cookies } from "next/headers";
import {
  SESSION_MAX_AGE,
  createSessionToken,
  verifySessionToken,
  type SessionPayload,
} from "@/lib/auth";

export const SESSION_COOKIE_NAME = "session";

// `cookies()` is async in this Next.js version — see
// node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cookies.md
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE_NAME)?.value);
}

// Server Components may not set cookies — only call this from a Server Action
// or Route Handler.
export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, createSessionToken(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}

// Every scoped server action starts here. `proxy.ts` already redirects
// unauthenticated requests, so reaching this without a session means the
// request bypassed routing — fail loudly rather than leaking another user's data.
export async function requireUserId(): Promise<string> {
  const session = await getSession();
  if (!session) {
    throw new Error("Not authenticated");
  }
  return session.userId;
}
