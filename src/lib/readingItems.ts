import { prisma } from "@/lib/prisma";
import type { Progress } from "@/generated/prisma/client";

export function createReadingItem(data: {
  goalId: string;
  title: string;
  url?: string;
  note?: string;
}) {
  if (!data.title.trim()) {
    throw new Error("Reading item title is required");
  }

  return prisma.readingItem.create({
    data: {
      goalId: data.goalId,
      title: data.title,
      url: data.url,
      note: data.note,
    },
  });
}

export function updateReadingItemProgress(id: string, progress: Progress) {
  return prisma.readingItem.update({
    where: { id },
    data: { progress },
  });
}

export function updateReadingItem(
  id: string,
  data: { title?: string; url?: string; note?: string },
) {
  if (data.title !== undefined && !data.title.trim()) {
    throw new Error("Reading item title is required");
  }

  return prisma.readingItem.update({
    where: { id },
    data,
  });
}

export function deleteReadingItem(id: string) {
  return prisma.readingItem.delete({ where: { id } });
}
