import Link from "next/link";

export default function Home() {
  return (
    <div className="landing">
      <section className="landing-hero">
        <h1>Make your reading add up to learning.</h1>
        <p className="landing-subhead">
          Reading Curator turns a vague ambition into a concrete learning goal,
          and keeps the reading you do attached to it.
        </p>
        <div className="landing-cta-row">
          <Link href="/goals/new" className="landing-cta primary">
            Create your first goal
          </Link>
          <Link href="/goals" className="landing-cta secondary">
            View my goals
          </Link>
        </div>
      </section>

      <section className="landing-problem">
        <h2>The problem</h2>
        <p>
          If you are learning a subject in your own time, you read widely around
          the topic but rarely converge on the thing you actually set out to
          learn. Reading happens, but it doesn&apos;t add up to learning — and
          there is no tutor, cohort or deadline to catch the drift.
        </p>
      </section>

      <section className="landing-features">
        <h2>What you can do</h2>
        <ul className="landing-feature-list">
          <li>
            <span className="landing-feature-title">Set a learning goal</span>
            <span className="landing-feature-detail">
              Write down what you want to learn, why it matters, and the
              questions you want answered.
            </span>
          </li>
          <li>
            <span className="landing-feature-title">
              Attach reading to that goal
            </span>
            <span className="landing-feature-detail">
              Books, articles, papers — each reading item lives against the goal
              it serves, not in a general bookmark pile.
            </span>
          </li>
          <li>
            <span className="landing-feature-title">
              Capture notes where you read them
            </span>
            <span className="landing-feature-detail">
              Record a note against a specific location in a reading item — a
              page, chapter or section — and tag it so you can find it again.
            </span>
          </li>
        </ul>
      </section>

      <section className="landing-how">
        <h2>How it works</h2>
        <ol className="landing-step-list">
          <li>Create a goal describing what you want to learn.</li>
          <li>Add the reading material you plan to work through.</li>
          <li>Take notes against specific locations as you read.</li>
          <li>Track progress on each reading item as it moves along.</li>
        </ol>
        <p className="landing-how-note">
          When you want your plan away from the screen, open a goal&apos;s print
          view and use your browser&apos;s print dialog to put it on paper or
          save it as a PDF.
        </p>
      </section>

      <section className="landing-closing">
        <h2>Start with one goal</h2>
        <p>
          Pick the thing you have been meaning to learn, and give the reading
          somewhere to land.
        </p>
        <Link href="/goals/new" className="landing-cta primary">
          Create your first goal
        </Link>
      </section>
    </div>
  );
}
