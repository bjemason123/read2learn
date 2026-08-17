"use client";

import { useTransition } from "react";
import type { Progress } from "@/generated/prisma/client";
import { updateProgressAction } from "./actions";

const OPTIONS: Progress[] = ["NOT_STARTED", "IN_PROGRESS", "DONE"];

export function ProgressSelect({
  itemId,
  goalId,
  progress,
}: {
  itemId: string;
  goalId: string;
  progress: Progress;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={progress}
      disabled={isPending}
      onChange={(event) => {
        const next = event.target.value as Progress;
        startTransition(() => {
          updateProgressAction(itemId, goalId, next);
        });
      }}
    >
      {OPTIONS.map((option) => (
        <option key={option} value={option}>
          {option.replace("_", " ").toLowerCase()}
        </option>
      ))}
    </select>
  );
}
