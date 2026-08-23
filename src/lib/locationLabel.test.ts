import { describe, expect, it } from "vitest";
import type { ItemType } from "@/generated/prisma/client";
import { locationLabelFor } from "@/lib/locationLabel";

const CASES: {
  type: ItemType;
  label: string;
  placeholder: string;
}[] = [
  { type: "BOOK", label: "Chapter", placeholder: "e.g. Chapter 3" },
  { type: "PAPER", label: "Section", placeholder: "e.g. §2.1 Methods" },
  { type: "ARTICLE", label: "Location", placeholder: "" },
  { type: "OTHER", label: "Location", placeholder: "" },
];

describe("locationLabelFor", () => {
  it.each(CASES)(
    "returns $label for $type",
    ({ type, label, placeholder }) => {
      expect(locationLabelFor(type)).toEqual({ label, placeholder });
    },
  );
});
