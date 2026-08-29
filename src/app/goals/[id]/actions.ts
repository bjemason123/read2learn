"use server";

import { revalidatePath } from "next/cache";
import {
  createReadingItem,
  deleteReadingItem,
  deferReadingItem,
  moveReadingItemDown,
  moveReadingItemToGoal,
  moveReadingItemUp,
  restoreReadingItem,
  updateReadingItemProgress,
} from "@/lib/readingItems";
import type { ItemType, Progress } from "@/generated/prisma/client";
import { recordEvent } from "@/lib/events";
import { requireUserId } from "@/lib/session";

export async function createReadingItemAction(
  goalId: string,
  formData: FormData,
) {
  const userId = await requireUserId();
  const title = String(formData.get("title") ?? "");
  const author = formData.get("author");
  const url = formData.get("url");
  const note = formData.get("note");
  const type = formData.get("type");

  const item = await createReadingItem({
    goalId,
    userId,
    title,
    author: author ? String(author) : undefined,
    url: url ? String(url) : undefined,
    note: note ? String(note) : undefined,
    type: type ? (String(type) as ItemType) : undefined,
  });

  await recordEvent({
    type: "reading_item_created",
    goalId,
    readingItemId: item.id,
    userId,
  });

  revalidatePath(`/goals/${goalId}`);
}

export async function updateProgressAction(
  itemId: string,
  goalId: string,
  progress: Progress,
) {
  const userId = await requireUserId();

  await updateReadingItemProgress(itemId, userId, progress);

  await recordEvent({
    type: "reading_item_progress_changed",
    goalId,
    readingItemId: itemId,
    userId,
  });

  revalidatePath(`/goals/${goalId}`);
}

export async function deferReadingItemAction(itemId: string, goalId: string) {
  const userId = await requireUserId();

  await deferReadingItem(itemId, userId);

  await recordEvent({
    type: "reading_item_deferred",
    goalId,
    readingItemId: itemId,
    userId,
  });

  revalidatePath(`/goals/${goalId}`);
}

export async function restoreReadingItemAction(itemId: string, goalId: string) {
  const userId = await requireUserId();

  await restoreReadingItem(itemId, userId);

  await recordEvent({
    type: "reading_item_restored",
    goalId,
    readingItemId: itemId,
    userId,
  });

  revalidatePath(`/goals/${goalId}`);
}

export async function moveReadingItemUpAction(itemId: string, goalId: string) {
  const userId = await requireUserId();

  await moveReadingItemUp(itemId, userId);

  await recordEvent({
    type: "reading_item_moved_up",
    goalId,
    readingItemId: itemId,
    userId,
  });

  revalidatePath(`/goals/${goalId}`);
}

export async function moveReadingItemDownAction(
  itemId: string,
  goalId: string,
) {
  const userId = await requireUserId();

  await moveReadingItemDown(itemId, userId);

  await recordEvent({
    type: "reading_item_moved_down",
    goalId,
    readingItemId: itemId,
    userId,
  });

  revalidatePath(`/goals/${goalId}`);
}

export async function moveReadingItemToGoalAction(
  itemId: string,
  goalId: string,
  newGoalId: string,
) {
  const userId = await requireUserId();

  await moveReadingItemToGoal(itemId, userId, newGoalId);

  await recordEvent({
    type: "reading_item_moved_to_goal",
    goalId: newGoalId,
    readingItemId: itemId,
    userId,
  });

  // Both pages are cached separately: the item leaves one and joins the other.
  revalidatePath(`/goals/${goalId}`);
  revalidatePath(`/goals/${newGoalId}`);
}

export async function deleteReadingItemAction(itemId: string, goalId: string) {
  const userId = await requireUserId();

  await recordEvent({
    type: "reading_item_deleted",
    goalId,
    readingItemId: itemId,
    userId,
  });
  await deleteReadingItem(itemId, userId);

  revalidatePath(`/goals/${goalId}`);
}
