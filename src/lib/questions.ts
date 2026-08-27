import { prisma } from "@/lib/prisma";
import { requireGoalOwner } from "@/lib/goals";

// Questions have no `userId` of their own — ownership comes from the goal they
// hang off. Same "not found" message as a genuinely missing row so another
// user's question ids can't be probed for existence.
export async function requireQuestionOwner(id: string, userId: string) {
  const question = await prisma.question.findFirst({
    where: { id, goal: { userId } },
  });

  if (!question) {
    throw new Error("Question not found");
  }

  return question;
}

export async function createQuestion(
  goalId: string,
  userId: string,
  text: string,
) {
  if (!text.trim()) {
    throw new Error("Question text is required");
  }

  await requireGoalOwner(goalId, userId);

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

export function listQuestionsForGoal(goalId: string, userId: string) {
  return prisma.question.findMany({
    where: { goalId, goal: { userId } },
    orderBy: { order: "asc" },
  });
}

export async function deleteQuestion(id: string, userId: string) {
  await requireQuestionOwner(id, userId);

  return prisma.question.delete({ where: { id } });
}

// Unlike `syncNoteTags`, questions are never created here — they belong to the
// goal and are added from the goal page, so the note form only ever connects
// existing ids. Nothing is pruned either: a question with no notes is the
// "unanswered" state we want to show, not an orphan to clean up.
export async function syncNoteQuestions(
  noteId: string,
  userId: string,
  questionIds: string[],
) {
  const ids = [...new Set(questionIds)];

  // Filtering by owner rather than erroring: a forged question id from another
  // user is simply not connected, so a hand-crafted form can't link a note to
  // someone else's question.
  const owned = await prisma.question.findMany({
    where: { id: { in: ids }, goal: { userId } },
    select: { id: true },
  });

  await prisma.note.update({
    where: { id: noteId },
    data: {
      questions: {
        set: owned.map(({ id }) => ({ id })),
      },
    },
  });
}
