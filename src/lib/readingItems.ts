import { prisma } from "@/lib/prisma";
import type { Progress } from "@/generated/prisma/client";

export async function createReadingItem(data: {
  goalId: string;
  title: string;
  author?: string;
  url?: string;
  note?: string;
}) {
  if (!data.title.trim()) {
    throw new Error("Reading item title is required");
  }

  const maxPosition = await prisma.readingItem.aggregate({
    where: { goalId: data.goalId },
    _max: { position: true },
  });
  const position = (maxPosition._max.position ?? -1) + 1;

  return prisma.readingItem.create({
    data: {
      goalId: data.goalId,
      title: data.title,
      author: data.author,
      url: data.url,
      note: data.note,
      position,
    },
  });
}

export function updateReadingItemProgress(id: string, progress: Progress) {
  return prisma.readingItem.update({
    where: { id },
    data: { progress },
  });
}

export function deferReadingItem(id: string) {
  return prisma.readingItem.update({
    where: { id },
    data: { deferred: true },
  });
}

export function restoreReadingItem(id: string) {
  return prisma.readingItem.update({
    where: { id },
    data: { deferred: false },
  });
}

export async function moveReadingItemUp(id: string) {
  return moveReadingItem(id, "up");
}

export async function moveReadingItemDown(id: string) {
  return moveReadingItem(id, "down");
}

async function moveReadingItem(id: string, direction: "up" | "down") {
  const item = await prisma.readingItem.findUniqueOrThrow({ where: { id } });

  const neighbor = await prisma.readingItem.findFirst({
    where: {
      goalId: item.goalId,
      deferred: item.deferred,
      position:
        direction === "up" ? { lt: item.position } : { gt: item.position },
    },
    orderBy:
      direction === "up"
        ? [{ position: "desc" }, { createdAt: "desc" }]
        : [{ position: "asc" }, { createdAt: "asc" }],
  });

  if (!neighbor) {
    return item;
  }

  return prisma.$transaction(async (tx) => {
    await tx.readingItem.update({
      where: { id: item.id },
      data: { position: neighbor.position },
    });
    await tx.readingItem.update({
      where: { id: neighbor.id },
      data: { position: item.position },
    });
    return tx.readingItem.findUniqueOrThrow({ where: { id: item.id } });
  });
}

export function updateReadingItem(
  id: string,
  data: { title?: string; author?: string; url?: string; note?: string },
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
