// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { getConceptGraph } from "@/lib/graph";
import { recordEvent } from "@/lib/events";
import GraphPage from "./page";

vi.mock("@/lib/graph", () => ({ getConceptGraph: vi.fn() }));
vi.mock("@/lib/events", () => ({ recordEvent: vi.fn() }));
vi.mock("@/lib/session", () => ({
  requireUserId: vi.fn(async () => "user_1"),
}));

const mockedGetConceptGraph = vi.mocked(getConceptGraph);
const mockedRecordEvent = vi.mocked(recordEvent);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("GraphPage", () => {
  it("records a graph_viewed event for the user on load", async () => {
    mockedGetConceptGraph.mockResolvedValue({ nodes: [], edges: [] });

    render(await GraphPage());

    expect(mockedRecordEvent).toHaveBeenCalledWith({
      type: "graph_viewed",
      userId: "user_1",
    });
  });

  it("renders the graph heading and its concept view", async () => {
    mockedGetConceptGraph.mockResolvedValue({
      nodes: [{ id: "tag:1", kind: "tag", label: "memory", noteCount: 1 }],
      edges: [],
    });

    const { container } = render(await GraphPage());

    expect(screen.getByRole("heading", { name: "Concept graph" })).toBeTruthy();
    expect(
      [...container.querySelectorAll("a")].map((a) => a.getAttribute("href")),
    ).toContain("/tags/memory");
  });
});
