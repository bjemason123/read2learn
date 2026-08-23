// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ItemTitle } from "./item-title";

afterEach(cleanup);

describe("ItemTitle", () => {
  it("renders the title as a link when a url is present", () => {
    render(<ItemTitle title="Deep Work" url="https://example.com/deep-work" />);

    const link = screen.getByRole("link", { name: "Deep Work" });
    expect(link).toHaveProperty("href", "https://example.com/deep-work");
  });

  it("opens the link in a new tab without leaking the opener", () => {
    render(<ItemTitle title="Deep Work" url="https://example.com/deep-work" />);

    const link = screen.getByRole("link", { name: "Deep Work" });
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("renders plain text with no link when the url is missing", () => {
    render(<ItemTitle title="Deep Work" />);

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Deep Work")).toBeTruthy();
  });

  it("renders plain text with no link when the url is null or empty", () => {
    const { rerender } = render(<ItemTitle title="Deep Work" url={null} />);
    expect(screen.queryByRole("link")).toBeNull();

    rerender(<ItemTitle title="Deep Work" url="" />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Deep Work")).toBeTruthy();
  });

  it("does not linkify unsafe schemes", () => {
    for (const url of [
      "javascript:alert(1)",
      "JavaScript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "vbscript:msgbox(1)",
      "file:///etc/passwd",
    ]) {
      cleanup();
      render(<ItemTitle title="Deep Work" url={url} />);
      expect(screen.queryByRole("link")).toBeNull();
      expect(screen.getByText("Deep Work")).toBeTruthy();
    }
  });

  it("does not linkify a malformed url", () => {
    render(<ItemTitle title="Deep Work" url="not a url" />);

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Deep Work")).toBeTruthy();
  });

  it("still linkifies plain http urls", () => {
    render(<ItemTitle title="Deep Work" url="http://example.com/x" />);

    expect(screen.getByRole("link", { name: "Deep Work" })).toBeTruthy();
  });

  it("keeps the item-title class so list styling is unchanged in both states", () => {
    const { container, rerender } = render(<ItemTitle title="Deep Work" />);
    expect(container.querySelector(".item-title")).toBeTruthy();

    rerender(<ItemTitle title="Deep Work" url="https://example.com" />);
    expect(container.querySelector(".item-title")).toBeTruthy();
  });
});
