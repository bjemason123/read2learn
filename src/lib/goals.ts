import { prisma } from "@/lib/prisma";
import type { Progress } from "@/generated/prisma/client";

export function listGoals(userId: string) {
  return prisma.goal.findMany({
    where: { userId },
    include: { readingItems: true },
    orderBy: { createdAt: "desc" },
  });
}

export function getGoal(id: string, userId: string) {
  return prisma.goal.findFirst({
    where: { id, userId },
    include: {
      readingItems: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        // The print view renders each item's full notes, so the tags and the
        // questions a note answers come along rather than being fetched per note.
        include: {
          notes: {
            orderBy: [{ order: "asc" }, { createdAt: "asc" }],
            include: { tags: true, questions: true },
          },
        },
      },
      questions: {
        orderBy: { order: "asc" },
        // `readingItem` so the goal page can link each answering note back to
        // the item it was taken in without a second query.
        include: { notes: { include: { readingItem: true } } },
      },
    },
  });
}

export function createGoal(data: {
  title: string;
  description?: string;
  questions?: string[];
  userId: string;
}) {
  if (!data.title.trim()) {
    throw new Error("Goal title is required");
  }

  const questions = (data.questions ?? [])
    .map((text) => text.trim())
    .filter((text) => text.length > 0);

  return prisma.goal.create({
    data: {
      title: data.title,
      description: data.description,
      userId: data.userId,
      questions: {
        create: questions.map((text, order) => ({ text, order })),
      },
    },
  });
}

export async function updateGoal(
  id: string,
  userId: string,
  data: { title?: string; description?: string },
) {
  if (data.title !== undefined && !data.title.trim()) {
    throw new Error("Goal title is required");
  }

  await requireGoalOwner(id, userId);

  return prisma.goal.update({
    where: { id },
    data,
  });
}

export async function deleteGoal(id: string, userId: string) {
  await requireGoalOwner(id, userId);

  return prisma.goal.delete({ where: { id } });
}

// `update`/`delete` can only match on a unique field, so ownership is checked
// first. Someone hitting another user's goal id gets "Goal not found" — the
// same error as a genuinely missing goal, so ids can't be probed for existence.
export async function requireGoalOwner(id: string, userId: string) {
  const goal = await prisma.goal.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!goal) {
    throw new Error("Goal not found");
  }

  return goal;
}

// Questions are now their own rows; this only splits the one-per-line textarea
// on the new-goal form into the lines `createGoal` turns into Question rows.
export function parseQuestions(questions: string | null | undefined): string[] {
  if (!questions) return [];
  return questions
    .split("\n")
    .map((q) => q.trim())
    .filter((q) => q.length > 0);
}

export const PRINT_GROUP_LABELS = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  DONE: "Done",
  DEFERRED: "Deferred",
} as const;

export type PrintGroupKey = keyof typeof PRINT_GROUP_LABELS;

// The note shape the print view renders. Structural, not the generated Prisma
// model, so `groupReadingItemsForPrint` stays usable with plain test fixtures.
export type PrintNote = {
  id: string;
  body: string;
  location: string | null;
  order: number;
  tags: { id: string; name: string }[];
  questions: { id: string; text: string }[];
};

export type PrintReadingItem = {
  progress: Progress;
  deferred: boolean;
  notes: PrintNote[];
};

// Generic in the item so the whole row — including its `notes` — is carried
// through to the print view model unchanged; only `progress`/`deferred` are read.
export function groupReadingItemsForPrint<
  T extends { progress: Progress; deferred: boolean },
>(items: T[]): { key: PrintGroupKey; label: string; items: T[] }[] {
  const buckets: Record<PrintGroupKey, T[]> = {
    NOT_STARTED: [],
    IN_PROGRESS: [],
    DONE: [],
    DEFERRED: [],
  };

  for (const item of items) {
    if (item.deferred) {
      buckets.DEFERRED.push(item);
    } else {
      buckets[item.progress].push(item);
    }
  }

  return (Object.keys(PRINT_GROUP_LABELS) as PrintGroupKey[])
    .filter((key) => buckets[key].length > 0)
    .map((key) => ({ key, label: PRINT_GROUP_LABELS[key], items: buckets[key] }));
}
