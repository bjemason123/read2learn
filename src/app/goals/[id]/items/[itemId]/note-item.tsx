"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { SubmitButton } from "@/app/submit-button";
import {
  deleteNoteAction,
  updateNoteAction,
  type NoteActionState,
} from "./notes/actions";
import type { NoteView } from "./note-view";

const INITIAL: NoteActionState = {};

export function NoteItem({
  note,
  itemId,
  goalId,
  locationLabel,
  locationPlaceholder,
  locations,
}: {
  note: NoteView;
  itemId: string;
  goalId: string;
  locationLabel: string;
  locationPlaceholder: string;
  locations: string[];
}) {
  const [editing, setEditing] = useState(false);

  const [updateState, updateAction] = useActionState(
    updateNoteAction.bind(null, note.id, itemId, goalId),
    INITIAL,
  );
  const [deleteState, deleteAction] = useActionState(
    () => deleteNoteAction(note.id, itemId, goalId),
    INITIAL,
  );

  // Close the inline editor only once the server confirms the update, so a
  // validation error keeps the user's text on screen. Adjusting state during
  // render (rather than in an effect) avoids a cascading re-render, and
  // tracking the last-seen state means re-opening the editor afterwards works.
  const [seenUpdateState, setSeenUpdateState] = useState(updateState);
  if (seenUpdateState !== updateState) {
    setSeenUpdateState(updateState);
    if (updateState.ok) {
      setEditing(false);
    }
  }

  const datalistId = `note-locations-${note.id}`;

  if (editing) {
    return (
      <li className="item-row note-row">
        <form action={updateAction} className="note-edit-form">
          <div className="field">
            <label htmlFor={`note-body-${note.id}`}>Note</label>
            <textarea
              id={`note-body-${note.id}`}
              name="body"
              rows={3}
              defaultValue={note.body}
              required
            />
          </div>
          <div className="field">
            <label htmlFor={`note-location-${note.id}`}>{locationLabel}</label>
            <input
              id={`note-location-${note.id}`}
              name="location"
              type="text"
              list={datalistId}
              placeholder={locationPlaceholder}
              defaultValue={note.location ?? ""}
            />
            <datalist id={datalistId}>
              {locations.map((location) => (
                <option key={location} value={location} />
              ))}
            </datalist>
          </div>
          <div className="field">
            <label htmlFor={`note-tags-${note.id}`}>Tags</label>
            <input
              id={`note-tags-${note.id}`}
              name="tags"
              type="text"
              placeholder="Comma-separated"
              defaultValue={note.tags.map((tag) => tag.name).join(", ")}
            />
          </div>
          {updateState.error && (
            <p className="form-error" role="alert">
              {updateState.error}
            </p>
          )}
          <SubmitButton className="primary" pendingLabel="Saving…">
            Save note
          </SubmitButton>
          <button type="button" onClick={() => setEditing(false)}>
            Cancel
          </button>
        </form>
      </li>
    );
  }

  return (
    <li className="item-row note-row">
      <span className="note-body">{note.body}</span>
      {note.tags.length > 0 && (
        <span className="tag-chips">
          {note.tags.map((tag) => (
            <Link
              key={tag.id}
              className="tag-chip"
              href={`/tags/${encodeURIComponent(tag.name)}`}
            >
              {tag.name}
            </Link>
          ))}
        </span>
      )}
      <button type="button" onClick={() => setEditing(true)}>
        Edit
      </button>
      <form className="inline" action={deleteAction}>
        <SubmitButton className="danger" pendingLabel="Deleting…">
          Delete
        </SubmitButton>
      </form>
      {deleteState.error && (
        <p className="form-error" role="alert">
          {deleteState.error}
        </p>
      )}
    </li>
  );
}
