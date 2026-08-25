// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import Home from "./page";

afterEach(cleanup);

describe("landing page", () => {
  it("renders the headline", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: /add up to learning/i }),
    ).toBeTruthy();
  });

  it("links the primary call to action at the goal creation form", () => {
    render(<Home />);

    const links = screen.getAllByRole("link", {
      name: "Create your first goal",
    });
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link.getAttribute("href")).toBe("/goals/new");
    }
  });

  it("links the secondary call to action at the goals dashboard", () => {
    render(<Home />);

    const link = screen.getByRole("link", { name: "View my goals" });
    expect(link.getAttribute("href")).toBe("/goals");
  });

  it("renders all five sections in order", () => {
    const { container } = render(<Home />);

    const sections = Array.from(container.querySelectorAll("section")).map(
      (section) => section.className,
    );
    expect(sections).toEqual([
      "landing-hero",
      "landing-problem",
      "landing-features",
      "landing-how",
      "landing-closing",
    ]);
  });

  it("does not describe features deferred out of MVP scope", () => {
    const { container } = render(<Home />);

    const copy = container.textContent ?? "";
    for (const deferred of [
      "retrieval practice",
      "spaced review",
      "concept map",
      "corroborat",
    ]) {
      expect(copy.toLowerCase()).not.toContain(deferred);
    }
  });
});
