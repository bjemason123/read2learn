import { prisma } from "@/lib/prisma";

export function recordEvent(data: {
  type: string;
  goalId?: string;
  readingItemId?: string;
}) {
  return prisma.event.create({
    data: {
      type: data.type,
      goalId: data.goalId,
      readingItemId: data.readingItemId,
    },
  });
}
