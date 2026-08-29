import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createUser } from "@/lib/users";
import type { Progress } from "@/generated/prisma/client";
import {
  createGoal,
  deleteGoal,
  getGoal,
  groupReadingItemsForPrint,
  listGoals,
  parseQuestions,
  updateGoal,
} from "@/lib/goals";
import { createReadingItem } from "@/lib/readingItems";
import { createNote } from "@/lib/notes";

let userId: string;

beforeEach(async () => {
  await prisma.readingItem.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.user.deleteMany();

  userId = (
    await createUser({ email: "reader@example.com", password: "password123" })
  ).id;
});

describe("goals", () => {
  it("creates a goal", async () => {
    const goal = await createGoal({ userId, title: "Learn Rust" });
    expect(goal.title).toBe("Learn Rust");
    expect(goal.description).toBeNull();
  });

  it("gets a goal by id including its reading items", async () => {
    const goal = await createGoal({ userId, title: "Learn Rust" });
    await createReadingItem({ userId, goalId: goal.id, title: "The Rust Book" });

    const found = await getGoal(goal.id, userId);
    expect(found?.title).toBe("Learn Rust");
    expect(found?.readingItems).toHaveLength(1);
  });

  it("lists all goals", async () => {
    await createGoal({ userId, title: "Learn Rust" });
    await createGoal({ userId, title: "Learn Go" });

    const goals = await listGoals(userId);
    expect(goals).toHaveLength(2);
  });

  it("updates a goal's title and description without losing reading items", async () => {
    const goal = await createGoal({ userId, title: "Learn Rust" });
    await createReadingItem({ userId, goalId: goal.id, title: "The Rust Book" });

    const updated = await updateGoal(goal.id, userId, {
      title: "Learn Rust Well",
      description: "Focus on ownership",
    });
    expect(updated.title).toBe("Learn Rust Well");
    expect(updated.description).toBe("Focus on ownership");

    const found = await getGoal(goal.id, userId);
    expect(found?.readingItems).toHaveLength(1);
  });

  it("creates the questions the learner wants to answer as their own rows", async () => {
    const goal = await createGoal({ userId,
      title: "Learn Rust",
      questions: ["What is ownership?", "What is borrowing?"],
    });

    const found = await getGoal(goal.id, userId);
    expect(found?.questions.map((q) => q.text)).toEqual([
      "What is ownership?",
      "What is borrowing?",
    ]);
    expect(found?.questions.map((q) => q.order)).toEqual([0, 1]);
  });

  it("trims question text and drops blank lines when creating a goal", async () => {
    const goal = await createGoal({ userId,
      title: "Learn Rust",
      questions: ["  What is ownership?  ", "   ", "", "What is borrowing?"],
    });

    const found = await getGoal(goal.id, userId);
    expect(found?.questions.map((q) => q.text)).toEqual([
      "What is ownership?",
      "What is borrowing?",
    ]);
  });

  it("gives each question a stable id so it can be referenced by notes", async () => {
    const goal = await createGoal({ userId,
      title: "Learn Rust",
      questions: ["What is ownership?"],
    });

    const first = await getGoal(goal.id, userId);
    const second = await getGoal(goal.id, userId);
    expect(first?.questions[0].id).toBe(second?.questions[0].id);
  });

  it("cascades question deletion when the goal is deleted", async () => {
    const goal = await createGoal({ userId,
      title: "Learn Rust",
      questions: ["What is ownership?"],
    });

    await deleteGoal(goal.id, userId);

    expect(await prisma.question.count({ where: { goalId: goal.id } })).toBe(0);
  });

  it("deletes a goal and cascades its reading items", async () => {
    const goal = await createGoal({ userId, title: "Learn Rust" });
    const item = await createReadingItem({ userId, goalId: goal.id, title: "The Rust Book" });

    await deleteGoal(goal.id, userId);

    const found = await getGoal(goal.id, userId);
    expect(found).toBeNull();
    const remainingItem = await prisma.readingItem.findUnique({ where: { id: item.id } });
    expect(remainingItem).toBeNull();
  });

  it("throws when creating a goal with an empty title", () => {
    expect(() => createGoal({ userId, title: "   " })).toThrow();
  });

});

// The core security property of the auth feature: one user's data must never
// be readable or writable by another.
describe("cross-user isolation", () => {
  let otherUserId: string;

  beforeEach(async () => {
    otherUserId = (
      await createUser({ email: "other@example.com", password: "password123" })
    ).id;
  });

  it("does not list another user's goals", async () => {
    await createGoal({ userId, title: "Mine" });
    await createGoal({ userId: otherUserId, title: "Theirs" });

    const mine = await listGoals(userId);
    expect(mine.map((goal) => goal.title)).toEqual(["Mine"]);

    const theirs = await listGoals(otherUserId);
    expect(theirs.map((goal) => goal.title)).toEqual(["Theirs"]);
  });

  it("returns null when fetching another user's goal by id", async () => {
    const goal = await createGoal({ userId: otherUserId, title: "Theirs" });

    expect(await getGoal(goal.id, userId)).toBeNull();
  });

  it("refuses to update another user's goal", async () => {
    const goal = await createGoal({ userId: otherUserId, title: "Theirs" });

    await expect(
      updateGoal(goal.id, userId, { title: "Hijacked" }),
    ).rejects.toThrow("Goal not found");

    const unchanged = await getGoal(goal.id, otherUserId);
    expect(unchanged?.title).toBe("Theirs");
  });

  it("refuses to delete another user's goal", async () => {
    const goal = await createGoal({ userId: otherUserId, title: "Theirs" });

    await expect(deleteGoal(goal.id, userId)).rejects.toThrow("Goal not found");
    expect(await getGoal(goal.id, otherUserId)).not.toBeNull();
  });

  it("reports a missing goal and another user's goal identically", async () => {
    const goal = await createGoal({ userId: otherUserId, title: "Theirs" });

    const foreign = await deleteGoal(goal.id, userId).catch(
      (err: Error) => err.message,
    );
    const missing = await deleteGoal("does-not-exist", userId).catch(
      (err: Error) => err.message,
    );

    expect(foreign).toBe(missing);
  });

  it("cascades a user's goals away when the user is deleted", async () => {
    const goal = await createGoal({ userId: otherUserId, title: "Theirs" });

    await prisma.user.delete({ where: { id: otherUserId } });

    expect(
      await prisma.goal.findUnique({ where: { id: goal.id } }),
    ).toBeNull();
  });
});

// The print view renders every note of every reading item, so `getGoal` has to
// supply them — with tags and linked questions — in the order they were taken.
describe("getGoal reading item notes", () => {
  it("includes each reading item's notes with their tags and linked questions", async () => {
    const goal = await createGoal({
      userId,
      title: "Learn Rust",
      questions: ["What is ownership?"],
    });
    const item = await createReadingItem({
      userId,
      goalId: goal.id,
      title: "The Rust Book",
    });
    const questionId = (await getGoal(goal.id, userId))!.questions[0].id;

    await createNote({
      userId,
      readingItemId: item.id,
      body: "Ownership moves on assignment",
      location: "Chapter 4",
      tags: ["memory"],
      questionIds: [questionId],
    });

    const found = await getGoal(goal.id, userId);
    const notes = found!.readingItems[0].notes;

    expect(notes).toHaveLength(1);
    expect(notes[0].body).toBe("Ownership moves on assignment");
    expect(notes[0].location).toBe("Chapter 4");
    expect(notes[0].tags.map((tag) => tag.name)).toEqual(["memory"]);
    expect(notes[0].questions.map((q) => q.text)).toEqual([
      "What is ownership?",
    ]);
  });

  it("orders notes by their order field, not by insertion", async () => {
    const goal = await createGoal({ userId, title: "Learn Rust" });
    const item = await createReadingItem({
      userId,
      goalId: goal.id,
      title: "The Rust Book",
    });

    const first = await createNote({ userId, readingItemId: item.id, body: "a" });
    const second = await createNote({ userId, readingItemId: item.id, body: "b" });

    // Swap the stored order so insertion order and `order` disagree.
    await prisma.note.update({ where: { id: first.id }, data: { order: 10 } });
    await prisma.note.update({ where: { id: second.id }, data: { order: 0 } });

    const found = await getGoal(goal.id, userId);
    expect(found!.readingItems[0].notes.map((n) => n.body)).toEqual(["b", "a"]);
  });

  it("returns an empty notes array for a reading item with no notes", async () => {
    const goal = await createGoal({ userId, title: "Learn Rust" });
    await createReadingItem({ userId, goalId: goal.id, title: "The Rust Book" });

    const found = await getGoal(goal.id, userId);
    expect(found!.readingItems[0].notes).toEqual([]);
  });

  it("carries the structured notes through groupReadingItemsForPrint", async () => {
    const goal = await createGoal({ userId, title: "Learn Rust" });
    const item = await createReadingItem({
      userId,
      goalId: goal.id,
      title: "The Rust Book",
    });
    await createNote({
      userId,
      readingItemId: item.id,
      body: "Borrowing is temporary",
      tags: ["memory"],
    });

    const found = await getGoal(goal.id, userId);
    const groups = groupReadingItemsForPrint(found!.readingItems);

    expect(groups).toHaveLength(1);
    const printed = groups[0].items[0];
    expect(printed.notes.map((n) => n.body)).toEqual(["Borrowing is temporary"]);
    expect(printed.notes[0].tags.map((t) => t.name)).toEqual(["memory"]);
  });
});

describe("parseQuestions", () => {
  it("splits the one-per-line textarea into trimmed lines", () => {
    expect(parseQuestions("What is ownership?\nWhat is borrowing?")).toEqual([
      "What is ownership?",
      "What is borrowing?",
    ]);
  });

  it("drops blank and whitespace-only lines", () => {
    expect(parseQuestions("a\n\n   \nb")).toEqual(["a", "b"]);
  });

  it("returns an empty array for null, undefined, or empty input", () => {
    expect(parseQuestions(null)).toEqual([]);
    expect(parseQuestions(undefined)).toEqual([]);
    expect(parseQuestions("")).toEqual([]);
  });
});

describe("groupReadingItemsForPrint", () => {
  const item = (
    title: string,
    progress: Progress,
    deferred = false,
  ): { title: string; progress: Progress; deferred: boolean } => ({
    title,
    progress,
    deferred,
  });

  it("sorts non-deferred items into their progress buckets", () => {
    const groups = groupReadingItemsForPrint([
      item("A", "DONE"),
      item("B", "NOT_STARTED"),
      item("C", "IN_PROGRESS"),
    ]);

    expect(groups.map((g) => g.key)).toEqual([
      "NOT_STARTED",
      "IN_PROGRESS",
      "DONE",
    ]);
    expect(groups.map((g) => g.items.map((i) => i.title))).toEqual([
      ["B"],
      ["C"],
      ["A"],
    ]);
  });

  it("puts deferred items in the Deferred bucket regardless of progress", () => {
    const groups = groupReadingItemsForPrint([
      item("done-active", "DONE"),
      item("done-deferred", "DONE", true),
      item("not-started-deferred", "NOT_STARTED", true),
    ]);

    expect(groups.map((g) => g.key)).toEqual(["DONE", "DEFERRED"]);
    expect(groups[0].items.map((i) => i.title)).toEqual(["done-active"]);
    expect(groups[1].items.map((i) => i.title)).toEqual([
      "done-deferred",
      "not-started-deferred",
    ]);
  });

  it("omits empty buckets", () => {
    const groups = groupReadingItemsForPrint([item("A", "NOT_STARTED")]);

    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe("NOT_STARTED");
  });

  it("returns an empty array when there are no items", () => {
    expect(groupReadingItemsForPrint([])).toEqual([]);
  });

  it("orders all four groups Not started, In progress, Done, Deferred", () => {
    const groups = groupReadingItemsForPrint([
      item("d", "NOT_STARTED", true),
      item("c", "DONE"),
      item("b", "IN_PROGRESS"),
      item("a", "NOT_STARTED"),
    ]);

    expect(groups.map((g) => g.label)).toEqual([
      "Not started",
      "In progress",
      "Done",
      "Deferred",
    ]);
  });

  it("preserves the input order of items within a bucket", () => {
    const groups = groupReadingItemsForPrint([
      item("first", "IN_PROGRESS"),
      item("second", "IN_PROGRESS"),
      item("third", "IN_PROGRESS"),
    ]);

    expect(groups[0].items.map((i) => i.title)).toEqual([
      "first",
      "second",
      "third",
    ]);
  });
});
