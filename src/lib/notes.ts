import { prisma } from "@/lib/prisma";
import { syncNoteQuestions } from "@/lib/questions";
import { pruneOrphanTags, syncNoteTags } from "@/lib/tags";

export async function createNote(data: {
  readingItemId: string;
  body: string;
  location?: string;
  tags?: string[];
  questionIds?: string[];
}) {
  if (!data.body.trim()) {
    throw new Error("Note body is required");
  }

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
    await syncNoteTags(note.id, data.tags);
  }

  if (data.questionIds && data.questionIds.length > 0) {
    await syncNoteQuestions(note.id, data.questionIds);
  }

  return prisma.note.findUniqueOrThrow({
    where: { id: note.id },
    include: { tags: true, questions: true },
  });
}

export function getNotesForItem(readingItemId: string) {
  return prisma.note.findMany({
    where: { readingItemId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { tags: true, questions: true },
  });
}

export async function updateNote(
  id: string,
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
    await syncNoteTags(id, data.tags);
  }

  if (data.questionIds !== undefined) {
    await syncNoteQuestions(id, data.questionIds);
  }

  return prisma.note.findUniqueOrThrow({
    where: { id },
    include: { tags: true, questions: true },
  });
}

export async function deleteNote(id: string) {
  const note = await prisma.note.delete({
    where: { id },
    include: { tags: true, questions: true },
  });

  await pruneOrphanTags();

  return note;
}

export function getNotesByTag(tagName: string) {
  return prisma.note.findMany({
    where: { tags: { some: { name: tagName } } },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { tags: true, questions: true, readingItem: { include: { goal: true } } },
  });
}

export function listTags() {
  return prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { notes: true } } },
  });
}
