import Link from "next/link";
import { getConceptGraph } from "@/lib/graph";
import { recordEvent } from "@/lib/events";
import { requireUserId } from "@/lib/session";
import { ConceptGraphView } from "./concept-graph";

export default async function GraphPage() {
  const userId = await requireUserId();
  const graph = await getConceptGraph(userId);

  // Recurring-reference view (~every second session), so each visit is worth
  // recording to confirm the stated usage cadence.
  await recordEvent({ type: "graph_viewed", userId });

  return (
    <div>
      <Link href="/">← Back to goals</Link>

      <h1>Concept graph</h1>
      <p className="page-intro">
        Tags you&apos;ve used are shown as connected concepts — two tags link up
        when they share a note, and each goal links to the tags its notes use.
        Click a tag or goal to drill in.
      </p>
      <ConceptGraphView graph={graph} />
    </div>
  );
}
