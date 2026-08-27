import { beforeEach, describe, expect, it, vi } from "vitest";

// `revalidatePath` requires a Next.js request scope, which does not exist when
// server actions are called directly from vitest.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// Server actions read the caller's id from the session cookie, which needs a
// Next.js request scope. Mock it to the user each test creates.
const session = vi.hoisted(() => ({ userId: "" }));
vi.mock("@/lib/session", () => ({
  requireUserId: vi.fn(async () => session.userId),
}));


import { prisma } from "@/lib/prisma";
import { createUser } from "@/lib/users";
import { createGoal } from "@/lib/goals";
import { createReadingItem } from "@/lib/readingItems";
import { createNote } from "@/lib/notes";
import {
  createNoteAction,
  deleteNoteAction,
  updateNoteAction,
} from "./actions";

let userId: string;

beforeEach(async () => {
  await prisma.event.deleteMany();
  await prisma.note.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.readingItem.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.user.deleteMany();

  userId = (
    await createUser({ email: "reader@example.com", password: "password123" })
  ).id;
  session.userId = userId;
});

async function makeItem() {
  const goal = await createGoal({ userId, title: "Learn Rust" });
  const item = await createReadingItem({ userId,
    goalId: goal.id,
    title: "The Rust Book",
  });
  return { goal, item };
}

function formDataOf(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

describe("createNoteAction", () => {
  it("creates a note and records a note_created event", async () => {
    const { goal, item } = await makeItem();

    const result = await createNoteAction(
      item.id,
      goal.id,
      {},
      formDataOf({ body: "Ownership is the core idea", location: "Chapter 3" }),
    );

    expect(result).toEqual({ ok: true });

    const note = await prisma.note.findFirstOrThrow({
      where: { readingItemId: item.id },
    });
    expect(note.body).toBe("Ownership is the core idea");
    expect(note.location).toBe("Chapter 3");

    const event = await prisma.event.findFirst({
      where: { type: "note_created", readingItemId: item.id, goalId: goal.id },
    });
    expect(event).not.toBeNull();
  });

  it("round-trips comma-separated tags from FormData", async () => {
    const { goal, item } = await makeItem();

    await createNoteAction(
      item.id,
      goal.id,
      {},
      formDataOf({ body: "A note", tags: "ai, memory" }),
    );

    const note = await prisma.note.findFirstOrThrow({
      where: { readingItemId: item.id },
      include: { tags: true },
    });
    expect(note.tags.map((tag) => tag.name).sort()).toEqual(["ai", "memory"]);
  });

  it("returns an error instead of throwing when the body is empty", async () => {
    const { goal, item } = await makeItem();

    const result = await createNoteAction(
      item.id,
      goal.id,
      {},
      formDataOf({ body: "   " }),
    );

    expect(result).toEqual({ error: "Note body is required" });
    expect(await prisma.note.count()).toBe(0);
    expect(await prisma.event.count({ where: { type: "note_created" } })).toBe(
      0,
    );
  });

  it("coerces an empty-string location to null", async () => {
    const { goal, item } = await makeItem();

    await createNoteAction(
      item.id,
      goal.id,
      {},
      formDataOf({ body: "A note", location: "" }),
    );

    const note = await prisma.note.findFirstOrThrow({
      where: { readingItemId: item.id },
    });
    expect(note.location).toBeNull();
  });
});

describe("updateNoteAction", () => {
  it("updates a note and records a note_updated event", async () => {
    const { goal, item } = await makeItem();
    const note = await createNote({ userId, readingItemId: item.id, body: "Original" });

    const result = await updateNoteAction(
      note.id,
      item.id,
      goal.id,
      {},
      formDataOf({ body: "Revised", location: "Chapter 9" }),
    );

    expect(result).toEqual({ ok: true });

    const updated = await prisma.note.findUniqueOrThrow({
      where: { id: note.id },
    });
    expect(updated.body).toBe("Revised");
    expect(updated.location).toBe("Chapter 9");

    const event = await prisma.event.findFirst({
      where: { type: "note_updated", readingItemId: item.id, goalId: goal.id },
    });
    expect(event).not.toBeNull();
  });

  it("returns an error instead of throwing when the body is empty", async () => {
    const { goal, item } = await makeItem();
    const note = await createNote({ userId, readingItemId: item.id, body: "Original" });

    const result = await updateNoteAction(
      note.id,
      item.id,
      goal.id,
      {},
      formDataOf({ body: "" }),
    );

    expect(result).toEqual({ error: "Note body is required" });

    const unchanged = await prisma.note.findUniqueOrThrow({
      where: { id: note.id },
    });
    expect(unchanged.body).toBe("Original");
  });

  it("replaces tags from FormData and prunes the orphaned tag", async () => {
    const { goal, item } = await makeItem();
    const note = await createNote({ userId,
      readingItemId: item.id,
      body: "A note",
      tags: ["memory"],
    });

    await updateNoteAction(
      note.id,
      item.id,
      goal.id,
      {},
      formDataOf({ body: "A note", tags: "attention" }),
    );

    const updated = await prisma.note.findUniqueOrThrow({
      where: { id: note.id },
      include: { tags: true },
    });
    expect(updated.tags.map((tag) => tag.name)).toEqual(["attention"]);
    expect(await prisma.tag.count({ where: { name: "memory" } })).toBe(0);
  });
});

describe("deleteNoteAction", () => {
  it("deletes a note and records a note_deleted event", async () => {
    const { goal, item } = await makeItem();
    const note = await createNote({ userId, readingItemId: item.id, body: "A note" });

    const result = await deleteNoteAction(note.id, item.id, goal.id);

    expect(result).toEqual({ ok: true });
    expect(await prisma.note.count()).toBe(0);

    const event = await prisma.event.findFirst({
      where: { type: "note_deleted", readingItemId: item.id, goalId: goal.id },
    });
    expect(event).not.toBeNull();
  });

  it("returns an error instead of throwing for an unknown note", async () => {
    const { goal, item } = await makeItem();

    const result = await deleteNoteAction("does-not-exist", item.id, goal.id);

    expect(result.error).toBeTruthy();
    expect(await prisma.event.count({ where: { type: "note_deleted" } })).toBe(
      0,
    );
  });
});
