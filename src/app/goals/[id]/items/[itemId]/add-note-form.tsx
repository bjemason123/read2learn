"use client";

import { useActionState, useEffect, useRef } from "react";
import { SubmitButton } from "@/app/submit-button";
import { createNoteAction, type NoteActionState } from "./notes/actions";
import type { QuestionView } from "./note-view";

const INITIAL: NoteActionState = {};

export function AddNoteForm({
  itemId,
  goalId,
  locationLabel,
  locationPlaceholder,
  locations,
  questions,
}: {
  itemId: string;
  goalId: string;
  locationLabel: string;
  locationPlaceholder: string;
  locations: string[];
  questions: QuestionView[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    createNoteAction.bind(null, itemId, goalId),
    INITIAL,
  );

  // Only clear the form once the note is saved. On a validation error the
  // inputs are left untouched, so the typed note is not lost.
  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction}>
      <div className="field">
        <label htmlFor="new-note-body">Note</label>
        <textarea id="new-note-body" name="body" rows={3} required />
      </div>
      <div className="field">
        <label htmlFor="new-note-location">{locationLabel}</label>
        <input
          id="new-note-location"
          name="location"
          type="text"
          list="new-note-locations"
          placeholder={locationPlaceholder}
        />
        <datalist id="new-note-locations">
          {locations.map((location) => (
            <option key={location} value={location} />
          ))}
        </datalist>
      </div>
      <div className="field">
        <label htmlFor="new-note-tags">Tags</label>
        <input
          id="new-note-tags"
          name="tags"
          type="text"
          placeholder="Comma-separated"
        />
      </div>
      {questions.length > 0 && (
        <fieldset className="field">
          <legend>Answers which question(s)?</legend>
          {questions.map((question) => (
            <label key={question.id} className="checkbox-option">
              <input type="checkbox" name="questionIds" value={question.id} />
              {question.text}
            </label>
          ))}
        </fieldset>
      )}
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton className="primary" pendingLabel="Adding…">
        Add note
      </SubmitButton>
    </form>
  );
}
