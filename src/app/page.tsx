import Link from "next/link";
import { listGoals } from "@/lib/goals";

export default async function Home() {
  const goals = await listGoals();

  return (
    <div>
      <h1>Your goals</h1>
      {goals.length === 0 ? (
        <p>No goals yet.</p>
      ) : (
        <ul className="goal-list">
          {goals.map((goal) => (
            <li key={goal.id}>
              <Link href={`/goals/${goal.id}`}>
                <div className="goal-title">{goal.title}</div>
                <div className="goal-meta">
                  {goal.readingItems.length} reading item
                  {goal.readingItems.length === 1 ? "" : "s"}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link href="/goals/new">+ New goal</Link>
    </div>
  );
}
