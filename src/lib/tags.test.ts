import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createUser } from "@/lib/users";
import { createGoal } from "@/lib/goals";
import { createReadingItem } from "@/lib/readingItems";
import { createNote } from "@/lib/notes";
import { normalizeTagName, syncNoteTags } from "@/lib/tags";

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

async function makeNote(body = "A note") {
  const goal = await createGoal({ userId, title: "Learn Rust" });
  const item = await createReadingItem({ userId,
    goalId: goal.id,
    title: "The Rust Book",
  });
  return createNote({ userId, readingItemId: item.id, body });
}

describe("normalizeTagName", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizeTagName("  memory  ")).toBe("memory");
  });

  it("lowercases the name", () => {
    expect(normalizeTagName("Memory")).toBe("memory");
  });

  it("collapses inner whitespace", () => {
    expect(normalizeTagName("spaced   out\ttag")).toBe("spaced out tag");
  });

  it("returns null for an empty string", () => {
    expect(normalizeTagName("")).toBeNull();
  });

  it("returns null for a whitespace-only string", () => {
    expect(normalizeTagName("   \t  ")).toBeNull();
  });
});

describe("syncNoteTags", () => {
  it("dedupes tags that differ only by case", async () => {
    const note = await makeNote();

    await syncNoteTags(note.id, userId, ["ai", "AI", "Ai"]);

    const tags = await prisma.tag.findMany();
    expect(tags.map((tag) => tag.name)).toEqual(["ai"]);
  });

  it("ignores whitespace-only entries rather than erroring", async () => {
    const note = await makeNote();

    await syncNoteTags(note.id, userId, ["memory", "   ", ""]);

    const tags = await prisma.tag.findMany();
    expect(tags.map((tag) => tag.name)).toEqual(["memory"]);
  });

  it("connects an existing tag instead of creating a duplicate", async () => {
    const first = await makeNote("First note");
    const second = await createNote({ userId,
      readingItemId: first.readingItemId,
      body: "Second note",
    });

    await syncNoteTags(first.id, userId, ["memory"]);
    await syncNoteTags(second.id, userId, ["memory"]);

    const tags = await prisma.tag.findMany({ include: { notes: true } });
    expect(tags).toHaveLength(1);
    expect(tags[0].notes.map((note) => note.id).sort()).toEqual(
      [first.id, second.id].sort(),
    );
  });

  it("prunes a tag once its last note is retagged away from it", async () => {
    const note = await makeNote();

    await syncNoteTags(note.id, userId, ["memory"]);
    expect(await prisma.tag.count({ where: { name: "memory" } })).toBe(1);

    await syncNoteTags(note.id, userId, ["attention"]);

    expect(await prisma.tag.count({ where: { name: "memory" } })).toBe(0);
    expect(await prisma.tag.count({ where: { name: "attention" } })).toBe(1);
  });

  it("keeps a tag that another note still carries", async () => {
    const first = await makeNote("First note");
    const second = await createNote({ userId,
      readingItemId: first.readingItemId,
      body: "Second note",
    });

    await syncNoteTags(first.id, userId, ["memory"]);
    await syncNoteTags(second.id, userId, ["memory"]);
    await syncNoteTags(first.id, userId, []);

    expect(await prisma.tag.count({ where: { name: "memory" } })).toBe(1);
  });
});

describe("per-user tag scoping", () => {
  it("lets two users each have a tag with the same name", async () => {
    const otherUserId = (
      await createUser({ email: "other@example.com", password: "password123" })
    ).id;

    const mine = await makeNote();
    const theirGoal = await createGoal({
      userId: otherUserId,
      title: "Learn Rust",
    });
    const theirItem = await createReadingItem({
      userId: otherUserId,
      goalId: theirGoal.id,
      title: "The Rust Book",
    });
    const theirs = await createNote({
      userId: otherUserId,
      readingItemId: theirItem.id,
      body: "Their note",
    });

    await syncNoteTags(mine.id, userId, ["rust"]);
    await syncNoteTags(theirs.id, otherUserId, ["rust"]);

    const tags = await prisma.tag.findMany({ where: { name: "rust" } });
    expect(tags).toHaveLength(2);
    expect(tags.map((tag) => tag.userId).sort()).toEqual(
      [userId, otherUserId].sort(),
    );
  });

  it("does not prune another user's tag of the same name", async () => {
    const otherUserId = (
      await createUser({ email: "other@example.com", password: "password123" })
    ).id;

    const theirGoal = await createGoal({
      userId: otherUserId,
      title: "Learn Rust",
    });
    const theirItem = await createReadingItem({
      userId: otherUserId,
      goalId: theirGoal.id,
      title: "The Rust Book",
    });
    const theirs = await createNote({
      userId: otherUserId,
      readingItemId: theirItem.id,
      body: "Their note",
    });
    await syncNoteTags(theirs.id, otherUserId, ["rust"]);

    const mine = await makeNote();
    await syncNoteTags(mine.id, userId, ["rust"]);
    // Retagging my note away from "rust" prunes my orphan, not theirs.
    await syncNoteTags(mine.id, userId, []);

    const remaining = await prisma.tag.findMany({ where: { name: "rust" } });
    expect(remaining).toHaveLength(1);
    expect(remaining[0].userId).toBe(otherUserId);
  });
});
