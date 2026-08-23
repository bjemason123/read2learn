import { beforeEach, describe, expect, it, vi } from "vitest";

// `revalidatePath` requires a Next.js request scope, which does not exist when
// server actions are called directly from vitest.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { prisma } from "@/lib/prisma";
import { createGoal } from "@/lib/goals";
import { createReadingItem } from "@/lib/readingItems";
import {
  moveReadingItemDownAction,
  moveReadingItemUpAction,
} from "./actions";

beforeEach(async () => {
  await prisma.event.deleteMany();
  await prisma.readingItem.deleteMany();
  await prisma.goal.deleteMany();
});

describe("reading item move actions", () => {
  it("moves an item up and records an event", async () => {
    const goal = await createGoal({ title: "Learn Rust" });
    const first = await createReadingItem({ goalId: goal.id, title: "First" });
    const second = await createReadingItem({ goalId: goal.id, title: "Second" });

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
    const goal = await createGoal({ title: "Learn Rust" });
    const first = await createReadingItem({ goalId: goal.id, title: "First" });
    const second = await createReadingItem({ goalId: goal.id, title: "Second" });

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
});
