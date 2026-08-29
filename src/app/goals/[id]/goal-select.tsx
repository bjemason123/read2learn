"use client";

import { useTransition } from "react";
import { moveReadingItemToGoalAction } from "./actions";

export function GoalSelect({
  itemId,
  goalId,
  otherGoals,
}: {
  itemId: string;
  goalId: string;
  otherGoals: { id: string; title: string }[];
}) {
  const [isPending, startTransition] = useTransition();

  if (otherGoals.length === 0) {
    return null;
  }

  return (
    <select
      defaultValue=""
      disabled={isPending}
      onChange={(event) => {
        const newGoalId = event.target.value;
        if (!newGoalId) return;

        startTransition(() => {
          moveReadingItemToGoalAction(itemId, goalId, newGoalId);
        });

        // Unlike ProgressSelect there is no current value to reflect — the
        // goal just picked is the one the item leaves for, so snap back to
        // the placeholder rather than looking stuck on it.
        event.target.value = "";
      }}
    >
      <option value="">Move to…</option>
      {otherGoals.map((goal) => (
        <option key={goal.id} value={goal.id}>
          {goal.title}
        </option>
      ))}
    </select>
  );
}
