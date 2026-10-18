import { describe, expect, it } from "vitest";
import {
  determineWizardTrickWinner,
  scoreWizardRound,
  totalRoundsFor,
  validateWizardPlay,
  type BidTrickPlay,
} from "../convex/bidGameLogic";

// Build a trick from cards played in seat order 0, 1, 2, ...
const trick = (...cards: string[]): BidTrickPlay[] =>
  cards.map((card, seat) => ({ seat, cards: [card] }));

describe("validateWizardPlay", () => {
  it("rejects a card not in hand", () => {
    expect(validateWizardPlay("AS", ["KH"], [])).not.toBeNull();
  });

  it("allows any card when leading", () => {
    expect(validateWizardPlay("2C", ["2C", "AS"], [])).toBeNull();
  });

  it("must follow the led suit when able", () => {
    expect(validateWizardPlay("AS", ["AS", "3H"], trick("KH"))).not.toBeNull();
    expect(validateWizardPlay("3H", ["AS", "3H"], trick("KH"))).toBeNull();
  });

  it("may play off-suit when void in the led suit", () => {
    expect(validateWizardPlay("AS", ["AS", "2C"], trick("KH"))).toBeNull();
  });

  it("wizards and jesters are always legal", () => {
    const hand = ["WZ1", "JE1", "3H"];
    expect(validateWizardPlay("WZ1", hand, trick("KH"))).toBeNull();
    expect(validateWizardPlay("JE1", hand, trick("KH"))).toBeNull();
  });

  it("a wizard led means no suit to follow", () => {
    expect(validateWizardPlay("AS", ["AS", "3H"], trick("WZ1", "KH"))).toBeNull();
  });

  it("jesters before the first suited card don't set the suit", () => {
    const hand = ["AS", "3H"];
    expect(validateWizardPlay("AS", hand, trick("JE1"))).toBeNull();
    expect(validateWizardPlay("AS", hand, trick("JE1", "KH"))).not.toBeNull();
  });
});

describe("determineWizardTrickWinner", () => {
  it("the first wizard wins", () => {
    expect(determineWizardTrickWinner(trick("AH", "WZ1", "WZ2"), "H")).toBe(1);
  });

  it("all jesters means the leader wins", () => {
    expect(determineWizardTrickWinner(trick("JE1", "JE2", "JE3"), "S")).toBe(0);
  });

  it("the highest trump wins", () => {
    expect(determineWizardTrickWinner(trick("AH", "2S", "KS"), "S")).toBe(2);
  });

  it("with no trump played, the highest of the led suit wins", () => {
    expect(determineWizardTrickWinner(trick("9H", "AC", "QH"), "S")).toBe(2);
  });

  it("a jester lead hands the led suit to the first suited card", () => {
    expect(determineWizardTrickWinner(trick("JE1", "5D", "AH"), "S")).toBe(1);
  });

  it('"none" trump: off-suit cards never win', () => {
    expect(determineWizardTrickWinner(trick("3C", "AS", "4C"), "none")).toBe(2);
    expect(determineWizardTrickWinner(trick("3C", "AS", "4C"), undefined)).toBe(2);
  });
});

describe("scoreWizardRound", () => {
  it("an exact bid scores 20 + 10 per trick", () => {
    expect(scoreWizardRound([3], [3])).toEqual([50]);
  });

  it("an exact bid of 0 scores 20", () => {
    expect(scoreWizardRound([0], [0])).toEqual([20]);
  });

  it("a miss is -10 per trick off, over or under", () => {
    expect(scoreWizardRound([2, 1, 0], [0, 3, 1])).toEqual([-20, -20, -10]);
  });
});

describe("totalRoundsFor wizard", () => {
  it.each([
    [3, 20],
    [4, 15],
    [5, 12],
    [6, 10],
  ])("%i players play %i rounds", (players, rounds) => {
    expect(totalRoundsFor("wizard", players)).toBe(rounds);
  });
});
