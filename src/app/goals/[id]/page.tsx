import { notFound } from "next/navigation";
import { getGoal } from "@/lib/goals";
import { deleteGoalAction, updateGoalAction } from "@/app/goals/actions";
import {
  createReadingItemAction,
  deleteReadingItemAction,
} from "./actions";
import { ProgressSelect } from "./progress-select";
import { recordEvent } from "@/lib/events";

export default async function GoalDetailPage(props: PageProps<"/goals/[id]">) {
  const { id } = await props.params;
  const goal = await getGoal(id);

  if (!goal) {
    notFound();
  }

  await recordEvent({ type: "goal_viewed", goalId: goal.id });

  const updateGoalWithId = updateGoalAction.bind(null, goal.id);
  const deleteGoalWithId = deleteGoalAction.bind(null, goal.id);
  const createReadingItemWithGoalId = createReadingItemAction.bind(
    null,
    goal.id,
  );

  return (
    <div>
      <h1>{goal.title}</h1>

      <h2>Edit goal</h2>
      <form action={updateGoalWithId}>
        <div className="field">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            name="title"
            type="text"
            defaultValue={goal.title}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={goal.description ?? ""}
          />
        </div>
        <div className="field">
          <label htmlFor="questions">Questions you want to answer</label>
          <textarea
            id="questions"
            name="questions"
            rows={3}
            placeholder="One question per line"
            defaultValue={goal.questions ?? ""}
          />
        </div>
        <button type="submit">Save changes</button>
      </form>
      <form action={deleteGoalWithId}>
        <button type="submit" className="danger">
          Delete goal
        </button>
      </form>

      <h2>Reading items</h2>
      {goal.readingItems.length === 0 ? (
        <p>No reading items yet.</p>
      ) : (
        <ul className="item-list">
          {goal.readingItems.map((item) => (
            <li key={item.id} className="item-row">
              <span className="item-title">
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.title}
                  </a>
                ) : (
                  item.title
                )}
              </span>
              {item.author && (
                <span className="item-author">by {item.author}</span>
              )}
              <ProgressSelect
                itemId={item.id}
                goalId={goal.id}
                progress={item.progress}
              />
              <form
                action={deleteReadingItemAction.bind(null, item.id, goal.id)}
              >
                <button type="submit" className="danger">
                  Delete
                </button>
              </form>
              {item.note && <span className="item-note">{item.note}</span>}
            </li>
          ))}
        </ul>
      )}

      <h2>Add reading item</h2>
      <form action={createReadingItemWithGoalId}>
        <div className="field">
          <label htmlFor="item-title">Title</label>
          <input id="item-title" name="title" type="text" required />
        </div>
        <div className="field">
          <label htmlFor="item-author">Author</label>
          <input id="item-author" name="author" type="text" />
        </div>
        <div className="field">
          <label htmlFor="item-url">URL</label>
          <input id="item-url" name="url" type="url" />
        </div>
        <div className="field">
          <label htmlFor="item-note">Note</label>
          <textarea id="item-note" name="note" rows={2} />
        </div>
        <button type="submit">Add reading item</button>
      </form>
    </div>
  );
}
