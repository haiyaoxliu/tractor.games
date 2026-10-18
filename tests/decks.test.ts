import { describe, expect, it } from "vitest";
import { createDoubleDeck } from "../convex/gameLogic";
import { createSingleDeck } from "../convex/heartsGameLogic";
import { createSkullKingDeck, createWizardDeck } from "../convex/bidGameLogic";

describe("deck sizes", () => {
  it.each([
    ["Tractor", createDoubleDeck, 108],
    ["Hearts", createSingleDeck, 52],
    ["Wizard", createWizardDeck, 60],
    ["Skull King", createSkullKingDeck, 69],
  ])("%s has %i cards", (_name, create, size) => {
    expect(create()).toHaveLength(size);
  });

  it("single-deck games have no duplicate cards", () => {
    for (const deck of [createSingleDeck(), createWizardDeck(), createSkullKingDeck()]) {
      expect(new Set(deck).size).toBe(deck.length);
    }
  });
});
