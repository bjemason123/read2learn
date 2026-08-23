import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { createGoal } from "@/lib/goals";
import { createReadingItem, getReadingItem } from "@/lib/readingItems";
import { updateReadingItemAction } from "./actions";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

beforeEach(async () => {
  await prisma.event.deleteMany();
  await prisma.readingItem.deleteMany();
  await prisma.goal.deleteMany();
});

function formDataOf(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

describe("updateReadingItemAction", () => {
  it("saves the submitted fields", async () => {
    const goal = await createGoal({ title: "Learn Rust" });
    const item = await createReadingItem({
      goalId: goal.id,
      title: "The Rust Book",
    });

    await updateReadingItemAction(
      item.id,
      goal.id,
      formDataOf({
        title: "The Rust Book (2nd ed.)",
        author: "Steve Klabnik",
        url: "https://doc.rust-lang.org/book/",
        note: "Start with ch. 4",
      }),
    );

    const saved = await getReadingItem(item.id);
    expect(saved?.title).toBe("The Rust Book (2nd ed.)");
    expect(saved?.author).toBe("Steve Klabnik");
    expect(saved?.url).toBe("https://doc.rust-lang.org/book/");
    expect(saved?.note).toBe("Start with ch. 4");
  });

  it("clears optional fields submitted empty", async () => {
    const goal = await createGoal({ title: "Learn Rust" });
    const item = await createReadingItem({
      goalId: goal.id,
      title: "The Rust Book",
      author: "Steve Klabnik",
      note: "Start with ch. 4",
    });

    await updateReadingItemAction(
      item.id,
      goal.id,
      formDataOf({ title: "The Rust Book", author: "", url: "", note: "" }),
    );

    const saved = await getReadingItem(item.id);
    expect(saved?.author).toBe("");
    expect(saved?.note).toBe("");
  });

  it("records an event for the update", async () => {
    const goal = await createGoal({ title: "Learn Rust" });
    const item = await createReadingItem({
      goalId: goal.id,
      title: "The Rust Book",
    });

    await updateReadingItemAction(
      item.id,
      goal.id,
      formDataOf({ title: "Renamed" }),
    );

    const events = await prisma.event.findMany({
      where: { type: "reading_item_updated" },
    });
    expect(events).toHaveLength(1);
    expect(events[0].readingItemId).toBe(item.id);
    expect(events[0].goalId).toBe(goal.id);
  });

  it("rejects a blank title", async () => {
    const goal = await createGoal({ title: "Learn Rust" });
    const item = await createReadingItem({
      goalId: goal.id,
      title: "The Rust Book",
    });

    await expect(
      updateReadingItemAction(item.id, goal.id, formDataOf({ title: "   " })),
    ).rejects.toThrow("Reading item title is required");

    const saved = await getReadingItem(item.id);
    expect(saved?.title).toBe("The Rust Book");
  });
});
