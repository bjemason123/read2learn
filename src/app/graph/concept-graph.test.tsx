// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ConceptGraph } from "@/lib/graph";
import { ConceptGraphView } from "./concept-graph";

afterEach(cleanup);

describe("ConceptGraphView", () => {
  it("shows an empty state when there are no nodes", () => {
    render(<ConceptGraphView graph={{ nodes: [], edges: [] }} />);
    expect(screen.getByText(/No concepts to map yet/)).toBeTruthy();
  });

  it("links each tag node to its tag detail page", () => {
    const graph: ConceptGraph = {
      nodes: [
        { id: "tag:1", kind: "tag", label: "memory", noteCount: 2 },
        { id: "tag:2", kind: "tag", label: "spaced out", noteCount: 1 },
      ],
      edges: [{ source: "tag:1", target: "tag:2", kind: "tag-tag" }],
    };

    const { container } = render(<ConceptGraphView graph={graph} />);

    const hrefs = [...container.querySelectorAll("a")].map((a) =>
      a.getAttribute("href"),
    );
    expect(hrefs).toContain("/tags/memory");
    // Tag names are URL-encoded so a space in a tag routes correctly.
    expect(hrefs).toContain("/tags/spaced%20out");
  });

  it("links a goal node to its goal page", () => {
    const graph: ConceptGraph = {
      nodes: [
        { id: "tag:1", kind: "tag", label: "entropy", noteCount: 1 },
        { id: "goal:g1", kind: "goal", goalId: "g1", label: "Thermo" },
      ],
      edges: [{ source: "goal:g1", target: "tag:1", kind: "goal-tag" }],
    };

    const { container } = render(<ConceptGraphView graph={graph} />);

    const hrefs = [...container.querySelectorAll("a")].map((a) =>
      a.getAttribute("href"),
    );
    expect(hrefs).toContain("/goals/g1");
  });

  it("draws one line per edge", () => {
    const graph: ConceptGraph = {
      nodes: [
        { id: "tag:1", kind: "tag", label: "a", noteCount: 1 },
        { id: "tag:2", kind: "tag", label: "b", noteCount: 1 },
      ],
      edges: [{ source: "tag:1", target: "tag:2", kind: "tag-tag" }],
    };

    const { container } = render(<ConceptGraphView graph={graph} />);

    expect(container.querySelectorAll("line")).toHaveLength(1);
  });
});
