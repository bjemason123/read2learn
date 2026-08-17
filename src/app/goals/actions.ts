"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createGoal, deleteGoal, updateGoal } from "@/lib/goals";
import { recordEvent } from "@/lib/events";

export async function createGoalAction(formData: FormData) {
  const title = String(formData.get("title") ?? "");
  const description = formData.get("description");
  const questions = formData.get("questions");

  const goal = await createGoal({
    title,
    description: description ? String(description) : undefined,
    questions: questions ? String(questions) : undefined,
  });

  await recordEvent({ type: "goal_created", goalId: goal.id });

  revalidatePath("/");
  redirect(`/goals/${goal.id}`);
}

export async function updateGoalAction(id: string, formData: FormData) {
  const title = formData.get("title");
  const description = formData.get("description");
  const questions = formData.get("questions");

  await updateGoal(id, {
    title: title !== null ? String(title) : undefined,
    description: description !== null ? String(description) : undefined,
    questions: questions !== null ? String(questions) : undefined,
  });

  await recordEvent({ type: "goal_updated", goalId: id });

  revalidatePath("/");
  revalidatePath(`/goals/${id}`);
}

export async function deleteGoalAction(id: string) {
  await recordEvent({ type: "goal_deleted", goalId: id });
  await deleteGoal(id);

  revalidatePath("/");
  redirect("/");
}
