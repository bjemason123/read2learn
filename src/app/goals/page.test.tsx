// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { listGoals } from "@/lib/goals";
import GoalsPage from "./page";

vi.mock("@/lib/goals", () => ({ listGoals: vi.fn() }));

// The page reads the caller's id from the session cookie, which needs a
// Next.js request scope that does not exist under vitest.
vi.mock("@/lib/session", () => ({
  requireUserId: vi.fn(async () => "user_1"),
}));

const mockedListGoals = vi.mocked(listGoals);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function goal(
  id: string,
  title: string,
  readingItemCount: number,
): Awaited<ReturnType<typeof listGoals>>[number] {
  return {
    id,
    title,
    readingItems: Array.from({ length: readingItemCount }, (_, index) => ({
      id: `${id}-item-${index}`,
    })),
  } as unknown as Awaited<ReturnType<typeof listGoals>>[number];
}

describe("GoalsPage", () => {
  it("renders the empty state when there are no goals", async () => {
    mockedListGoals.mockResolvedValue([]);

    render(await GoalsPage());

    expect(screen.getByText(/You have no goals yet/)).toBeTruthy();
    const link = screen.getByRole("link", { name: "+ Create your first goal" });
    expect(link.getAttribute("href")).toBe("/goals/new");
  });

  it("renders each goal with a link to its detail page", async () => {
    mockedListGoals.mockResolvedValue([
      goal("goal-1", "Learn thermodynamics", 2),
      goal("goal-2", "Learn Rust", 1),
    ]);

    render(await GoalsPage());

    expect(
      screen
        .getByRole("link", { name: /Learn thermodynamics/ })
        .getAttribute("href"),
    ).toBe("/goals/goal-1");
    expect(
      screen.getByRole("link", { name: /Learn Rust/ }).getAttribute("href"),
    ).toBe("/goals/goal-2");
  });

  it("pluralizes the reading item count", async () => {
    mockedListGoals.mockResolvedValue([
      goal("goal-1", "Learn thermodynamics", 2),
      goal("goal-2", "Learn Rust", 1),
      goal("goal-3", "Learn Welsh", 0),
    ]);

    render(await GoalsPage());

    expect(screen.getByText("2 reading items")).toBeTruthy();
    expect(screen.getByText("1 reading item")).toBeTruthy();
    expect(screen.getByText("0 reading items")).toBeTruthy();
  });

  it("offers a new goal link when goals exist", async () => {
    mockedListGoals.mockResolvedValue([goal("goal-1", "Learn Rust", 1)]);

    render(await GoalsPage());

    expect(
      screen.getByRole("link", { name: "+ New goal" }).getAttribute("href"),
    ).toBe("/goals/new");
    expect(screen.queryByText(/You have no goals yet/)).toBeNull();
  });
});
