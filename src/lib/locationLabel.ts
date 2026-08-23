import type { ItemType } from "@/generated/prisma/client";

// Shared by the item create and edit forms so their option lists cannot drift.
export const ITEM_TYPES: ItemType[] = ["BOOK", "PAPER", "ARTICLE", "OTHER"];

export function locationLabelFor(type: ItemType): {
  label: string;
  placeholder: string;
} {
  switch (type) {
    case "BOOK":
      return { label: "Chapter", placeholder: "e.g. Chapter 3" };
    case "PAPER":
      return { label: "Section", placeholder: "e.g. §2.1 Methods" };
    default:
      return { label: "Location", placeholder: "" };
  }
}
