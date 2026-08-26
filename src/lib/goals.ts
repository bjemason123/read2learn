import { prisma } from "@/lib/prisma";
import type { Progress } from "@/generated/prisma/client";

export function listGoals() {
  return prisma.goal.findMany({
    include: { readingItems: true },
    orderBy: { createdAt: "desc" },
  });
}

export function getGoal(id: string) {
  return prisma.goal.findUnique({
    where: { id },
    include: {
      readingItems: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
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
      questions: {
        create: questions.map((text, order) => ({ text, order })),
      },
    },
  });
}

export function updateGoal(
  id: string,
  data: { title?: string; description?: string },
) {
  if (data.title !== undefined && !data.title.trim()) {
    throw new Error("Goal title is required");
  }

  return prisma.goal.update({
    where: { id },
    data,
  });
}

export function deleteGoal(id: string) {
  return prisma.goal.delete({ where: { id } });
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
