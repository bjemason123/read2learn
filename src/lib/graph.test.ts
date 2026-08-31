import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createUser } from "@/lib/users";
import { createGoal } from "@/lib/goals";
import { createReadingItem } from "@/lib/readingItems";
import { createNote } from "@/lib/notes";
import { getConceptGraph, type GraphNode } from "@/lib/graph";

let userId: string;

beforeEach(async () => {
  await prisma.note.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.readingItem.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.user.deleteMany();

  userId = (
    await createUser({ email: "reader@example.com", password: "password123" })
  ).id;
});

async function makeItem(goalTitle = "Learn Rust") {
  const goal = await createGoal({ userId, title: goalTitle });
  const item = await createReadingItem({
    userId,
    goalId: goal.id,
    title: "The Rust Book",
  });
  return { goalId: goal.id, itemId: item.id };
}

function tagNode(nodes: GraphNode[], label: string) {
  return nodes.find((n) => n.kind === "tag" && n.label === label);
}

function goalNode(nodes: GraphNode[], label: string) {
  return nodes.find((n) => n.kind === "goal" && n.label === label);
}

describe("getConceptGraph", () => {
  it("returns an empty graph when the user has no tags", async () => {
    const graph = await getConceptGraph(userId);
    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
  });

  it("creates a tag node per tag with its note count", async () => {
    const { itemId } = await makeItem();
    await createNote({ userId, readingItemId: itemId, body: "n1", tags: ["memory"] });
    await createNote({ userId, readingItemId: itemId, body: "n2", tags: ["memory"] });

    const graph = await getConceptGraph(userId);

    const memory = tagNode(graph.nodes, "memory");
    expect(memory).toBeDefined();
    expect(memory?.kind === "tag" && memory.noteCount).toBe(2);
  });

  it("adds a single tag-to-tag edge when two tags share a note", async () => {
    const { itemId } = await makeItem();
    await createNote({
      userId,
      readingItemId: itemId,
      body: "n1",
      tags: ["memory", "attention"],
    });

    const graph = await getConceptGraph(userId);

    const tagEdges = graph.edges.filter((e) => e.kind === "tag-tag");
    expect(tagEdges).toHaveLength(1);
    const memory = tagNode(graph.nodes, "memory");
    const attention = tagNode(graph.nodes, "attention");
    expect([tagEdges[0].source, tagEdges[0].target].sort()).toEqual(
      [memory!.id, attention!.id].sort(),
    );
  });

  it("does not connect tags that never co-occur on a note", async () => {
    const { itemId } = await makeItem();
    await createNote({ userId, readingItemId: itemId, body: "n1", tags: ["memory"] });
    await createNote({ userId, readingItemId: itemId, body: "n2", tags: ["rust"] });

    const graph = await getConceptGraph(userId);

    expect(graph.edges.filter((e) => e.kind === "tag-tag")).toHaveLength(0);
  });

  it("deduplicates a tag-to-tag edge across multiple shared notes", async () => {
    const { itemId } = await makeItem();
    await createNote({
      userId,
      readingItemId: itemId,
      body: "n1",
      tags: ["memory", "attention"],
    });
    await createNote({
      userId,
      readingItemId: itemId,
      body: "n2",
      tags: ["memory", "attention"],
    });

    const graph = await getConceptGraph(userId);

    expect(graph.edges.filter((e) => e.kind === "tag-tag")).toHaveLength(1);
  });

  it("adds a goal node and a goal-to-tag edge via Note → ReadingItem → Goal", async () => {
    const { goalId, itemId } = await makeItem("Learn thermodynamics");
    await createNote({ userId, readingItemId: itemId, body: "n1", tags: ["entropy"] });

    const graph = await getConceptGraph(userId);

    const goal = goalNode(graph.nodes, "Learn thermodynamics");
    expect(goal?.kind === "goal" && goal.goalId).toBe(goalId);

    const entropy = tagNode(graph.nodes, "entropy");
    const goalEdges = graph.edges.filter((e) => e.kind === "goal-tag");
    expect(goalEdges).toHaveLength(1);
    expect(goalEdges[0].source).toBe(goal!.id);
    expect(goalEdges[0].target).toBe(entropy!.id);
  });

  it("scopes the graph to the requesting user", async () => {
    const otherUserId = (
      await createUser({ email: "other@example.com", password: "password123" })
    ).id;
    const otherGoal = await createGoal({ userId: otherUserId, title: "Their goal" });
    const otherItem = await createReadingItem({
      userId: otherUserId,
      goalId: otherGoal.id,
      title: "Their book",
    });
    await createNote({
      userId: otherUserId,
      readingItemId: otherItem.id,
      body: "theirs",
      tags: ["secret"],
    });

    const graph = await getConceptGraph(userId);

    expect(graph.nodes).toEqual([]);
  });
});
