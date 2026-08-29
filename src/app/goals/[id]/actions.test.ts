import { beforeEach, describe, expect, it, vi } from "vitest";

// `revalidatePath` requires a Next.js request scope, which does not exist when
// server actions are called directly from vitest.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// Server actions read the caller's id from the session cookie, which needs a
// Next.js request scope. Mock it to the user each test creates.
const session = vi.hoisted(() => ({ userId: "" }));
vi.mock("@/lib/session", () => ({
  requireUserId: vi.fn(async () => session.userId),
}));


import { prisma } from "@/lib/prisma";
import { createUser } from "@/lib/users";
import { createGoal } from "@/lib/goals";
import { createReadingItem } from "@/lib/readingItems";
import {
  moveReadingItemDownAction,
  moveReadingItemToGoalAction,
  moveReadingItemUpAction,
} from "./actions";

let userId: string;

beforeEach(async () => {
  await prisma.event.deleteMany();
  await prisma.readingItem.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.user.deleteMany();

  userId = (
    await createUser({ email: "reader@example.com", password: "password123" })
  ).id;
  session.userId = userId;
});

describe("reading item move actions", () => {
  it("moves an item up and records an event", async () => {
    const goal = await createGoal({ userId, title: "Learn Rust" });
    const first = await createReadingItem({ userId, goalId: goal.id, title: "First" });
    const second = await createReadingItem({ userId, goalId: goal.id, title: "Second" });

    await moveReadingItemUpAction(second.id, goal.id);

    const items = await prisma.readingItem.findMany({
      where: { goalId: goal.id },
      orderBy: { position: "asc" },
    });
    expect(items.map((i) => i.id)).toEqual([second.id, first.id]);

    const event = await prisma.event.findFirst({
      where: { type: "reading_item_moved_up", readingItemId: second.id },
    });
    expect(event).not.toBeNull();
  });

  it("moves an item down and records an event", async () => {
    const goal = await createGoal({ userId, title: "Learn Rust" });
    const first = await createReadingItem({ userId, goalId: goal.id, title: "First" });
    const second = await createReadingItem({ userId, goalId: goal.id, title: "Second" });

    await moveReadingItemDownAction(first.id, goal.id);

    const items = await prisma.readingItem.findMany({
      where: { goalId: goal.id },
      orderBy: { position: "asc" },
    });
    expect(items.map((i) => i.id)).toEqual([second.id, first.id]);

    const event = await prisma.event.findFirst({
      where: { type: "reading_item_moved_down", readingItemId: first.id },
    });
    expect(event).not.toBeNull();
  });

  it("moves an item to another goal and records an event", async () => {
    const source = await createGoal({ userId, title: "Learn Rust" });
    const destination = await createGoal({ userId, title: "Learn Go" });
    const item = await createReadingItem({
      userId,
      goalId: source.id,
      title: "The Rust Book",
    });

    await moveReadingItemToGoalAction(item.id, source.id, destination.id);

    const moved = await prisma.readingItem.findUnique({
      where: { id: item.id },
    });
    expect(moved?.goalId).toBe(destination.id);

    const event = await prisma.event.findFirst({
      where: { type: "reading_item_moved_to_goal", readingItemId: item.id },
    });
    expect(event?.goalId).toBe(destination.id);
  });
});
