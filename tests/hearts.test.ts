import { describe, expect, it } from "vitest";
import {
  calculateHeartsRoundScores,
  createSingleDeck,
  dealHearts,
  determineHeartsTrickWinner,
  findTwoOfClubs,
  summarizeHeartsCapture,
  validateHeartsPlay,
  type HeartsTrickPlay,
} from "../convex/heartsGameLogic";

const ALL_HEARTS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"].map((r) => `${r}H`);

// Scores seat 0 only; the other three seats captured nothing.
const score = (cards: string[]) => calculateHeartsRoundScores([cards, [], [], []])[0];

const trick = (...cards: string[]): HeartsTrickPlay[] =>
  cards.map((c, seat) => ({ seat, cards: [c] }));

describe("dealHearts", () => {
  it("deals 4 hands of 13 using every card once", () => {
    const { hands } = dealHearts(createSingleDeck());
    expect(hands.map((h) => h.length)).toEqual([13, 13, 13, 13]);
    expect(new Set(hands.flat()).size).toBe(52);
  });
});

describe("findTwoOfClubs", () => {
  it("returns the seat holding 2C", () => {
    const deck = createSingleDeck();
    const { hands } = dealHearts(deck);
    expect(findTwoOfClubs(hands)).toBe(deck.indexOf("2C") % 4);
  });

  it("falls back to seat 0 when nobody has 2C", () => {
    expect(findTwoOfClubs([["3C"], ["4C"], ["5C"], ["6C"]])).toBe(0);
  });
});

describe("validateHeartsPlay", () => {
  it("rejects a card not in hand", () => {
    expect(validateHeartsPlay("AS", ["2C"], [])).toMatch(/not in your hand/);
  });

  it("allows any card when leading", () => {
    expect(validateHeartsPlay("AH", ["AH", "2C"], [])).toBeNull();
  });

  it("requires following the lead suit when able", () => {
    expect(validateHeartsPlay("AH", ["AH", "3C"], trick("2C"))).toMatch(/follow suit/);
    expect(validateHeartsPlay("3C", ["AH", "3C"], trick("2C"))).toBeNull();
  });

  it("allows any card when void in the lead suit", () => {
    expect(validateHeartsPlay("QD", ["QD", "AH"], trick("2C"))).toBeNull();
  });
});

describe("determineHeartsTrickWinner", () => {
  it("highest card of the lead suit wins", () => {
    expect(determineHeartsTrickWinner(trick("5S", "KS", "TS", "2S"))).toBe(1);
  });

  it("off-suit cards cannot win, however high", () => {
    expect(determineHeartsTrickWinner(trick("2S", "AH", "AD", "3S"))).toBe(3);
  });

  it("the lead wins when everyone else is off-suit", () => {
    expect(determineHeartsTrickWinner(trick("2C", "AH", "AD", "AS"))).toBe(0);
  });

  it("throws on an empty trick", () => {
    expect(() => determineHeartsTrickWinner([])).toThrow();
  });
});

// Common Gong Zhu (pagat.com). Positive = penalty: hearts and the pig cost points;
// the goat and a lone transformer earn them.
describe("calculateHeartsRoundScores", () => {
  it("scores nothing for non-scoring cards", () => {
    expect(score(["2S", "AS", "KC"])).toBe(0);
  });

  it("hearts use the common Gong Zhu ladder", () => {
    expect(ALL_HEARTS.map((h) => score([h]))).toEqual([0, 0, 0, 10, 10, 10, 10, 10, 10, 20, 30, 40, 50]);
  });

  it("the pig (QS) costs 100; QD scores nothing", () => {
    expect(score(["QS"])).toBe(100);
    expect(score(["QD"])).toBe(0);
  });

  it("the goat (JD) earns 100", () => {
    expect(score(["JD"])).toBe(-100);
    expect(score(["QS", "JD"])).toBe(0);
  });

  it("全红: all 13 hearts count -200, and flip the pig too", () => {
    expect(score(ALL_HEARTS)).toBe(-200);
    expect(score([...ALL_HEARTS, "QS"])).toBe(-300);
    expect(score([...ALL_HEARTS, "QS", "JD"])).toBe(-400);
    expect(score([...ALL_HEARTS, "TC"])).toBe(-400);
    // One heart short is still a penalty
    expect(score(ALL_HEARTS.slice(1))).toBe(200);
  });

  it("the transformer (TC) alone earns 50", () => {
    expect(score(["TC"])).toBe(-50);
    expect(score(["TC", "2S", "AC"])).toBe(-50);
  });

  it("the transformer doubles everything else", () => {
    expect(score(["TC", "AH"])).toBe(100);
    expect(score(["TC", "JD"])).toBe(-200);
    expect(score(["TC", "JD", "AH"])).toBe(-100);
  });

  it("scores each seat independently", () => {
    expect(calculateHeartsRoundScores([["AH"], ["JD"], ["TC"], []])).toEqual([50, -100, -50, 0]);
  });
});

describe("summarizeHeartsCapture", () => {
  it("flags 全红 and whether the 10♣ doubles", () => {
    expect(summarizeHeartsCapture([...ALL_HEARTS, "QS"])).toMatchObject({ allHearts: true, hasQS: true });
    expect(summarizeHeartsCapture(["TC", "AH"]).tcDoubles).toBe(true);
    expect(summarizeHeartsCapture(["TC", "2H"]).tcDoubles).toBe(false);
  });
});
