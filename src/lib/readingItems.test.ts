import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createUser } from "@/lib/users";
import { createGoal } from "@/lib/goals";
import {
  createReadingItem,
  deferReadingItem,
  deleteReadingItem,
  getReadingItem,
  moveReadingItemDown,
  moveReadingItemToGoal,
  moveReadingItemUp,
  restoreReadingItem,
  updateReadingItem,
  updateReadingItemProgress,
} from "@/lib/readingItems";

let userId: string;

beforeEach(async () => {
  await prisma.note.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.readingItem.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.user.deleteMany();

  userId = (
    await createUser({ email: "reader@example.com", password: "password123" })
  ).id;
});

describe("readingItems", () => {
  it("creates a reading item under a goal", async () => {
    const goal = await createGoal({ userId, title: "Learn Rust" });
    const item = await createReadingItem({ userId, goalId: goal.id, title: "The Rust Book" });

    expect(item.title).toBe("The Rust Book");
    expect(item.goalId).toBe(goal.id);
    expect(item.progress).toBe("NOT_STARTED");
  });

  it("updates progress through all three states", async () => {
    const goal = await createGoal({ userId, title: "Learn Rust" });
    const item = await createReadingItem({ userId, goalId: goal.id, title: "The Rust Book" });

    const inProgress = await updateReadingItemProgress(item.id, userId, "IN_PROGRESS");
    expect(inProgress.progress).toBe("IN_PROGRESS");

    const done = await updateReadingItemProgress(item.id, userId, "DONE");
    expect(done.progress).toBe("DONE");

    const notStarted = await updateReadingItemProgress(item.id, userId, "NOT_STARTED");
    expect(notStarted.progress).toBe("NOT_STARTED");
  });

  it("defers and restores a reading item", async () => {
    const goal = await createGoal({ userId, title: "Learn Rust" });
    const item = await createReadingItem({ userId, goalId: goal.id, title: "The Rust Book" });

    const deferred = await deferReadingItem(item.id, userId);
    expect(deferred.deferred).toBe(true);

    const restored = await restoreReadingItem(item.id, userId);
    expect(restored.deferred).toBe(false);
  });

  it("creates a reading item as not deferred by default", async () => {
    const goal = await createGoal({ userId, title: "Learn Rust" });
    const item = await createReadingItem({ userId, goalId: goal.id, title: "The Rust Book" });

    expect(item.deferred).toBe(false);
  });

  it("updates title, author, url, and note", async () => {
    const goal = await createGoal({ userId, title: "Learn Rust" });
    const item = await createReadingItem({ userId, goalId: goal.id, title: "The Rust Book" });

    const updated = await updateReadingItem(item.id, userId, {
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
    const goal = await createGoal({ userId, title: "Learn Rust" });
    const item = await createReadingItem({ userId,
      goalId: goal.id,
      title: "The Rust Book",
      author: "Steve Klabnik",
    });

    expect(item.author).toBe("Steve Klabnik");
  });

  it("deletes a reading item", async () => {
    const goal = await createGoal({ userId, title: "Learn Rust" });
    const item = await createReadingItem({ userId, goalId: goal.id, title: "The Rust Book" });

    await deleteReadingItem(item.id, userId);

    const found = await prisma.readingItem.findUnique({ where: { id: item.id } });
    expect(found).toBeNull();
  });

  it("removes reading items when the parent goal is deleted", async () => {
    const goal = await createGoal({ userId, title: "Learn Rust" });
    const item = await createReadingItem({ userId, goalId: goal.id, title: "The Rust Book" });

    await prisma.goal.delete({ where: { id: goal.id } });

    const found = await prisma.readingItem.findUnique({ where: { id: item.id } });
    expect(found).toBeNull();
  });

  it("throws when creating a reading item with an empty title", async () => {
    const goal = await createGoal({ userId, title: "Learn Rust" });
    await expect(
      createReadingItem({ userId, goalId: goal.id, title: "  " }),
    ).rejects.toThrow();
  });

  it("assigns increasing position to new items within a goal", async () => {
    const goal = await createGoal({ userId, title: "Learn Rust" });
    const first = await createReadingItem({ userId, goalId: goal.id, title: "First" });
    const second = await createReadingItem({ userId, goalId: goal.id, title: "Second" });

    expect(second.position).toBeGreaterThan(first.position);
  });

  it("moves an item up, swapping with its predecessor", async () => {
    const goal = await createGoal({ userId, title: "Learn Rust" });
    const first = await createReadingItem({ userId, goalId: goal.id, title: "First" });
    const second = await createReadingItem({ userId, goalId: goal.id, title: "Second" });

    await moveReadingItemUp(second.id, userId);

    const items = await prisma.readingItem.findMany({
      where: { goalId: goal.id },
      orderBy: { position: "asc" },
    });
    expect(items.map((i) => i.id)).toEqual([second.id, first.id]);
  });

  it("moves an item down, swapping with its successor", async () => {
    const goal = await createGoal({ userId, title: "Learn Rust" });
    const first = await createReadingItem({ userId, goalId: goal.id, title: "First" });
    const second = await createReadingItem({ userId, goalId: goal.id, title: "Second" });

    await moveReadingItemDown(first.id, userId);

    const items = await prisma.readingItem.findMany({
      where: { goalId: goal.id },
      orderBy: { position: "asc" },
    });
    expect(items.map((i) => i.id)).toEqual([second.id, first.id]);
  });

  it("no-ops moving the top item up", async () => {
    const goal = await createGoal({ userId, title: "Learn Rust" });
    const first = await createReadingItem({ userId, goalId: goal.id, title: "First" });
    await createReadingItem({ userId, goalId: goal.id, title: "Second" });

    const result = await moveReadingItemUp(first.id, userId);
    expect(result.position).toBe(first.position);
  });

  it("no-ops moving the bottom item down", async () => {
    const goal = await createGoal({ userId, title: "Learn Rust" });
    await createReadingItem({ userId, goalId: goal.id, title: "First" });
    const second = await createReadingItem({ userId, goalId: goal.id, title: "Second" });

    const result = await moveReadingItemDown(second.id, userId);
    expect(result.position).toBe(second.position);
  });

  it("skips items in the other deferred bucket when moving", async () => {
    const goal = await createGoal({ userId, title: "Learn Rust" });
    const first = await createReadingItem({ userId, goalId: goal.id, title: "First" });
    const second = await createReadingItem({ userId, goalId: goal.id, title: "Second" });
    const third = await createReadingItem({ userId, goalId: goal.id, title: "Third" });
    await deferReadingItem(second.id, userId);
    const secondBefore = await prisma.readingItem.findUniqueOrThrow({
      where: { id: second.id },
    });

    await moveReadingItemDown(first.id, userId);

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
    const goal = await createGoal({ userId, title: "Learn Rust" });
    const item = await createReadingItem({ userId, goalId: goal.id, title: "The Rust Book" });

    await expect(
      updateReadingItem(item.id, userId, { title: "  " }),
    ).rejects.toThrow("Reading item title is required");
  });
  it("defaults type to OTHER", async () => {
    const goal = await createGoal({ userId, title: "Learn Rust" });
    const item = await createReadingItem({ userId, goalId: goal.id, title: "The Rust Book" });

    expect(item.type).toBe("OTHER");
  });

  it("creates a reading item with an explicit type", async () => {
    const goal = await createGoal({ userId, title: "Learn Rust" });
    const item = await createReadingItem({ userId,
      goalId: goal.id,
      title: "The Rust Book",
      type: "BOOK",
    });

    expect(item.type).toBe("BOOK");
  });

  it("updates a reading item's type", async () => {
    const goal = await createGoal({ userId, title: "Learn Rust" });
    const item = await createReadingItem({ userId, goalId: goal.id, title: "A paper" });

    const updated = await updateReadingItem(item.id, userId, { type: "PAPER" });

    expect(updated.type).toBe("PAPER");
  });
});

describe("getReadingItem", () => {
  it("returns null for an unknown id", async () => {
    expect(await getReadingItem("does-not-exist", userId)).toBeNull();
  });

  it("returns the item for a known id", async () => {
    const goal = await createGoal({ userId, title: "Learn Rust" });
    const item = await createReadingItem({ userId, goalId: goal.id, title: "The Rust Book" });

    const loaded = await getReadingItem(item.id, userId);

    expect(loaded?.id).toBe(item.id);
    expect(loaded?.title).toBe("The Rust Book");
  });
});

// Reading items have no `userId` column — ownership comes from the parent goal.
describe("cross-user isolation", () => {
  async function makeOtherUsersItem() {
    const otherUserId = (
      await createUser({ email: "other@example.com", password: "password123" })
    ).id;
    const goal = await createGoal({ userId: otherUserId, title: "Theirs" });
    const item = await createReadingItem({
      userId: otherUserId,
      goalId: goal.id,
      title: "Their book",
    });
    return { otherUserId, goal, item };
  }

  it("refuses to add a reading item to another user's goal", async () => {
    const { goal } = await makeOtherUsersItem();

    await expect(
      createReadingItem({ userId, goalId: goal.id, title: "Sneaky" }),
    ).rejects.toThrow("Goal not found");
  });

  it("returns null when fetching another user's reading item", async () => {
    const { item } = await makeOtherUsersItem();

    expect(await getReadingItem(item.id, userId)).toBeNull();
  });

  it("refuses to update another user's reading item", async () => {
    const { otherUserId, item } = await makeOtherUsersItem();

    await expect(
      updateReadingItem(item.id, userId, { title: "Hijacked" }),
    ).rejects.toThrow("Reading item not found");

    const unchanged = await getReadingItem(item.id, otherUserId);
    expect(unchanged?.title).toBe("Their book");
  });

  it("refuses to change progress on another user's reading item", async () => {
    const { item } = await makeOtherUsersItem();

    await expect(
      updateReadingItemProgress(item.id, userId, "DONE"),
    ).rejects.toThrow("Reading item not found");
  });

  it("refuses to defer, restore or reorder another user's reading item", async () => {
    const { item } = await makeOtherUsersItem();

    await expect(deferReadingItem(item.id, userId)).rejects.toThrow(
      "Reading item not found",
    );
    await expect(restoreReadingItem(item.id, userId)).rejects.toThrow(
      "Reading item not found",
    );
    await expect(moveReadingItemUp(item.id, userId)).rejects.toThrow(
      "Reading item not found",
    );
    await expect(moveReadingItemDown(item.id, userId)).rejects.toThrow(
      "Reading item not found",
    );
  });

  it("moves an item to another goal, appended at the end", async () => {
    const source = await createGoal({ userId, title: "Learn Rust" });
    const destination = await createGoal({ userId, title: "Learn Go" });
    const existing = await createReadingItem({
      userId,
      goalId: destination.id,
      title: "The Go Book",
    });
    const item = await createReadingItem({
      userId,
      goalId: source.id,
      title: "The Rust Book",
    });

    const moved = await moveReadingItemToGoal(item.id, userId, destination.id);

    expect(moved.goalId).toBe(destination.id);
    expect(moved.position).toBe(existing.position + 1);
    expect(await prisma.readingItem.count({ where: { goalId: source.id } })).toBe(
      0,
    );
  });

  it("keeps notes attached when an item moves goal", async () => {
    const source = await createGoal({ userId, title: "Learn Rust" });
    const destination = await createGoal({ userId, title: "Learn Go" });
    const item = await createReadingItem({
      userId,
      goalId: source.id,
      title: "The Rust Book",
    });
    const note = await prisma.note.create({
      data: { readingItemId: item.id, body: "ownership rules", order: 0 },
    });

    await moveReadingItemToGoal(item.id, userId, destination.id);

    const kept = await prisma.note.findUnique({ where: { id: note.id } });
    expect(kept?.readingItemId).toBe(item.id);
  });

  it("treats moving an item to its own goal as a no-op", async () => {
    const goal = await createGoal({ userId, title: "Learn Rust" });
    const first = await createReadingItem({
      userId,
      goalId: goal.id,
      title: "First",
    });
    const second = await createReadingItem({
      userId,
      goalId: goal.id,
      title: "Second",
    });

    const result = await moveReadingItemToGoal(first.id, userId, goal.id);

    expect(result.position).toBe(first.position);
    const items = await prisma.readingItem.findMany({
      where: { goalId: goal.id },
      orderBy: { position: "asc" },
    });
    expect(items.map((i) => i.id)).toEqual([first.id, second.id]);
  });

  it("refuses to move an item into another user's goal", async () => {
    const { goal: theirGoal } = await makeOtherUsersItem();
    const goal = await createGoal({ userId, title: "Learn Rust" });
    const item = await createReadingItem({
      userId,
      goalId: goal.id,
      title: "The Rust Book",
    });

    await expect(
      moveReadingItemToGoal(item.id, userId, theirGoal.id),
    ).rejects.toThrow("Goal not found");
    expect(
      (await prisma.readingItem.findUniqueOrThrow({ where: { id: item.id } }))
        .goalId,
    ).toBe(goal.id);
  });

  it("refuses to move another user's reading item", async () => {
    const { item } = await makeOtherUsersItem();
    const goal = await createGoal({ userId, title: "Learn Rust" });

    await expect(
      moveReadingItemToGoal(item.id, userId, goal.id),
    ).rejects.toThrow("Reading item not found");
  });

  it("refuses to delete another user's reading item", async () => {
    const { item } = await makeOtherUsersItem();

    await expect(deleteReadingItem(item.id, userId)).rejects.toThrow(
      "Reading item not found",
    );
    expect(await prisma.readingItem.count({ where: { id: item.id } })).toBe(1);
  });
});
