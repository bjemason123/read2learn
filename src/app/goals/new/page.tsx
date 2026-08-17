import { createGoalAction } from "@/app/goals/actions";

export default function NewGoalPage() {
  return (
    <div>
      <h1>New goal</h1>
      <form action={createGoalAction}>
        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" name="title" type="text" required />
        </div>
        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" rows={3} />
        </div>
        <div className="field">
          <label htmlFor="questions">Questions you want to answer</label>
          <textarea
            id="questions"
            name="questions"
            rows={3}
            placeholder="One question per line"
          />
        </div>
        <button type="submit">Create goal</button>
      </form>
    </div>
  );
}
