import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
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

  it("creates the questions the learner wants to answer as their own rows", async () => {
    const goal = await createGoal({
      title: "Learn Rust",
      questions: ["What is ownership?", "What is borrowing?"],
    });

    const found = await getGoal(goal.id);
    expect(found?.questions.map((q) => q.text)).toEqual([
      "What is ownership?",
      "What is borrowing?",
    ]);
    expect(found?.questions.map((q) => q.order)).toEqual([0, 1]);
  });

  it("trims question text and drops blank lines when creating a goal", async () => {
    const goal = await createGoal({
      title: "Learn Rust",
      questions: ["  What is ownership?  ", "   ", "", "What is borrowing?"],
    });

    const found = await getGoal(goal.id);
    expect(found?.questions.map((q) => q.text)).toEqual([
      "What is ownership?",
      "What is borrowing?",
    ]);
  });

  it("gives each question a stable id so it can be referenced by notes", async () => {
    const goal = await createGoal({
      title: "Learn Rust",
      questions: ["What is ownership?"],
    });

    const first = await getGoal(goal.id);
    const second = await getGoal(goal.id);
    expect(first?.questions[0].id).toBe(second?.questions[0].id);
  });

  it("cascades question deletion when the goal is deleted", async () => {
    const goal = await createGoal({
      title: "Learn Rust",
      questions: ["What is ownership?"],
    });

    await deleteGoal(goal.id);

    expect(await prisma.question.count({ where: { goalId: goal.id } })).toBe(0);
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
