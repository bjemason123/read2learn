import { notFound } from "next/navigation";
import {
  PRINT_GROUP_LABELS,
  getGoal,
  groupReadingItemsForPrint,
} from "@/lib/goals";
import { PrintTrigger } from "./print-trigger";

export default async function GoalPrintPage(
  props: PageProps<"/goals/[id]/print">,
) {
  const { id } = await props.params;
  const goal = await getGoal(id);

  if (!goal) {
    notFound();
  }

  const questions = goal.questions;
  const groups = groupReadingItemsForPrint(goal.readingItems);

  return (
    <div className="print-page">
      <PrintTrigger />

      <h1>{goal.title}</h1>
      {goal.description && <p className="print-description">{goal.description}</p>}

      {questions.length > 0 && (
        <section>
          <h2>Questions</h2>
          <ul className="print-question-list">
            {questions.map((question) => (
              <li key={question.id}>{question.text}</li>
            ))}
          </ul>
        </section>
      )}

      {groups.map((group) => (
        <section key={group.key}>
          <h2>{group.label}</h2>
          <ul className="print-item-list">
            {group.items.map((item) => (
              <li key={item.id} className="print-item">
                <div className="print-item-title">{item.title}</div>
                {item.author && (
                  <div className="print-item-author">by {item.author}</div>
                )}
                <div className="print-item-progress">
                  {PRINT_GROUP_LABELS[item.progress]}
                </div>
                {item.url && <div className="print-item-url">{item.url}</div>}
                {item.note && <div className="print-item-note">{item.note}</div>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
