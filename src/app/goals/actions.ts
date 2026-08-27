"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createGoal, deleteGoal, parseQuestions, updateGoal } from "@/lib/goals";
import { createQuestion, deleteQuestion } from "@/lib/questions";
import { recordEvent } from "@/lib/events";
import { requireUserId } from "@/lib/session";

export async function createGoalAction(formData: FormData) {
  const userId = await requireUserId();
  const title = String(formData.get("title") ?? "");
  const description = formData.get("description");
  const questions = formData.get("questions");

  const goal = await createGoal({
    userId,
    title,
    description: description ? String(description) : undefined,
    questions: parseQuestions(questions ? String(questions) : undefined),
  });

  await recordEvent({ type: "goal_created", goalId: goal.id, userId });

  revalidatePath("/");
  redirect(`/goals/${goal.id}`);
}

export async function updateGoalAction(id: string, formData: FormData) {
  const userId = await requireUserId();
  const title = formData.get("title");
  const description = formData.get("description");

  await updateGoal(id, userId, {
    title: title !== null ? String(title) : undefined,
    description: description !== null ? String(description) : undefined,
  });

  await recordEvent({ type: "goal_updated", goalId: id, userId });

  revalidatePath("/");
  revalidatePath(`/goals/${id}`);
}

export async function deleteGoalAction(id: string) {
  const userId = await requireUserId();

  await recordEvent({ type: "goal_deleted", goalId: id, userId });
  await deleteGoal(id, userId);

  revalidatePath("/");
  redirect("/");
}

export async function addQuestionAction(id: string, formData: FormData) {
  const userId = await requireUserId();
  const question = String(formData.get("question") ?? "");

  await createQuestion(id, userId, question);

  await recordEvent({ type: "goal_question_added", goalId: id, userId });

  revalidatePath(`/goals/${id}`);
}

export async function deleteQuestionAction(id: string, questionId: string) {
  const userId = await requireUserId();

  await deleteQuestion(questionId, userId);

  await recordEvent({ type: "goal_question_deleted", goalId: id, userId });

  revalidatePath(`/goals/${id}`);
}
