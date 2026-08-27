import { describe, expect, it } from "vitest";
import {
  createSessionToken,
  hashPassword,
  verifyPassword,
  verifySessionToken,
} from "@/lib/auth";

describe("hashPassword / verifyPassword", () => {
  it("verifies a password against its own hash", async () => {
    const stored = await hashPassword("correct horse battery");
    expect(await verifyPassword("correct horse battery", stored)).toBe(true);
  });

  it("rejects the wrong password", async () => {
    const stored = await hashPassword("correct horse battery");
    expect(await verifyPassword("wrong horse battery", stored)).toBe(false);
  });

  it("produces a different hash each time thanks to the random salt", async () => {
    const first = await hashPassword("same password");
    const second = await hashPassword("same password");
    expect(first).not.toBe(second);
    expect(await verifyPassword("same password", first)).toBe(true);
    expect(await verifyPassword("same password", second)).toBe(true);
  });

  it("returns false for a malformed stored hash rather than throwing", async () => {
    expect(await verifyPassword("anything", "not-a-hash")).toBe(false);
    expect(await verifyPassword("anything", "")).toBe(false);
    expect(await verifyPassword("anything", "abcd:ef01")).toBe(false);
  });
});

describe("createSessionToken / verifySessionToken", () => {
  it("round-trips the userId and email", () => {
    const token = createSessionToken({
      userId: "user_1",
      email: "reader@example.com",
    });

    expect(verifySessionToken(token)).toEqual({
      userId: "user_1",
      email: "reader@example.com",
    });
  });

  it("rejects a token whose payload was tampered with", () => {
    const token = createSessionToken({
      userId: "user_1",
      email: "reader@example.com",
    });
    const [, signature] = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({
        userId: "user_2",
        email: "attacker@example.com",
        exp: Math.floor(Date.now() / 1000) + 60,
      }),
      "utf8",
    ).toString("base64url");

    expect(verifySessionToken(`${forged}.${signature}`)).toBeNull();
  });

  it("rejects a token whose signature was tampered with", () => {
    const token = createSessionToken({
      userId: "user_1",
      email: "reader@example.com",
    });
    const [body] = token.split(".");

    expect(verifySessionToken(`${body}.deadbeef`)).toBeNull();
  });

  it("rejects missing, empty and structurally invalid tokens", () => {
    expect(verifySessionToken(undefined)).toBeNull();
    expect(verifySessionToken(null)).toBeNull();
    expect(verifySessionToken("")).toBeNull();
    expect(verifySessionToken("no-dot-separator")).toBeNull();
  });
});
