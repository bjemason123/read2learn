import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/session";

// `middleware.ts` was deprecated and renamed to `proxy.ts` in Next.js 16, and
// Proxy now defaults to the Node.js runtime — so Node's `crypto` HMAC used by
// `verifySessionToken` is available here.
// See node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (verifySessionToken(token)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  // Tampered or expired cookies would otherwise be re-sent on every request and
  // keep failing — clear it as part of the redirect.
  const response = NextResponse.redirect(loginUrl);
  if (token) {
    response.cookies.delete(SESSION_COOKIE_NAME);
  }
  return response;
}

export const config = {
  matcher: [
    // Everything except the auth pages, Next internals and static assets.
    "/((?!login|signup|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|txt|xml)$).*)",
  ],
};
