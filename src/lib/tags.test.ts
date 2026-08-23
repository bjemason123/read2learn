import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createGoal } from "@/lib/goals";
import { createReadingItem } from "@/lib/readingItems";
import { createNote } from "@/lib/notes";
import { normalizeTagName, syncNoteTags } from "@/lib/tags";

beforeEach(async () => {
  await prisma.note.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.readingItem.deleteMany();
  await prisma.goal.deleteMany();
});

async function makeNote(body = "A note") {
  const goal = await createGoal({ title: "Learn Rust" });
  const item = await createReadingItem({
    goalId: goal.id,
    title: "The Rust Book",
  });
  return createNote({ readingItemId: item.id, body });
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

    await syncNoteTags(note.id, ["ai", "AI", "Ai"]);

    const tags = await prisma.tag.findMany();
    expect(tags.map((tag) => tag.name)).toEqual(["ai"]);
  });

  it("ignores whitespace-only entries rather than erroring", async () => {
    const note = await makeNote();

    await syncNoteTags(note.id, ["memory", "   ", ""]);

    const tags = await prisma.tag.findMany();
    expect(tags.map((tag) => tag.name)).toEqual(["memory"]);
  });

  it("connects an existing tag instead of creating a duplicate", async () => {
    const first = await makeNote("First note");
    const second = await createNote({
      readingItemId: first.readingItemId,
      body: "Second note",
    });

    await syncNoteTags(first.id, ["memory"]);
    await syncNoteTags(second.id, ["memory"]);

    const tags = await prisma.tag.findMany({ include: { notes: true } });
    expect(tags).toHaveLength(1);
    expect(tags[0].notes.map((note) => note.id).sort()).toEqual(
      [first.id, second.id].sort(),
    );
  });

  it("prunes a tag once its last note is retagged away from it", async () => {
    const note = await makeNote();

    await syncNoteTags(note.id, ["memory"]);
    expect(await prisma.tag.count({ where: { name: "memory" } })).toBe(1);

    await syncNoteTags(note.id, ["attention"]);

    expect(await prisma.tag.count({ where: { name: "memory" } })).toBe(0);
    expect(await prisma.tag.count({ where: { name: "attention" } })).toBe(1);
  });

  it("keeps a tag that another note still carries", async () => {
    const first = await makeNote("First note");
    const second = await createNote({
      readingItemId: first.readingItemId,
      body: "Second note",
    });

    await syncNoteTags(first.id, ["memory"]);
    await syncNoteTags(second.id, ["memory"]);
    await syncNoteTags(first.id, []);

    expect(await prisma.tag.count({ where: { name: "memory" } })).toBe(1);
  });
});
