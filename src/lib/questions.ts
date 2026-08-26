import { prisma } from "@/lib/prisma";

export async function createQuestion(goalId: string, text: string) {
  if (!text.trim()) {
    throw new Error("Question text is required");
  }

  const maxOrder = await prisma.question.aggregate({
    where: { goalId },
    _max: { order: true },
  });

  return prisma.question.create({
    data: {
      goalId,
      text: text.trim(),
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });
}

export function listQuestionsForGoal(goalId: string) {
  return prisma.question.findMany({
    where: { goalId },
    orderBy: { order: "asc" },
  });
}

export function deleteQuestion(id: string) {
  return prisma.question.delete({ where: { id } });
}

// Unlike `syncNoteTags`, questions are never created here — they belong to the
// goal and are added from the goal page, so the note form only ever connects
// existing ids. Nothing is pruned either: a question with no notes is the
// "unanswered" state we want to show, not an orphan to clean up.
export async function syncNoteQuestions(noteId: string, questionIds: string[]) {
  await prisma.note.update({
    where: { id: noteId },
    data: {
      questions: {
        set: [...new Set(questionIds)].map((id) => ({ id })),
      },
    },
  });
}
