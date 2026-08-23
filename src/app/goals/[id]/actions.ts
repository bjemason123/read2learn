"use server";

import { revalidatePath } from "next/cache";
import {
  createReadingItem,
  deleteReadingItem,
  deferReadingItem,
  moveReadingItemDown,
  moveReadingItemUp,
  restoreReadingItem,
  updateReadingItemProgress,
} from "@/lib/readingItems";
import type { Progress } from "@/generated/prisma/client";
import { recordEvent } from "@/lib/events";

export async function createReadingItemAction(
  goalId: string,
  formData: FormData,
) {
  const title = String(formData.get("title") ?? "");
  const author = formData.get("author");
  const url = formData.get("url");
  const note = formData.get("note");

  const item = await createReadingItem({
    goalId,
    title,
    author: author ? String(author) : undefined,
    url: url ? String(url) : undefined,
    note: note ? String(note) : undefined,
  });

  await recordEvent({
    type: "reading_item_created",
    goalId,
    readingItemId: item.id,
  });

  revalidatePath(`/goals/${goalId}`);
}

export async function updateProgressAction(
  itemId: string,
  goalId: string,
  progress: Progress,
) {
  await updateReadingItemProgress(itemId, progress);

  await recordEvent({
    type: "reading_item_progress_changed",
    goalId,
    readingItemId: itemId,
  });

  revalidatePath(`/goals/${goalId}`);
}

export async function deferReadingItemAction(itemId: string, goalId: string) {
  await deferReadingItem(itemId);

  await recordEvent({
    type: "reading_item_deferred",
    goalId,
    readingItemId: itemId,
  });

  revalidatePath(`/goals/${goalId}`);
}

export async function restoreReadingItemAction(itemId: string, goalId: string) {
  await restoreReadingItem(itemId);

  await recordEvent({
    type: "reading_item_restored",
    goalId,
    readingItemId: itemId,
  });

  revalidatePath(`/goals/${goalId}`);
}

export async function moveReadingItemUpAction(itemId: string, goalId: string) {
  await moveReadingItemUp(itemId);

  await recordEvent({
    type: "reading_item_moved_up",
    goalId,
    readingItemId: itemId,
  });

  revalidatePath(`/goals/${goalId}`);
}

export async function moveReadingItemDownAction(
  itemId: string,
  goalId: string,
) {
  await moveReadingItemDown(itemId);

  await recordEvent({
    type: "reading_item_moved_down",
    goalId,
    readingItemId: itemId,
  });

  revalidatePath(`/goals/${goalId}`);
}

export async function deleteReadingItemAction(itemId: string, goalId: string) {
  await recordEvent({
    type: "reading_item_deleted",
    goalId,
    readingItemId: itemId,
  });
  await deleteReadingItem(itemId);

  revalidatePath(`/goals/${goalId}`);
}
