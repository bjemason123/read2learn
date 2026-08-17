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

export function parseQuestions(questions: string | null | undefined): string[] {
  if (!questions) return [];
  return questions
    .split("\n")
    .map((q) => q.trim())
    .filter((q) => q.length > 0);
}

export async function addQuestion(id: string, question: string) {
  if (!question.trim()) {
    throw new Error("Question text is required");
  }

  const goal = await prisma.goal.findUniqueOrThrow({ where: { id } });
  const questions = [...parseQuestions(goal.questions), question.trim()];

  return prisma.goal.update({
    where: { id },
    data: { questions: questions.join("\n") },
  });
}

export async function deleteQuestion(id: string, index: number) {
  const goal = await prisma.goal.findUniqueOrThrow({ where: { id } });
  const questions = parseQuestions(goal.questions);
  questions.splice(index, 1);

  return prisma.goal.update({
    where: { id },
    data: { questions: questions.length > 0 ? questions.join("\n") : null },
  });
}
