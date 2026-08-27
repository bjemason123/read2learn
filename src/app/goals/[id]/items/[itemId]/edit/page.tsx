import Link from "next/link";
import { notFound } from "next/navigation";
import { getReadingItem } from "@/lib/readingItems";
import { ITEM_TYPES } from "@/lib/locationLabel";
import { SubmitButton } from "@/app/submit-button";
import { updateReadingItemAction } from "./actions";
import { requireUserId } from "@/lib/session";

export default async function EditReadingItemPage(
  props: PageProps<"/goals/[id]/items/[itemId]/edit">,
) {
  const userId = await requireUserId();
  const { id, itemId } = await props.params;
  const item = await getReadingItem(itemId, userId);

  if (!item || item.goalId !== id) {
    notFound();
  }

  const updateItem = updateReadingItemAction.bind(null, item.id, id);

  return (
    <div>
      <Link href={`/goals/${id}/items/${item.id}`}>← Back to item</Link>

      <h1>Edit reading item</h1>
      <form action={updateItem}>
        <div className="field">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            name="title"
            type="text"
            defaultValue={item.title}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="author">Author</label>
          <input
            id="author"
            name="author"
            type="text"
            defaultValue={item.author ?? ""}
          />
        </div>
        <div className="field">
          <label htmlFor="url">URL</label>
          <input id="url" name="url" type="url" defaultValue={item.url ?? ""} />
        </div>
        <div className="field">
          <label htmlFor="type">Type</label>
          <select id="type" name="type" defaultValue={item.type}>
            {ITEM_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <SubmitButton className="primary" pendingLabel="Saving…">
          Save changes
        </SubmitButton>
      </form>
    </div>
  );
}
