import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createGoal, deleteGoal, getGoal, listGoals, updateGoal } from "@/lib/goals";
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
});
