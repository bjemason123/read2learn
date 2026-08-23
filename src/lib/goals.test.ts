import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import type { Progress } from "@/generated/prisma/client";
import {
  addQuestion,
  createGoal,
  deleteGoal,
  deleteQuestion,
  getGoal,
  groupReadingItemsForPrint,
  listGoals,
  updateGoal,
} from "@/lib/goals";
import { createReadingItem } from "@/lib/readingItems";

beforeEach(async () => {
  await prisma.readingItem.deleteMany();
  await prisma.goal.deleteMany();
});

describe("goals", () => {
  it("creates a goal", async () => {
    const goal = await createGoal({ title: "Learn Rust" });
    expect(goal.title).toBe("Learn Rust");
    expect(goal.description).toBeNull();
  });

  it("gets a goal by id including its reading items", async () => {
    const goal = await createGoal({ title: "Learn Rust" });
    await createReadingItem({ goalId: goal.id, title: "The Rust Book" });

    const found = await getGoal(goal.id);
    expect(found?.title).toBe("Learn Rust");
    expect(found?.readingItems).toHaveLength(1);
  });

  it("lists all goals", async () => {
    await createGoal({ title: "Learn Rust" });
    await createGoal({ title: "Learn Go" });

    const goals = await listGoals();
    expect(goals).toHaveLength(2);
  });

  it("updates a goal's title and description without losing reading items", async () => {
    const goal = await createGoal({ title: "Learn Rust" });
    await createReadingItem({ goalId: goal.id, title: "The Rust Book" });

    const updated = await updateGoal(goal.id, {
      title: "Learn Rust Well",
      description: "Focus on ownership",
    });
    expect(updated.title).toBe("Learn Rust Well");
    expect(updated.description).toBe("Focus on ownership");

    const found = await getGoal(goal.id);
    expect(found?.readingItems).toHaveLength(1);
  });

  it("stores the questions the learner wants to answer", async () => {
    const goal = await createGoal({
      title: "Learn Rust",
      questions: "What is ownership?",
    });
    expect(goal.questions).toBe("What is ownership?");

    const updated = await updateGoal(goal.id, {
      questions: "What is borrowing?",
    });
    expect(updated.questions).toBe("What is borrowing?");
  });

  it("deletes a goal and cascades its reading items", async () => {
    const goal = await createGoal({ title: "Learn Rust" });
    const item = await createReadingItem({ goalId: goal.id, title: "The Rust Book" });

    await deleteGoal(goal.id);

    const found = await getGoal(goal.id);
    expect(found).toBeNull();
    const remainingItem = await prisma.readingItem.findUnique({ where: { id: item.id } });
    expect(remainingItem).toBeNull();
  });

  it("throws when creating a goal with an empty title", () => {
    expect(() => createGoal({ title: "   " })).toThrow();
  });

  it("adds a question to a goal with no existing questions", async () => {
    const goal = await createGoal({ title: "Learn Rust" });

    const updated = await addQuestion(goal.id, "What is ownership?");
    expect(updated.questions).toBe("What is ownership?");
  });

  it("appends a question to a goal's existing questions", async () => {
    const goal = await createGoal({
      title: "Learn Rust",
      questions: "What is ownership?",
    });

    const updated = await addQuestion(goal.id, "What is borrowing?");
    expect(updated.questions).toBe("What is ownership?\nWhat is borrowing?");
  });

  it("rejects adding a blank question", async () => {
    const goal = await createGoal({ title: "Learn Rust" });

    await expect(addQuestion(goal.id, "  ")).rejects.toThrow(
      "Question text is required",
    );
  });

  it("deletes a question by index", async () => {
    const goal = await createGoal({
      title: "Learn Rust",
      questions: "What is ownership?\nWhat is borrowing?",
    });

    const updated = await deleteQuestion(goal.id, 0);
    expect(updated.questions).toBe("What is borrowing?");
  });

  it("clears questions to null when the last one is deleted", async () => {
    const goal = await createGoal({
      title: "Learn Rust",
      questions: "What is ownership?",
    });

    const updated = await deleteQuestion(goal.id, 0);
    expect(updated.questions).toBeNull();
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
