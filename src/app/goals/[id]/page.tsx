import Link from "next/link";
import { notFound } from "next/navigation";
import { getGoal, parseQuestions } from "@/lib/goals";
import {
  addQuestionAction,
  deleteGoalAction,
  deleteQuestionAction,
  updateGoalAction,
} from "@/app/goals/actions";
import {
  createReadingItemAction,
  deferReadingItemAction,
  deleteReadingItemAction,
  moveReadingItemDownAction,
  moveReadingItemUpAction,
  restoreReadingItemAction,
} from "./actions";
import { ItemTitle } from "./item-title";
import { ProgressSelect } from "./progress-select";
import { SubmitButton } from "@/app/submit-button";
import { recordEvent } from "@/lib/events";
import { ITEM_TYPES } from "@/lib/locationLabel";

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
  const addQuestionWithGoalId = addQuestionAction.bind(null, goal.id);
  const questions = parseQuestions(goal.questions);
  const activeItems = goal.readingItems.filter((item) => !item.deferred);
  const deferredItems = goal.readingItems.filter((item) => item.deferred);

  return (
    <div>
      <h1>{goal.title}</h1>
      <Link href={`/goals/${goal.id}/print`}>Export to PDF</Link>

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
        <SubmitButton className="primary" pendingLabel="Saving…">
          Save changes
        </SubmitButton>
      </form>
      <form action={deleteGoalWithId}>
        <SubmitButton className="danger" pendingLabel="Deleting…">
          Delete goal
        </SubmitButton>
      </form>

      <h2>Questions</h2>
      {questions.length === 0 ? (
        <div className="empty-state">
          No questions yet. Add the things you want this reading to answer.
        </div>
      ) : (
        <ul className="item-list">
          {questions.map((question, index) => (
            <li key={index} className="item-row">
              <span className="item-title">{question}</span>
              <form
                className="inline"
                action={deleteQuestionAction.bind(null, goal.id, index)}
              >
                <SubmitButton className="danger" pendingLabel="Deleting…">
                  Delete
                </SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      )}
      <form action={addQuestionWithGoalId}>
        <div className="field">
          <label htmlFor="question">Add a question</label>
          <input id="question" name="question" type="text" required />
        </div>
        <SubmitButton pendingLabel="Adding…">Add question</SubmitButton>
      </form>

      <h2>Reading items</h2>
      {activeItems.length === 0 ? (
        <div className="empty-state">
          No reading items yet. Add articles, books, or papers below.
        </div>
      ) : (
        <ul className="item-list">
          {activeItems.map((item, index) => (
            <li key={item.id} className="item-row">
              <ItemTitle title={item.title} url={item.url} />
              {item.author && (
                <span className="item-author">by {item.author}</span>
              )}
              <span className="badge">{item.type.toLowerCase()}</span>
              <Link href={`/goals/${goal.id}/items/${item.id}`}>Notes</Link>
              <Link href={`/goals/${goal.id}/items/${item.id}/edit`}>Edit</Link>
              <ProgressSelect
                itemId={item.id}
                goalId={goal.id}
                progress={item.progress}
              />
              <form
                className="inline"
                action={moveReadingItemUpAction.bind(null, item.id, goal.id)}
              >
                <SubmitButton pendingLabel="Moving…" disabled={index === 0}>
                  ↑
                </SubmitButton>
              </form>
              <form
                className="inline"
                action={moveReadingItemDownAction.bind(null, item.id, goal.id)}
              >
                <SubmitButton
                  pendingLabel="Moving…"
                  disabled={index === activeItems.length - 1}
                >
                  ↓
                </SubmitButton>
              </form>
              <form
                className="inline"
                action={deferReadingItemAction.bind(null, item.id, goal.id)}
              >
                <SubmitButton pendingLabel="Deferring…">Defer</SubmitButton>
              </form>
              <form
                className="inline"
                action={deleteReadingItemAction.bind(null, item.id, goal.id)}
              >
                <SubmitButton className="danger" pendingLabel="Deleting…">
                  Delete
                </SubmitButton>
              </form>
              {item.note && <span className="item-note">{item.note}</span>}
            </li>
          ))}
        </ul>
      )}

      {deferredItems.length > 0 && (
        <>
          <h2>Deferred</h2>
          <ul className="item-list">
            {deferredItems.map((item, index) => (
              <li key={item.id} className="item-row">
                <ItemTitle title={item.title} url={item.url} />
                {item.author && (
                  <span className="item-author">by {item.author}</span>
                )}
                <span className="badge">{item.type.toLowerCase()}</span>
                <span className="badge">Deferred</span>
                <Link href={`/goals/${goal.id}/items/${item.id}`}>Notes</Link>
                <Link href={`/goals/${goal.id}/items/${item.id}/edit`}>
                  Edit
                </Link>
                <form
                  className="inline"
                  action={moveReadingItemUpAction.bind(null, item.id, goal.id)}
                >
                  <SubmitButton pendingLabel="Moving…" disabled={index === 0}>
                    ↑
                  </SubmitButton>
                </form>
                <form
                  className="inline"
                  action={moveReadingItemDownAction.bind(
                    null,
                    item.id,
                    goal.id,
                  )}
                >
                  <SubmitButton
                    pendingLabel="Moving…"
                    disabled={index === deferredItems.length - 1}
                  >
                    ↓
                  </SubmitButton>
                </form>
                <form
                  className="inline"
                  action={restoreReadingItemAction.bind(
                    null,
                    item.id,
                    goal.id,
                  )}
                >
                  <SubmitButton pendingLabel="Restoring…">Restore</SubmitButton>
                </form>
                <form
                  className="inline"
                  action={deleteReadingItemAction.bind(null, item.id, goal.id)}
                >
                  <SubmitButton className="danger" pendingLabel="Deleting…">
                    Delete
                  </SubmitButton>
                </form>
                {item.note && <span className="item-note">{item.note}</span>}
              </li>
            ))}
          </ul>
        </>
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
          <label htmlFor="item-type">Type</label>
          <select id="item-type" name="type" defaultValue="OTHER">
            {ITEM_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="item-note">Note</label>
          <textarea id="item-note" name="note" rows={2} />
        </div>
        <SubmitButton className="primary" pendingLabel="Adding…">
          Add reading item
        </SubmitButton>
      </form>
    </div>
  );
}
