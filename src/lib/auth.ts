import {
  createHmac,
  randomBytes,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const SALT_BYTES = 16;
const KEY_BYTES = 64;

// Mirrors `src/lib/prisma.ts`'s env-with-dev-fallback style. A real secret must
// be set in production — a shared default there would let anyone forge a token.
// Resolved per call rather than at module load: `next build` evaluates this
// module with NODE_ENV=production but has no need of (and no access to) the
// runtime secret, so a load-time throw would break the build.
function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET must be set in production");
    }
    return "dev-only-session-secret-do-not-use-in-prod";
  }

  return secret;
}

// Sessions last 30 days; past that the signature is still valid but the payload
// is expired, so `verifySessionToken` treats it as logged out rather than an error.
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export const SESSION_MAX_AGE = SESSION_MAX_AGE_SECONDS;

export type SessionPayload = { userId: string; email: string };

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derived = await scryptAsync(password, salt, KEY_BYTES);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;

  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(saltHex, "hex");
    expected = Buffer.from(hashHex, "hex");
  } catch {
    return false;
  }
  if (expected.length !== KEY_BYTES) return false;

  const derived = await scryptAsync(password, salt, KEY_BYTES);
  return timingSafeEqual(derived, expected);
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(data: string): string {
  return createHmac("sha256", sessionSecret()).update(data).digest("base64url");
}

export function createSessionToken(payload: SessionPayload): string {
  const body = base64UrlEncode(
    JSON.stringify({
      userId: payload.userId,
      email: payload.email,
      exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
    }),
  );
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(
  token: string | undefined | null,
): SessionPayload | null {
  if (!token) return null;

  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  const given = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  // `timingSafeEqual` throws on length mismatch, so guard first.
  if (given.length !== wanted.length) return null;
  if (!timingSafeEqual(given, wanted)) return null;

  try {
    const parsed: unknown = JSON.parse(base64UrlDecode(body));
    if (typeof parsed !== "object" || parsed === null) return null;

    const { userId, email, exp } = parsed as Record<string, unknown>;
    if (typeof userId !== "string" || typeof email !== "string") return null;
    if (typeof exp !== "number" || exp * 1000 <= Date.now()) return null;

    return { userId, email };
  } catch {
    return null;
  }
}
