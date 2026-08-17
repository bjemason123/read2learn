import { prisma } from "@/lib/prisma";

export function listGoals() {
  return prisma.goal.findMany({
    include: { readingItems: true },
    orderBy: { createdAt: "desc" },
  });
}

export function getGoal(id: string) {
  return prisma.goal.findUnique({
    where: { id },
    include: { readingItems: true },
  });
}

export function createGoal(data: {
  title: string;
  description?: string;
  questions?: string;
}) {
  if (!data.title.trim()) {
    throw new Error("Goal title is required");
  }

  return prisma.goal.create({
    data: {
      title: data.title,
      description: data.description,
      questions: data.questions,
    },
  });
}

export function updateGoal(
  id: string,
  data: { title?: string; description?: string; questions?: string },
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
