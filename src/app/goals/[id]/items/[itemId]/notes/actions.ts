"use server";

import { revalidatePath } from "next/cache";
import { createNote, deleteNote, updateNote } from "@/lib/notes";
import { recordEvent } from "@/lib/events";

// Notes are the first place in this app where a user can lose typed work, so
// these actions return `{ error }` rather than letting the lib's throw
// propagate — an unhandled throw would blank the textarea. Other actions in
// this codebase still use the propagate-the-throw convention.
// `ok` lets the client close an inline edit form / reset the add form only
// after a successful submit, without clearing text the user must retype.
export type NoteActionState = { error?: string; ok?: boolean };

function parseTags(formData: FormData): string[] {
  return String(formData.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

// The checkbox group is always rendered, so an empty result means "the user
// unchecked everything" rather than "the field was absent" — always sync it.
function parseQuestionIds(formData: FormData): string[] {
  return formData.getAll("questionIds").map(String);
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function revalidateNoteViews(goalId: string, readingItemId: string) {
  revalidatePath(`/goals/${goalId}/items/${readingItemId}`);
  revalidatePath("/tags");
}

export async function createNoteAction(
  readingItemId: string,
  goalId: string,
  _prevState: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const body = String(formData.get("body") ?? "");
  const location = formData.get("location");

  try {
    await createNote({
      readingItemId,
      body,
      location: location ? String(location) : undefined,
      tags: parseTags(formData),
      questionIds: parseQuestionIds(formData),
    });

    await recordEvent({ type: "note_created", goalId, readingItemId });
    revalidateNoteViews(goalId, readingItemId);

    return { ok: true };
  } catch (err) {
    return { error: errorMessage(err, "Failed to create note") };
  }
}

export async function updateNoteAction(
  noteId: string,
  readingItemId: string,
  goalId: string,
  _prevState: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const body = String(formData.get("body") ?? "");
  const location = String(formData.get("location") ?? "");

  try {
    await updateNote(noteId, {
      body,
      location,
      tags: parseTags(formData),
      questionIds: parseQuestionIds(formData),
    });

    await recordEvent({ type: "note_updated", goalId, readingItemId });
    revalidateNoteViews(goalId, readingItemId);

    return { ok: true };
  } catch (err) {
    return { error: errorMessage(err, "Failed to update note") };
  }
}

// Takes no `prevState`/`formData`: there is nothing to parse, so the client
// wraps it in a zero-arg closure for `useActionState`.
export async function deleteNoteAction(
  noteId: string,
  readingItemId: string,
  goalId: string,
): Promise<NoteActionState> {
  try {
    // Unlike reading items, `Event` has no FK to `Note`, so the event is
    // recorded after the delete — that way a failed delete records nothing.
    await deleteNote(noteId);
    await recordEvent({ type: "note_deleted", goalId, readingItemId });

    revalidateNoteViews(goalId, readingItemId);

    return { ok: true };
  } catch (err) {
    return { error: errorMessage(err, "Failed to delete note") };
  }
}
