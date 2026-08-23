import Link from "next/link";
import { notFound } from "next/navigation";
import { getReadingItem } from "@/lib/readingItems";
import { NotesPanel } from "./notes-panel";

export default async function ReadingItemDetailPage(
  props: PageProps<"/goals/[id]/items/[itemId]">,
) {
  const { id, itemId } = await props.params;
  const item = await getReadingItem(itemId);

  if (!item || item.goalId !== id) {
    notFound();
  }

  return (
    <div>
      <Link href={`/goals/${id}`}>← Back to goal</Link>

      <h1>{item.title}</h1>
      <p>
        <span className="badge">{item.type.toLowerCase()}</span>
        {item.author && <span className="item-author">by {item.author}</span>}
        {item.url && (
          <a href={item.url} target="_blank" rel="noreferrer">
            Open link
          </a>
        )}
      </p>
      <Link href={`/goals/${id}/items/${item.id}/edit`}>Edit item</Link>

      <NotesPanel
        notes={item.notes}
        itemId={item.id}
        goalId={id}
        type={item.type}
      />
    </div>
  );
}
