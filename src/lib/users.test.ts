import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import {
  createUser,
  getUserByEmail,
  getUserById,
  normalizeEmail,
} from "@/lib/users";

beforeEach(async () => {
  await prisma.user.deleteMany();
});

describe("normalizeEmail", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizeEmail("  reader@example.com  ")).toBe("reader@example.com");
  });

  it("lowercases the address", () => {
    expect(normalizeEmail("Reader@Example.COM")).toBe("reader@example.com");
  });
});

describe("createUser", () => {
  it("creates a user with a hashed password", async () => {
    const user = await createUser({
      email: "reader@example.com",
      password: "password123",
    });

    expect(user.email).toBe("reader@example.com");
    expect(user.passwordHash).not.toBe("password123");
    expect(await verifyPassword("password123", user.passwordHash)).toBe(true);
  });

  it("normalizes the email before storing it", async () => {
    const user = await createUser({
      email: "  Reader@Example.COM ",
      password: "password123",
    });

    expect(user.email).toBe("reader@example.com");
  });

  it("rejects a duplicate email regardless of casing", async () => {
    await createUser({ email: "reader@example.com", password: "password123" });

    await expect(
      createUser({ email: "READER@example.com", password: "password123" }),
    ).rejects.toThrow("An account with this email already exists");
  });

  it("rejects an empty email", async () => {
    await expect(
      createUser({ email: "   ", password: "password123" }),
    ).rejects.toThrow("Email is required");
  });

  it("rejects an empty password", async () => {
    await expect(
      createUser({ email: "reader@example.com", password: "" }),
    ).rejects.toThrow("Password is required");
  });

  it("rejects a password shorter than the minimum length", async () => {
    await expect(
      createUser({ email: "reader@example.com", password: "short" }),
    ).rejects.toThrow("Password must be at least 8 characters");
  });
});

describe("getUserByEmail", () => {
  it("finds a user by normalized email", async () => {
    await createUser({ email: "reader@example.com", password: "password123" });

    const found = await getUserByEmail("  READER@Example.com ");
    expect(found?.email).toBe("reader@example.com");
  });

  it("returns null when no user matches", async () => {
    expect(await getUserByEmail("nobody@example.com")).toBeNull();
  });
});

describe("getUserById", () => {
  it("finds a user by id", async () => {
    const user = await createUser({
      email: "reader@example.com",
      password: "password123",
    });

    expect((await getUserById(user.id))?.email).toBe("reader@example.com");
  });

  it("returns null when no user matches", async () => {
    expect(await getUserById("missing")).toBeNull();
  });
});
