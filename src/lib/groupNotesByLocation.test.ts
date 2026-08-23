import { describe, expect, it } from "vitest";
import { groupNotesByLocation } from "@/lib/groupNotesByLocation";

describe("groupNotesByLocation", () => {
  it("groups notes sharing a location", () => {
    const groups = groupNotesByLocation([
      { id: "a", location: "Chapter 1", order: 0 },
      { id: "b", location: "Chapter 1", order: 1 },
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].location).toBe("Chapter 1");
    expect(groups[0].notes.map((note) => note.id)).toEqual(["a", "b"]);
  });

  it("orders groups by their lowest order", () => {
    const groups = groupNotesByLocation([
      { id: "a", location: "Chapter 9", order: 0 },
      { id: "b", location: "Chapter 3", order: 1 },
      { id: "c", location: "Chapter 9", order: 5 },
    ]);

    expect(groups.map((group) => group.location)).toEqual([
      "Chapter 9",
      "Chapter 3",
    ]);
  });

  it("sorts the Unfiled (null location) group last", () => {
    const groups = groupNotesByLocation([
      { id: "a", location: null, order: 0 },
      { id: "b", location: "Chapter 3", order: 1 },
      { id: "c", location: "Chapter 9", order: 2 },
    ]);

    expect(groups.map((group) => group.location)).toEqual([
      "Chapter 3",
      "Chapter 9",
      null,
    ]);
  });

  it("preserves note order within a group", () => {
    const groups = groupNotesByLocation([
      { id: "a", location: "Intro", order: 0 },
      { id: "b", location: "Intro", order: 0 },
      { id: "c", location: "Intro", order: 1 },
    ]);

    expect(groups[0].notes.map((note) => note.id)).toEqual(["a", "b", "c"]);
  });

  it("keeps ties between groups stable", () => {
    const groups = groupNotesByLocation([
      { id: "a", location: "First", order: 2 },
      { id: "b", location: "Second", order: 2 },
    ]);

    expect(groups.map((group) => group.location)).toEqual(["First", "Second"]);
  });

  it("returns an empty array for no notes", () => {
    expect(groupNotesByLocation([])).toEqual([]);
  });
});
