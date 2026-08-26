import type { ItemType } from "@/generated/prisma/client";
import { groupNotesByLocation } from "@/lib/groupNotesByLocation";
import { locationLabelFor } from "@/lib/locationLabel";
import { AddNoteForm } from "./add-note-form";
import { NoteItem } from "./note-item";
import type { NoteView, QuestionView } from "./note-view";

export function NotesPanel({
  notes,
  itemId,
  goalId,
  type,
  questions,
}: {
  notes: NoteView[];
  itemId: string;
  goalId: string;
  type: ItemType;
  questions: QuestionView[];
}) {
  const groups = groupNotesByLocation(notes);
  const { label, placeholder } = locationLabelFor(type);
  const locations = [
    ...new Set(
      notes
        .map((note) => note.location)
        .filter((location): location is string => location !== null),
    ),
  ];

  return (
    <section>
      <h2>Notes</h2>
      {groups.length === 0 ? (
        <div className="empty-state">
          No notes yet. Capture what you take from this as you read.
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.location ?? "__unfiled__"}>
            <h3 className="note-group">{group.location ?? "Unfiled"}</h3>
            <ul className="item-list">
              {group.notes.map((note) => (
                <NoteItem
                  key={note.id}
                  note={note}
                  itemId={itemId}
                  goalId={goalId}
                  locationLabel={label}
                  locationPlaceholder={placeholder}
                  locations={locations}
                  questions={questions}
                />
              ))}
            </ul>
          </section>
        ))
      )}

      <h3>Add note</h3>
      <AddNoteForm
        itemId={itemId}
        goalId={goalId}
        locationLabel={label}
        locationPlaceholder={placeholder}
        locations={locations}
        questions={questions}
      />
    </section>
  );
}
