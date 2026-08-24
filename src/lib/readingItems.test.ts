import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createGoal } from "@/lib/goals";
import {
  createReadingItem,
  deferReadingItem,
  deleteReadingItem,
  getReadingItem,
  moveReadingItemDown,
  moveReadingItemUp,
  restoreReadingItem,
  updateReadingItem,
  updateReadingItemProgress,
} from "@/lib/readingItems";

beforeEach(async () => {
  await prisma.note.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.readingItem.deleteMany();
  await prisma.goal.deleteMany();
});

describe("readingItems", () => {
  it("creates a reading item under a goal", async () => {
    const goal = await createGoal({ title: "Learn Rust" });
    const item = await createReadingItem({ goalId: goal.id, title: "The Rust Book" });

    expect(item.title).toBe("The Rust Book");
    expect(item.goalId).toBe(goal.id);
    expect(item.progress).toBe("NOT_STARTED");
  });

  it("updates progress through all three states", async () => {
    const goal = await createGoal({ title: "Learn Rust" });
    const item = await createReadingItem({ goalId: goal.id, title: "The Rust Book" });

    const inProgress = await updateReadingItemProgress(item.id, "IN_PROGRESS");
    expect(inProgress.progress).toBe("IN_PROGRESS");

    const done = await updateReadingItemProgress(item.id, "DONE");
    expect(done.progress).toBe("DONE");

    const notStarted = await updateReadingItemProgress(item.id, "NOT_STARTED");
    expect(notStarted.progress).toBe("NOT_STARTED");
  });

  it("defers and restores a reading item", async () => {
    const goal = await createGoal({ title: "Learn Rust" });
    const item = await createReadingItem({ goalId: goal.id, title: "The Rust Book" });

    const deferred = await deferReadingItem(item.id);
    expect(deferred.deferred).toBe(true);

    const restored = await restoreReadingItem(item.id);
    expect(restored.deferred).toBe(false);
  });

  it("creates a reading item as not deferred by default", async () => {
    const goal = await createGoal({ title: "Learn Rust" });
    const item = await createReadingItem({ goalId: goal.id, title: "The Rust Book" });

    expect(item.deferred).toBe(false);
  });

  it("updates title, author, url, and note", async () => {
    const goal = await createGoal({ title: "Learn Rust" });
    const item = await createReadingItem({ goalId: goal.id, title: "The Rust Book" });

    const updated = await updateReadingItem(item.id, {
      title: "The Rust Book (2nd ed.)",
      author: "Steve Klabnik",
      url: "https://doc.rust-lang.org/book/",
      note: "Start with ch. 4",
    });

    expect(updated.title).toBe("The Rust Book (2nd ed.)");
    expect(updated.author).toBe("Steve Klabnik");
    expect(updated.url).toBe("https://doc.rust-lang.org/book/");
    expect(updated.note).toBe("Start with ch. 4");
  });

  it("stores an author when creating a reading item", async () => {
    const goal = await createGoal({ title: "Learn Rust" });
    const item = await createReadingItem({
      goalId: goal.id,
      title: "The Rust Book",
      author: "Steve Klabnik",
    });

    expect(item.author).toBe("Steve Klabnik");
  });

  it("deletes a reading item", async () => {
    const goal = await createGoal({ title: "Learn Rust" });
    const item = await createReadingItem({ goalId: goal.id, title: "The Rust Book" });

    await deleteReadingItem(item.id);

    const found = await prisma.readingItem.findUnique({ where: { id: item.id } });
    expect(found).toBeNull();
  });

  it("removes reading items when the parent goal is deleted", async () => {
    const goal = await createGoal({ title: "Learn Rust" });
    const item = await createReadingItem({ goalId: goal.id, title: "The Rust Book" });

    await prisma.goal.delete({ where: { id: goal.id } });

    const found = await prisma.readingItem.findUnique({ where: { id: item.id } });
    expect(found).toBeNull();
  });

  it("throws when creating a reading item with an empty title", async () => {
    const goal = await createGoal({ title: "Learn Rust" });
    await expect(
      createReadingItem({ goalId: goal.id, title: "  " }),
    ).rejects.toThrow();
  });

  it("assigns increasing position to new items within a goal", async () => {
    const goal = await createGoal({ title: "Learn Rust" });
    const first = await createReadingItem({ goalId: goal.id, title: "First" });
    const second = await createReadingItem({ goalId: goal.id, title: "Second" });

    expect(second.position).toBeGreaterThan(first.position);
  });

  it("moves an item up, swapping with its predecessor", async () => {
    const goal = await createGoal({ title: "Learn Rust" });
    const first = await createReadingItem({ goalId: goal.id, title: "First" });
    const second = await createReadingItem({ goalId: goal.id, title: "Second" });

    await moveReadingItemUp(second.id);

    const items = await prisma.readingItem.findMany({
      where: { goalId: goal.id },
      orderBy: { position: "asc" },
    });
    expect(items.map((i) => i.id)).toEqual([second.id, first.id]);
  });

  it("moves an item down, swapping with its successor", async () => {
    const goal = await createGoal({ title: "Learn Rust" });
    const first = await createReadingItem({ goalId: goal.id, title: "First" });
    const second = await createReadingItem({ goalId: goal.id, title: "Second" });

    await moveReadingItemDown(first.id);

    const items = await prisma.readingItem.findMany({
      where: { goalId: goal.id },
      orderBy: { position: "asc" },
    });
    expect(items.map((i) => i.id)).toEqual([second.id, first.id]);
  });

  it("no-ops moving the top item up", async () => {
    const goal = await createGoal({ title: "Learn Rust" });
    const first = await createReadingItem({ goalId: goal.id, title: "First" });
    await createReadingItem({ goalId: goal.id, title: "Second" });

    const result = await moveReadingItemUp(first.id);
    expect(result.position).toBe(first.position);
  });

  it("no-ops moving the bottom item down", async () => {
    const goal = await createGoal({ title: "Learn Rust" });
    await createReadingItem({ goalId: goal.id, title: "First" });
    const second = await createReadingItem({ goalId: goal.id, title: "Second" });

    const result = await moveReadingItemDown(second.id);
    expect(result.position).toBe(second.position);
  });

  it("skips items in the other deferred bucket when moving", async () => {
    const goal = await createGoal({ title: "Learn Rust" });
    const first = await createReadingItem({ goalId: goal.id, title: "First" });
    const second = await createReadingItem({ goalId: goal.id, title: "Second" });
    const third = await createReadingItem({ goalId: goal.id, title: "Third" });
    await deferReadingItem(second.id);
    const secondBefore = await prisma.readingItem.findUniqueOrThrow({
      where: { id: second.id },
    });

    await moveReadingItemDown(first.id);

    const activeItems = await prisma.readingItem.findMany({
      where: { goalId: goal.id, deferred: false },
      orderBy: { position: "asc" },
    });
    expect(activeItems.map((i) => i.id)).toEqual([third.id, first.id]);

    const secondAfter = await prisma.readingItem.findUniqueOrThrow({
      where: { id: second.id },
    });
    expect(secondAfter.position).toBe(secondBefore.position);
  });

  it("rejects updating a reading item with a blank title", async () => {
    const goal = await createGoal({ title: "Learn Rust" });
    const item = await createReadingItem({ goalId: goal.id, title: "The Rust Book" });

    expect(() => updateReadingItem(item.id, { title: "  " })).toThrow(
      "Reading item title is required",
    );
  });
  it("defaults type to OTHER", async () => {
    const goal = await createGoal({ title: "Learn Rust" });
    const item = await createReadingItem({ goalId: goal.id, title: "The Rust Book" });

    expect(item.type).toBe("OTHER");
  });

  it("creates a reading item with an explicit type", async () => {
    const goal = await createGoal({ title: "Learn Rust" });
    const item = await createReadingItem({
      goalId: goal.id,
      title: "The Rust Book",
      type: "BOOK",
    });

    expect(item.type).toBe("BOOK");
  });

  it("updates a reading item's type", async () => {
    const goal = await createGoal({ title: "Learn Rust" });
    const item = await createReadingItem({ goalId: goal.id, title: "A paper" });

    const updated = await updateReadingItem(item.id, { type: "PAPER" });

    expect(updated.type).toBe("PAPER");
  });
});

describe("getReadingItem", () => {
  it("returns null for an unknown id", async () => {
    expect(await getReadingItem("does-not-exist")).toBeNull();
  });

  it("returns the item for a known id", async () => {
    const goal = await createGoal({ title: "Learn Rust" });
    const item = await createReadingItem({ goalId: goal.id, title: "The Rust Book" });

    const loaded = await getReadingItem(item.id);

    expect(loaded?.id).toBe(item.id);
    expect(loaded?.title).toBe("The Rust Book");
  });
});
