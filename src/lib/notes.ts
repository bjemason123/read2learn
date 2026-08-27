import { prisma } from "@/lib/prisma";
import { syncNoteQuestions } from "@/lib/questions";
import { pruneOrphanTags, syncNoteTags } from "@/lib/tags";
import { requireReadingItemOwner } from "@/lib/readingItems";

// Notes have no `userId` of their own — ownership is inherited through
// readingItem → goal → user. Same "not found" message as a genuinely missing
// row so another user's note ids can't be probed for existence.
export async function requireNoteOwner(id: string, userId: string) {
  const note = await prisma.note.findFirst({
    where: { id, readingItem: { goal: { userId } } },
  });

  if (!note) {
    throw new Error("Note not found");
  }

  return note;
}

export async function createNote(data: {
  readingItemId: string;
  userId: string;
  body: string;
  location?: string;
  tags?: string[];
  questionIds?: string[];
}) {
  if (!data.body.trim()) {
    throw new Error("Note body is required");
  }

  await requireReadingItemOwner(data.readingItemId, data.userId);

  const location = data.location?.trim() ? data.location.trim() : null;

  const note = await prisma.$transaction(async (tx) => {
    const maxOrder = await tx.note.aggregate({
      where: { readingItemId: data.readingItemId },
      _max: { order: true },
    });

    return tx.note.create({
      data: {
        readingItemId: data.readingItemId,
        body: data.body,
        location,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });
  });

  if (data.tags && data.tags.length > 0) {
    await syncNoteTags(note.id, data.userId, data.tags);
  }

  if (data.questionIds && data.questionIds.length > 0) {
    await syncNoteQuestions(note.id, data.userId, data.questionIds);
  }

  return prisma.note.findUniqueOrThrow({
    where: { id: note.id },
    include: { tags: true, questions: true },
  });
}

export function getNotesForItem(readingItemId: string, userId: string) {
  return prisma.note.findMany({
    where: { readingItemId, readingItem: { goal: { userId } } },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { tags: true, questions: true },
  });
}

export async function updateNote(
  id: string,
  userId: string,
  data: {
    body?: string;
    location?: string;
    tags?: string[];
    questionIds?: string[];
  },
) {
  if (data.body !== undefined && !data.body.trim()) {
    throw new Error("Note body is required");
  }

  await requireNoteOwner(id, userId);

  const location =
    data.location !== undefined
      ? data.location.trim()
        ? data.location.trim()
        : null
      : undefined;

  await prisma.note.update({
    where: { id },
    data: { body: data.body, location },
  });

  if (data.tags !== undefined) {
    await syncNoteTags(id, userId, data.tags);
  }

  if (data.questionIds !== undefined) {
    await syncNoteQuestions(id, userId, data.questionIds);
  }

  return prisma.note.findUniqueOrThrow({
    where: { id },
    include: { tags: true, questions: true },
  });
}

export async function deleteNote(id: string, userId: string) {
  await requireNoteOwner(id, userId);

  const note = await prisma.note.delete({
    where: { id },
    include: { tags: true, questions: true },
  });

  await pruneOrphanTags(userId);

  return note;
}

export function getNotesByTag(tagName: string, userId: string) {
  return prisma.note.findMany({
    where: {
      readingItem: { goal: { userId } },
      tags: { some: { name: tagName, userId } },
    },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { tags: true, questions: true, readingItem: { include: { goal: true } } },
  });
}

export function listTags(userId: string) {
  return prisma.tag.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: { _count: { select: { notes: true } } },
  });
}
