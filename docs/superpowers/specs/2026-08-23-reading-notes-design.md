# Reading Notes — Design

Date: 2026-08-23
Status: Approved (design); implementation plan not yet written

## Problem

A reader can capture only a single free-text note per reading item. That is
too coarse for the way people actually read. A book needs notes attached to
chapters, often several per chapter. A research paper needs notes per section
and a note on the paper as a whole. Notes are also currently unreviewable —
there is no way to look back over what was captured for an item, and no way
to find connections between notes taken across different items.

## Goals

- Capture multiple notes per reading item, each attached to a location within
  the material (a chapter, a section, or the item overall).
- Adapt the location prompt to the kind of material being read.
- Review all notes for a reading item, grouped by location and in reading order.
- Tag notes with keywords, and browse every note carrying a given tag across
  all reading items.

## Non-goals

Deliberately excluded from this design:

- Drag-and-drop reordering of notes (tracked in issue #7).
- Resolving the legacy `ReadingItem.note` column (tracked in issue #9). That
  column is left in place and untouched by this work.
- Rich text or markdown rendering in note bodies.
- Full-text note search. Tags are the only recall mechanism in this version.
- Any spaced-repetition or flashcard-style review mode.

## Data model

Three changes to `prisma/schema.prisma`.

```prisma
enum ItemType {
  BOOK
  PAPER
  ARTICLE
  OTHER
}

model ReadingItem {
  // existing fields unchanged, including the legacy `note` column
  type  ItemType @default(OTHER)
  notes Note[]
}

model Note {
  id            String      @id @default(cuid())
  body          String
  location      String?
  order         Int
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  readingItemId String
  readingItem   ReadingItem @relation(fields: [readingItemId], references: [id], onDelete: Cascade)
  tags          Tag[]

  @@index([readingItemId, order])
}

model Tag {
  id        String   @id @default(cuid())
  name      String   @unique
  createdAt DateTime @default(now())
  notes     Note[]
}
```

### Rationale

**`ItemType` with a default.** Defaulting to `OTHER` lets the column be
non-nullable without a data backfill for existing rows. The type drives the
location prompt in the UI and nothing else — no behaviour is gated on it, so
changing an item's type later is safe.

**`location` is free text and nullable.** Rigid chapter numbering breaks on
prefaces, appendices, and a paper's abstract. A null location is valid and
groups under "Unfiled". An empty-string location is coerced to null on write
so it does not form a distinct empty group.

**`order` is a non-unique `Int`.** Assigned on create as `max(order) + 1`
within the item, starting at 0. Sorting by `createdAt` alone fails for the
common case of reading out of order (abstract and conclusion first). Parsing a
number out of the location string was rejected: the heuristic silently
misfiles notes, which is worse than not sorting. The column is deliberately
not unique — issue #7's drag-and-drop will rewrite blocks of values, and a
unique index makes that unnecessarily awkward.

**Tags are a global implicit many-to-many.** Tags exist to surface connections,
and connections only pay off across reading items — scoping tags per goal would
wall off exactly the value being sought. `name` is unique and normalized on
write (trimmed, lowercased, inner whitespace collapsed) so `Memory` and
`memory` cannot diverge.

**Orphan pruning.** When the last note carrying a tag is deleted or retagged,
the `Tag` row is deleted. Otherwise the tag list accumulates dead entries that
link to empty pages.

**Cascade delete** from `ReadingItem` to `Note`, matching the existing
`Goal` → `ReadingItem` relation.

## Data layer

Follows the existing split: pure data functions in `src/lib/*.ts` that validate
by throwing, and `"use server"` actions in `src/app/**/actions.ts` that call the
lib, record an event, and revalidate.

### `src/lib/notes.ts`

```
createNote({ readingItemId, body, location?, tags? })
getNotesForItem(readingItemId)
updateNote(id, { body?, location?, tags? })
deleteNote(id)
getNotesByTag(tagName)
listTags()
```

`createNote` assigns `order` inside a `prisma.$transaction` wrapping the max
query and the insert. The read-then-write race is essentially unreachable in a
single-user local SQLite app and its failure mode is benign (a tie, resolved by
the secondary sort), but the transaction is one line.

`getNotesForItem` returns notes ordered by `order` then `createdAt`, with tags
included. `getNotesByTag` includes each note's reading item and that item's
goal — a note stripped of which book it came from defeats the purpose of the
cross-item view.

### `src/lib/tags.ts`

- `normalizeTagName(raw)` — trim, lowercase, collapse inner whitespace; returns
  null for empty input.
- `syncNoteTags(noteId, names)` — normalize, dedupe, connect-or-create, then
  prune any tag left with zero notes.

Tag logic lives in its own file because create and update need identical
semantics, and orphan pruning is the rule most likely to be implemented twice
and inconsistently if inlined.

### Validation

In the lib, matching `createReadingItem`. `body` is required and non-empty
(`throw new Error("Note body is required")`). `location` and `tags` are
optional. Whitespace-only tag entries are ignored rather than rejected.

### Server actions

`src/app/goals/[id]/items/[itemId]/notes/actions.ts` provides
`createNoteAction`, `updateNoteAction`, and `deleteNoteAction`. Each parses
`FormData` (tags from a single comma-separated input), calls the lib, records
an event, and revalidates the item page.

Events reuse the existing `Event` model with `readingItemId` and the types
`note_created`, `note_updated`, and `note_deleted`. No schema change is needed
for telemetry.

## UI and routes

There is no reading-item detail page today — items are rows on `/goals/[id]`
and the only per-item page is `.../edit`. The notes panel needs a home, so this
feature introduces one.

| Route | Purpose |
|---|---|
| `/goals/[id]/items/[itemId]` | New. Item detail header plus notes panel |
| `/goals/[id]/items/[itemId]/edit` | Existing; gains the `type` selector |
| `/goals/[id]` | Item rows link to the detail page; show a type badge |
| item-create form | Gains the `type` selector |
| `/tags` | New. All tags with note counts |
| `/tags/[name]` | New. Notes carrying that tag, grouped by reading item |

### Notes panel

A server component rendering the grouped list, with client components for the
forms.

- Notes grouped by `location`; groups ordered by their lowest `order`;
  "Unfiled" last.
- Each note shows body, location, tag chips linking to `/tags/[name]`, and
  edit and delete controls.
- A persistent "Add note" form at the bottom: body textarea, location input,
  comma-separated tags input.
- The location input's label and placeholder derive from the item's `type` via
  a `locationLabelFor(type)` helper: `BOOK` → "Chapter" / `e.g. Chapter 3`;
  `PAPER` → "Section" / `e.g. §2.1 Methods`; otherwise "Location".
- The location input is backed by a `datalist` of that item's existing
  locations. This is the main defence against free-text fragmentation
  (`Ch 3` / `Ch. 3` / `Chapter 3`).

Editing is inline — the note swaps to a form in place — rather than a separate
route. Notes are short, and a page navigation per edit makes reviewing a
chapter's worth of notes tedious.

Forms use the existing `submit-button.tsx` pending pattern. Delete is a
form-action button with confirmation, matching reading-item delete. Styling
uses the existing design tokens and focus states; no new visual system.

## Error handling

Existing convention (libs throw, actions propagate) holds, with two additions.
Notes are the first place in this app where a user can lose typed work.

- **Note actions return `{ error }` instead of throwing** on validation
  failure. The form renders the message and preserves the entered text. An
  unhandled throw would blank the textarea and discard what was written.
- **Not-found handling.** The item detail page calls `notFound()` when the item
  does not exist. `/tags/[name]` renders an empty state rather than a 404 for
  an unknown tag — that case is expected after orphan pruning, and a dead-end
  404 from a stale link is worse than "no notes carry this tag".

## Edge cases

| Case | Behaviour |
|---|---|
| Note with no location | Groups under "Unfiled", sorted last |
| Empty-string location | Coerced to null |
| Duplicate tags in one input (`ai, AI`) | Normalized, then deduped to one link |
| Whitespace-only tag entry | Ignored, not an error |
| Last note carrying a tag removed | Tag row pruned |
| Reading item deleted | Notes cascade; affected tags prune |
| Item type changed after notes exist | Only the location label changes |
| Two notes tie on `order` | Stable secondary sort by `createdAt` |

## Testing

Vitest, alongside the existing suites.

- `src/lib/notes.test.ts` — order assignment, grouping and sort order including
  Unfiled, cascade on item delete, validation throws.
- `src/lib/tags.test.ts` — normalization, dedupe, connect-or-create, orphan
  pruning.
- `notes/actions.test.ts` — `{ error }` returns on invalid input, event
  recording, tag round-trip through `FormData`. Mirrors
  `src/app/goals/[id]/actions.test.ts`.
- `locationLabelFor` — table test covering every `ItemType`.

## Open items

Both are tracked and intentionally outside this design:

- Issue #7 — drag-and-drop note reordering.
- Issue #9 — resolve the legacy `ReadingItem.note` column. Until it is
  resolved, two note-shaped places exist where data could live; the new feature
  does not read or write the legacy column.
