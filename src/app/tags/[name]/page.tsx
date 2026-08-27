import Link from "next/link";
import { getNotesByTag } from "@/lib/notes";
import { requireUserId } from "@/lib/session";

type TaggedNote = Awaited<ReturnType<typeof getNotesByTag>>[number];

function groupByReadingItem(notes: TaggedNote[]) {
  const groups = new Map<string, { item: TaggedNote["readingItem"]; notes: TaggedNote[] }>();

  for (const note of notes) {
    const existing = groups.get(note.readingItemId);
    if (existing) {
      existing.notes.push(note);
    } else {
      groups.set(note.readingItemId, {
        item: note.readingItem,
        notes: [note],
      });
    }
  }

  return [...groups.values()];
}

export default async function TagDetailPage(
  props: PageProps<"/tags/[name]">,
) {
  const userId = await requireUserId();
  const { name } = await props.params;
  const tagName = decodeURIComponent(name);
  const notes = await getNotesByTag(tagName, userId);
  const groups = groupByReadingItem(notes);

  return (
    <div>
      <Link href="/tags">← Back to tags</Link>

      <h1>{tagName}</h1>
      {/* An unknown or pruned tag renders an empty state rather than a 404 —
          a dead-end 404 from a stale link is worse than "no notes here". */}
      {groups.length === 0 ? (
        <div className="empty-state">No notes carry this tag.</div>
      ) : (
        groups.map((group) => (
          <section key={group.item.id}>
            <h2>
              <Link
                href={`/goals/${group.item.goalId}/items/${group.item.id}`}
              >
                {group.item.title}
              </Link>
            </h2>
            <p className="item-author">in {group.item.goal.title}</p>
            <ul className="item-list">
              {group.notes.map((note) => (
                <li key={note.id} className="item-row note-row">
                  <span className="note-body">{note.body}</span>
                  {note.location && (
                    <span className="badge">{note.location}</span>
                  )}
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
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
