"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createGoal, deleteGoal, updateGoal } from "@/lib/goals";

export async function createGoalAction(formData: FormData) {
  const title = String(formData.get("title") ?? "");
  const description = formData.get("description");

  const goal = await createGoal({
    title,
    description: description ? String(description) : undefined,
  });

  revalidatePath("/");
  redirect(`/goals/${goal.id}`);
}

export async function updateGoalAction(id: string, formData: FormData) {
  const title = formData.get("title");
  const description = formData.get("description");

  await updateGoal(id, {
    title: title !== null ? String(title) : undefined,
    description: description !== null ? String(description) : undefined,
  });

  revalidatePath("/");
  revalidatePath(`/goals/${id}`);
}

export async function deleteGoalAction(id: string) {
  await deleteGoal(id);

  revalidatePath("/");
  redirect("/");
}
