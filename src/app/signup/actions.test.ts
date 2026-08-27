import { beforeEach, describe, expect, it, vi } from "vitest";

// Both `setSessionCookie` and `redirect` need a Next.js request scope, which
// does not exist when server actions are called directly from vitest.
const setSessionCookie = vi.hoisted(() => vi.fn());
vi.mock("@/lib/session", () => ({ setSessionCookie }));

// The real `redirect` throws to unwind the render; mock it the same way so the
// action's control flow is exercised as it is in production.
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { prisma } from "@/lib/prisma";
import { getUserByEmail } from "@/lib/users";
import { signupAction } from "./actions";

beforeEach(async () => {
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
  vi.clearAllMocks();
});

function formDataOf(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

const VALID = {
  email: "reader@example.com",
  password: "password123",
  confirmPassword: "password123",
};

describe("signupAction", () => {
  it("creates the user, sets a session cookie, records an event and redirects", async () => {
    await expect(signupAction({}, formDataOf(VALID))).rejects.toThrow(
      "REDIRECT:/goals",
    );

    const user = await getUserByEmail("reader@example.com");
    expect(user).not.toBeNull();

    expect(setSessionCookie).toHaveBeenCalledWith({
      userId: user!.id,
      email: "reader@example.com",
    });

    const event = await prisma.event.findFirst({
      where: { type: "user_signed_up", userId: user!.id },
    });
    expect(event).not.toBeNull();
  });

  it("returns an error without throwing when the email is already taken", async () => {
    await expect(signupAction({}, formDataOf(VALID))).rejects.toThrow(
      "REDIRECT:/goals",
    );
    vi.clearAllMocks();

    const result = await signupAction({}, formDataOf(VALID));

    expect(result).toEqual({
      error: "An account with this email already exists",
    });
    expect(setSessionCookie).not.toHaveBeenCalled();
    expect(await prisma.user.count()).toBe(1);
  });

  it("returns an error when the passwords do not match", async () => {
    const result = await signupAction(
      {},
      formDataOf({ ...VALID, confirmPassword: "different123" }),
    );

    expect(result).toEqual({ error: "Passwords do not match" });
    expect(await prisma.user.count()).toBe(0);
  });

  it("returns an error when the password is too short", async () => {
    const result = await signupAction(
      {},
      formDataOf({
        email: "reader@example.com",
        password: "short",
        confirmPassword: "short",
      }),
    );

    expect(result).toEqual({
      error: "Password must be at least 8 characters",
    });
    expect(await prisma.user.count()).toBe(0);
  });

  it("returns an error when the email is blank", async () => {
    const result = await signupAction({}, formDataOf({ ...VALID, email: "  " }));

    expect(result).toEqual({ error: "Email is required" });
    expect(await prisma.user.count()).toBe(0);
  });
});
