import Link from "next/link";
import { listTags } from "@/lib/notes";

export default async function TagsPage() {
  const tags = await listTags();

  return (
    <div>
      <Link href="/">← Back to goals</Link>

      <h1>Tags</h1>
      {tags.length === 0 ? (
        <div className="empty-state">
          No tags yet. Tag a note to start building connections across your
          reading.
        </div>
      ) : (
        <ul className="item-list">
          {tags.map((tag) => (
            <li key={tag.id} className="item-row">
              <Link
                className="item-title"
                href={`/tags/${encodeURIComponent(tag.name)}`}
              >
                {tag.name}
              </Link>
              <span className="badge">
                {tag._count.notes} {tag._count.notes === 1 ? "note" : "notes"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
