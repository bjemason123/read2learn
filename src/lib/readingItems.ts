import { prisma } from "@/lib/prisma";
import { requireGoalOwner } from "@/lib/goals";
import type { ItemType, Progress } from "@/generated/prisma/client";

// Reading items have no `userId` of their own — ownership comes from the goal
// they belong to. Same "not found" message as a genuinely missing row so
// another user's item ids can't be probed for existence.
export async function requireReadingItemOwner(id: string, userId: string) {
  const item = await prisma.readingItem.findFirst({
    where: { id, goal: { userId } },
  });

  if (!item) {
    throw new Error("Reading item not found");
  }

  return item;
}

export async function createReadingItem(data: {
  goalId: string;
  userId: string;
  title: string;
  author?: string;
  url?: string;
  note?: string;
  type?: ItemType;
}) {
  if (!data.title.trim()) {
    throw new Error("Reading item title is required");
  }

  await requireGoalOwner(data.goalId, data.userId);

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
      type: data.type,
      position,
    },
  });
}

export async function updateReadingItemProgress(
  id: string,
  userId: string,
  progress: Progress,
) {
  await requireReadingItemOwner(id, userId);

  return prisma.readingItem.update({
    where: { id },
    data: { progress },
  });
}

export async function deferReadingItem(id: string, userId: string) {
  await requireReadingItemOwner(id, userId);

  return prisma.readingItem.update({
    where: { id },
    data: { deferred: true },
  });
}

export async function restoreReadingItem(id: string, userId: string) {
  await requireReadingItemOwner(id, userId);

  return prisma.readingItem.update({
    where: { id },
    data: { deferred: false },
  });
}

export async function moveReadingItemUp(id: string, userId: string) {
  return moveReadingItem(id, userId, "up");
}

export async function moveReadingItemDown(id: string, userId: string) {
  return moveReadingItem(id, userId, "down");
}

async function moveReadingItem(
  id: string,
  userId: string,
  direction: "up" | "down",
) {
  const item = await requireReadingItemOwner(id, userId);

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

// Reassigns an item to another goal the same user owns. The item is appended
// to the end of the destination goal's list, the same way `createReadingItem`
// picks a position for a brand new item.
export async function moveReadingItemToGoal(
  id: string,
  userId: string,
  newGoalId: string,
) {
  const item = await requireReadingItemOwner(id, userId);
  await requireGoalOwner(newGoalId, userId);

  // Re-appending an item to its own list would silently reorder it.
  if (item.goalId === newGoalId) {
    return item;
  }

  const maxPosition = await prisma.readingItem.aggregate({
    where: { goalId: newGoalId },
    _max: { position: true },
  });
  const position = (maxPosition._max.position ?? -1) + 1;

  return prisma.readingItem.update({
    where: { id },
    data: { goalId: newGoalId, position },
  });
}

export async function updateReadingItem(
  id: string,
  userId: string,
  data: {
    title?: string;
    author?: string;
    url?: string;
    note?: string;
    type?: ItemType;
  },
) {
  if (data.title !== undefined && !data.title.trim()) {
    throw new Error("Reading item title is required");
  }

  await requireReadingItemOwner(id, userId);

  return prisma.readingItem.update({
    where: { id },
    data,
  });
}

export function getReadingItem(id: string, userId: string) {
  return prisma.readingItem.findFirst({ where: { id, goal: { userId } } });
}

export async function deleteReadingItem(id: string, userId: string) {
  await requireReadingItemOwner(id, userId);

  return prisma.readingItem.delete({ where: { id } });
}
