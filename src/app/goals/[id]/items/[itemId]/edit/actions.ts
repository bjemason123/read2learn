"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateReadingItem } from "@/lib/readingItems";
import { recordEvent } from "@/lib/events";
import type { ItemType } from "@/generated/prisma/client";

export async function updateReadingItemAction(
  itemId: string,
  goalId: string,
  formData: FormData,
) {
  const title = formData.get("title");
  const author = formData.get("author");
  const url = formData.get("url");
  const type = formData.get("type");

  await updateReadingItem(itemId, {
    title: title !== null ? String(title) : undefined,
    author: author !== null ? String(author) : undefined,
    url: url !== null ? String(url) : undefined,
    type: type !== null ? (String(type) as ItemType) : undefined,
  });

  await recordEvent({
    type: "reading_item_updated",
    goalId,
    readingItemId: itemId,
  });

  revalidatePath(`/goals/${goalId}`);
  revalidatePath(`/goals/${goalId}/items/${itemId}`);
  redirect(`/goals/${goalId}/items/${itemId}`);
}
