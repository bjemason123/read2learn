import { beforeEach, describe, expect, it, vi } from "vitest";

// Both `setSessionCookie` and `redirect` need a Next.js request scope, which
// does not exist when server actions are called directly from vitest.
const setSessionCookie = vi.hoisted(() => vi.fn());
vi.mock("@/lib/session", () => ({ setSessionCookie }));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { prisma } from "@/lib/prisma";
import { createUser } from "@/lib/users";
import { loginAction } from "./actions";

beforeEach(async () => {
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
  vi.clearAllMocks();

  await createUser({ email: "reader@example.com", password: "password123" });
});

function formDataOf(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

describe("loginAction", () => {
  it("sets a session cookie, records an event and redirects on valid credentials", async () => {
    await expect(
      loginAction(
        {},
        formDataOf({ email: "reader@example.com", password: "password123" }),
      ),
    ).rejects.toThrow("REDIRECT:/goals");

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "reader@example.com" },
    });

    expect(setSessionCookie).toHaveBeenCalledWith({
      userId: user.id,
      email: "reader@example.com",
    });

    const event = await prisma.event.findFirst({
      where: { type: "user_logged_in", userId: user.id },
    });
    expect(event).not.toBeNull();
  });

  it("accepts an email in a different case", async () => {
    await expect(
      loginAction(
        {},
        formDataOf({ email: "  READER@Example.COM ", password: "password123" }),
      ),
    ).rejects.toThrow("REDIRECT:/goals");

    expect(setSessionCookie).toHaveBeenCalled();
  });

  it("rejects a wrong password without setting a session", async () => {
    const result = await loginAction(
      {},
      formDataOf({ email: "reader@example.com", password: "wrongpassword" }),
    );

    expect(result).toEqual({ error: "Invalid email or password" });
    expect(setSessionCookie).not.toHaveBeenCalled();
  });

  // Same message as a wrong password, so the form can't be used to discover
  // which emails have accounts.
  it("rejects an unknown email with the same generic message", async () => {
    const result = await loginAction(
      {},
      formDataOf({ email: "nobody@example.com", password: "password123" }),
    );

    expect(result).toEqual({ error: "Invalid email or password" });
    expect(setSessionCookie).not.toHaveBeenCalled();
  });

  it("records no login event for a failed attempt", async () => {
    await loginAction(
      {},
      formDataOf({ email: "reader@example.com", password: "wrongpassword" }),
    );

    expect(await prisma.event.count({ where: { type: "user_logged_in" } })).toBe(
      0,
    );
  });
});
