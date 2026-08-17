import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { recordEvent } from "@/lib/events";

beforeEach(async () => {
  await prisma.event.deleteMany();
  await prisma.readingItem.deleteMany();
  await prisma.goal.deleteMany();
});

describe("events", () => {
  it("records an event with a type", async () => {
    const event = await recordEvent({ type: "goal_created" });
    expect(event.type).toBe("goal_created");
    expect(event.goalId).toBeNull();
  });

  it("records an event linked to a goal and reading item", async () => {
    const event = await recordEvent({
      type: "reading_item_created",
      goalId: "goal-1",
      readingItemId: "item-1",
    });
    expect(event.goalId).toBe("goal-1");
    expect(event.readingItemId).toBe("item-1");
  });
});
