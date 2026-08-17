"use server";

import { revalidatePath } from "next/cache";
import {
  createReadingItem,
  deleteReadingItem,
  updateReadingItemProgress,
} from "@/lib/readingItems";
import type { Progress } from "@/generated/prisma/client";

export async function createReadingItemAction(
  goalId: string,
  formData: FormData,
) {
  const title = String(formData.get("title") ?? "");
  const url = formData.get("url");
  const note = formData.get("note");

  await createReadingItem({
    goalId,
    title,
    url: url ? String(url) : undefined,
    note: note ? String(note) : undefined,
  });

  revalidatePath(`/goals/${goalId}`);
}

export async function updateProgressAction(
  itemId: string,
  goalId: string,
  progress: Progress,
) {
  await updateReadingItemProgress(itemId, progress);

  revalidatePath(`/goals/${goalId}`);
}

export async function deleteReadingItemAction(itemId: string, goalId: string) {
  await deleteReadingItem(itemId);

  revalidatePath(`/goals/${goalId}`);
}
