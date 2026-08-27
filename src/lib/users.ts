import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { Prisma, type User } from "@/generated/prisma/client";

export const MIN_PASSWORD_LENGTH = 8;

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export async function createUser(data: {
  email: string;
  password: string;
}): Promise<User> {
  const email = normalizeEmail(data.email);

  if (!email) {
    throw new Error("Email is required");
  }
  if (!data.password) {
    throw new Error("Password is required");
  }
  if (data.password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    );
  }

  const passwordHash = await hashPassword(data.password);

  try {
    return await prisma.user.create({ data: { email, passwordHash } });
  } catch (err) {
    // P2002 is Prisma's unique-constraint violation — the only way
    // `user.create` can fail on valid input here.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new Error("An account with this email already exists");
    }
    throw err;
  }
}

export function getUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
}

export function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}
