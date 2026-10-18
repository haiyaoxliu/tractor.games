import { describe, expect, it } from "vitest";
import {
  determineSkullKingTrickWinner,
  scoreSkullKingRound,
  skullKingTrickBonus,
  validateSkullKingPlay,
  type BidTrickPlay,
} from "../convex/bidGameLogic";

// Seats in play order: trick("05G", "SK") → seat 0 played 05G, seat 1 played SK
const trick = (...cards: string[]): BidTrickPlay[] =>
  cards.map((card, seat) => ({ seat, cards: [card] }));

describe("validateSkullKingPlay", () => {
  it("rejects a card not in hand", () => {
    expect(validateSkullKingPlay("05G", ["06G"], [])).not.toBeNull();
  });

  it("must follow the led suit when able", () => {
    expect(validateSkullKingPlay("03Y", ["03Y", "09G"], trick("05G"))).not.toBeNull();
    expect(validateSkullKingPlay("09G", ["03Y", "09G"], trick("05G"))).toBeNull();
  });

  it("may play off-suit when void in the led suit", () => {
    expect(validateSkullKingPlay("03Y", ["03Y", "07P"], trick("05G"))).toBeNull();
  });

  it("special cards are always legal", () => {
    for (const card of ["SK", "MM1", "PR1", "ES1"]) {
      expect(validateSkullKingPlay(card, [card, "09G"], trick("05G"))).toBeNull();
    }
  });

  it("an escape lead doesn't set the suit; the next suited card does", () => {
    expect(validateSkullKingPlay("03Y", ["03Y", "09G"], trick("ES1"))).toBeNull();
    expect(validateSkullKingPlay("03Y", ["03Y", "09G"], trick("ES1", "05G"))).not.toBeNull();
  });

  it("a special lead means no suit to follow", () => {
    expect(validateSkullKingPlay("03Y", ["03Y", "09G"], trick("PR1", "05G"))).toBeNull();
  });
});

describe("determineSkullKingTrickWinner", () => {
  it("mermaid beats Skull King", () => {
    expect(determineSkullKingTrickWinner(trick("SK", "MM1"))).toBe(1);
  });

  it("Skull King beats pirate", () => {
    expect(determineSkullKingTrickWinner(trick("PR1", "SK"))).toBe(1);
  });

  it("pirate beats mermaid", () => {
    expect(determineSkullKingTrickWinner(trick("MM1", "PR1"))).toBe(1);
  });

  it("mermaid wins when all three are played", () => {
    expect(determineSkullKingTrickWinner(trick("PR1", "SK", "MM1"))).toBe(2);
  });

  it("the first of two pirates wins", () => {
    expect(determineSkullKingTrickWinner(trick("05G", "PR2", "PR1"))).toBe(1);
  });

  it("black trumps the led suit", () => {
    expect(determineSkullKingTrickWinner(trick("14G", "01B", "13G"))).toBe(1);
  });

  it("the highest card of the led suit wins", () => {
    expect(determineSkullKingTrickWinner(trick("05G", "14Y", "09G"))).toBe(2);
  });

  it("all escapes: the leader wins", () => {
    expect(determineSkullKingTrickWinner(trick("ES1", "ES2", "ES3"))).toBe(0);
  });
});

describe("skullKingTrickBonus", () => {
  it("+10 for each standard 14 and +20 for the black 14", () => {
    const plays = trick("14G", "14Y", "14B");
    expect(skullKingTrickBonus(plays, 2)).toBe(40);
  });

  it("+30 for each pirate captured by the Skull King", () => {
    expect(skullKingTrickBonus(trick("PR1", "SK", "PR2"), 1)).toBe(60);
  });

  it("no bonus for an ordinary trick", () => {
    expect(skullKingTrickBonus(trick("05G", "09G"), 1)).toBe(0);
  });

  it("+40 when a mermaid captures the Skull King", () => {
    expect(skullKingTrickBonus(trick("SK", "MM1"), 1)).toBe(40);
  });

  it("+20 for each mermaid captured by a pirate", () => {
    expect(skullKingTrickBonus(trick("MM1", "PR1", "MM2"), 1)).toBe(40);
  });
});

describe("scoreSkullKingRound", () => {
  it("exact bid scores 20 per trick plus bonus", () => {
    expect(scoreSkullKingRound([3], [3], [30], 5)).toEqual([90]);
  });

  it("bid 0 made scores 10 × round plus bonus", () => {
    expect(scoreSkullKingRound([0], [0], [10], 7)).toEqual([80]);
  });

  it("bid 0 missed scores −10 × round", () => {
    expect(scoreSkullKingRound([0], [2], [0], 7)).toEqual([-70]);
  });

  it("a miss is −10 per trick off, with no bonus", () => {
    expect(scoreSkullKingRound([2, 4], [4, 3], [30, 20], 6)).toEqual([-20, -10]);
  });
});
