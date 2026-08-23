import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createGoal } from "@/lib/goals";
import { createReadingItem, deleteReadingItem } from "@/lib/readingItems";
import {
  createNote,
  deleteNote,
  getNotesByTag,
  getNotesForItem,
  listTags,
  updateNote,
} from "@/lib/notes";

beforeEach(async () => {
  await prisma.note.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.readingItem.deleteMany();
  await prisma.goal.deleteMany();
});

async function makeItem(title = "The Rust Book") {
  const goal = await createGoal({ title: "Learn Rust" });
  const item = await createReadingItem({ goalId: goal.id, title });
  return { goal, item };
}

describe("createNote", () => {
  it("creates a note under a reading item", async () => {
    const { item } = await makeItem();

    const note = await createNote({
      readingItemId: item.id,
      body: "Ownership is the core idea",
    });

    expect(note.body).toBe("Ownership is the core idea");
    expect(note.readingItemId).toBe(item.id);
    expect(note.location).toBeNull();
    expect(note.tags).toEqual([]);
  });

  it("assigns increasing order values within an item", async () => {
    const { item } = await makeItem();

    const first = await createNote({ readingItemId: item.id, body: "First" });
    const second = await createNote({ readingItemId: item.id, body: "Second" });
    const third = await createNote({ readingItemId: item.id, body: "Third" });

    expect([first.order, second.order, third.order]).toEqual([0, 1, 2]);
  });

  it("numbers order independently per reading item", async () => {
    const { goal, item } = await makeItem();
    const other = await createReadingItem({
      goalId: goal.id,
      title: "Another book",
    });

    await createNote({ readingItemId: item.id, body: "First" });
    const otherFirst = await createNote({
      readingItemId: other.id,
      body: "Other first",
    });

    expect(otherFirst.order).toBe(0);
  });

  it("throws when the body is empty", async () => {
    const { item } = await makeItem();

    await expect(
      createNote({ readingItemId: item.id, body: "" }),
    ).rejects.toThrow("Note body is required");
  });

  it("throws when the body is whitespace only", async () => {
    const { item } = await makeItem();

    await expect(
      createNote({ readingItemId: item.id, body: "   " }),
    ).rejects.toThrow("Note body is required");
  });

  it("coerces an empty-string location to null", async () => {
    const { item } = await makeItem();

    const note = await createNote({
      readingItemId: item.id,
      body: "A note",
      location: "   ",
    });

    expect(note.location).toBeNull();
  });

  it("trims a provided location", async () => {
    const { item } = await makeItem();

    const note = await createNote({
      readingItemId: item.id,
      body: "A note",
      location: "  Chapter 3  ",
    });

    expect(note.location).toBe("Chapter 3");
  });

  it("attaches normalized tags", async () => {
    const { item } = await makeItem();

    const note = await createNote({
      readingItemId: item.id,
      body: "A note",
      tags: ["Memory", "memory", " async "],
    });

    expect(note.tags.map((tag) => tag.name).sort()).toEqual([
      "async",
      "memory",
    ]);
  });
});

describe("getNotesForItem", () => {
  it("returns notes ordered by order then createdAt, with tags", async () => {
    const { item } = await makeItem();

    await createNote({
      readingItemId: item.id,
      body: "First",
      tags: ["memory"],
    });
    await createNote({ readingItemId: item.id, body: "Second" });

    const notes = await getNotesForItem(item.id);

    expect(notes.map((note) => note.body)).toEqual(["First", "Second"]);
    expect(notes[0].tags.map((tag) => tag.name)).toEqual(["memory"]);
  });

  it("breaks an order tie by createdAt", async () => {
    const { item } = await makeItem();

    const first = await prisma.note.create({
      data: {
        readingItemId: item.id,
        body: "Earlier",
        order: 0,
        createdAt: new Date("2026-01-01T00:00:00Z"),
      },
    });
    const second = await prisma.note.create({
      data: {
        readingItemId: item.id,
        body: "Later",
        order: 0,
        createdAt: new Date("2026-01-02T00:00:00Z"),
      },
    });

    const notes = await getNotesForItem(item.id);

    expect(notes.map((note) => note.id)).toEqual([first.id, second.id]);
  });
});

describe("updateNote", () => {
  it("updates the body", async () => {
    const { item } = await makeItem();
    const note = await createNote({ readingItemId: item.id, body: "Original" });

    const updated = await updateNote(note.id, { body: "Revised" });

    expect(updated.body).toBe("Revised");
  });

  it("throws when the body is set to empty", async () => {
    const { item } = await makeItem();
    const note = await createNote({ readingItemId: item.id, body: "Original" });

    await expect(updateNote(note.id, { body: "  " })).rejects.toThrow(
      "Note body is required",
    );
  });

  it("coerces an empty-string location to null", async () => {
    const { item } = await makeItem();
    const note = await createNote({
      readingItemId: item.id,
      body: "A note",
      location: "Chapter 3",
    });

    const updated = await updateNote(note.id, { location: "" });

    expect(updated.location).toBeNull();
  });

  it("leaves omitted fields untouched", async () => {
    const { item } = await makeItem();
    const note = await createNote({
      readingItemId: item.id,
      body: "A note",
      location: "Chapter 3",
      tags: ["memory"],
    });

    const updated = await updateNote(note.id, {});

    expect(updated.body).toBe("A note");
    expect(updated.location).toBe("Chapter 3");
    expect(updated.tags.map((tag) => tag.name)).toEqual(["memory"]);
  });

  it("replaces tags and prunes the tag it was retagged away from", async () => {
    const { item } = await makeItem();
    const note = await createNote({
      readingItemId: item.id,
      body: "A note",
      tags: ["memory"],
    });

    const updated = await updateNote(note.id, { tags: ["attention"] });

    expect(updated.tags.map((tag) => tag.name)).toEqual(["attention"]);
    expect(await prisma.tag.count({ where: { name: "memory" } })).toBe(0);
  });

  it("clears all tags when given an empty array", async () => {
    const { item } = await makeItem();
    const note = await createNote({
      readingItemId: item.id,
      body: "A note",
      tags: ["memory"],
    });

    const updated = await updateNote(note.id, { tags: [] });

    expect(updated.tags).toEqual([]);
    expect(await prisma.tag.count()).toBe(0);
  });
});

describe("deleteNote", () => {
  it("deletes the note", async () => {
    const { item } = await makeItem();
    const note = await createNote({ readingItemId: item.id, body: "A note" });

    await deleteNote(note.id);

    expect(await prisma.note.count()).toBe(0);
  });

  it("prunes a tag whose last note was deleted", async () => {
    const { item } = await makeItem();
    const note = await createNote({
      readingItemId: item.id,
      body: "A note",
      tags: ["memory"],
    });

    await deleteNote(note.id);

    expect(await prisma.tag.count({ where: { name: "memory" } })).toBe(0);
  });

  it("keeps a tag another note still carries", async () => {
    const { item } = await makeItem();
    const first = await createNote({
      readingItemId: item.id,
      body: "First",
      tags: ["memory"],
    });
    await createNote({
      readingItemId: item.id,
      body: "Second",
      tags: ["memory"],
    });

    await deleteNote(first.id);

    expect(await prisma.tag.count({ where: { name: "memory" } })).toBe(1);
  });
});

describe("cascade delete", () => {
  it("deletes an item's notes when the reading item is deleted", async () => {
    const { item } = await makeItem();
    await createNote({ readingItemId: item.id, body: "First" });
    await createNote({ readingItemId: item.id, body: "Second" });

    await deleteReadingItem(item.id);

    expect(await prisma.note.count({ where: { readingItemId: item.id } })).toBe(
      0,
    );
  });
});

describe("getNotesByTag", () => {
  it("returns notes carrying the tag with their item and goal", async () => {
    const { goal, item } = await makeItem();
    await createNote({
      readingItemId: item.id,
      body: "Tagged",
      tags: ["memory"],
    });
    await createNote({ readingItemId: item.id, body: "Untagged" });

    const notes = await getNotesByTag("memory");

    expect(notes).toHaveLength(1);
    expect(notes[0].body).toBe("Tagged");
    expect(notes[0].readingItem.title).toBe("The Rust Book");
    expect(notes[0].readingItem.goal.id).toBe(goal.id);
  });

  it("returns an empty array for an unknown tag", async () => {
    expect(await getNotesByTag("nonexistent")).toEqual([]);
  });
});

describe("listTags", () => {
  it("lists tags alphabetically with note counts", async () => {
    const { item } = await makeItem();
    await createNote({
      readingItemId: item.id,
      body: "First",
      tags: ["memory", "async"],
    });
    await createNote({
      readingItemId: item.id,
      body: "Second",
      tags: ["memory"],
    });

    const tags = await listTags();

    expect(tags.map((tag) => tag.name)).toEqual(["async", "memory"]);
    expect(tags.map((tag) => tag._count.notes)).toEqual([1, 2]);
  });
});
