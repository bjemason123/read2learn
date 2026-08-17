import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createGoal } from "@/lib/goals";
import {
  createReadingItem,
  deleteReadingItem,
  updateReadingItem,
  updateReadingItemProgress,
} from "@/lib/readingItems";

beforeEach(async () => {
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
    expect(() => createReadingItem({ goalId: goal.id, title: "  " })).toThrow();
  });

  it("rejects updating a reading item with a blank title", async () => {
    const goal = await createGoal({ title: "Learn Rust" });
    const item = await createReadingItem({ goalId: goal.id, title: "The Rust Book" });

    expect(() => updateReadingItem(item.id, { title: "  " })).toThrow(
      "Reading item title is required",
    );
  });
});
