import Link from "next/link";
import { notFound } from "next/navigation";
import { getReadingItem } from "@/lib/readingItems";
import { updateReadingItemAction } from "@/app/goals/[id]/actions";
import { SubmitButton } from "@/app/submit-button";

export default async function EditReadingItemPage(
  props: PageProps<"/goals/[id]/items/[itemId]/edit">,
) {
  const { id, itemId } = await props.params;
  const item = await getReadingItem(itemId);

  if (!item || item.goalId !== id) {
    notFound();
  }

  const updateWithIds = updateReadingItemAction.bind(null, item.id, id);

  return (
    <div>
      <h1>Edit reading item</h1>
      <form action={updateWithIds}>
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
          <input
            id="url"
            name="url"
            type="url"
            defaultValue={item.url ?? ""}
          />
        </div>
        <div className="field">
          <label htmlFor="note">Note</label>
          <textarea
            id="note"
            name="note"
            rows={3}
            defaultValue={item.note ?? ""}
          />
        </div>
        <div className="form-actions">
          <SubmitButton className="primary" pendingLabel="Saving…">
            Save changes
          </SubmitButton>
          <Link href={`/goals/${id}`}>Cancel</Link>
        </div>
      </form>
    </div>
  );
}
