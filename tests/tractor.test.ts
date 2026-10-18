import { describe, expect, it } from "vitest";
import {
  calculateRankChange,
  cardStrength,
  createDoubleDeck,
  deal,
  determineTrickWinner,
  determineWinner,
  getEffectiveSuit,
  getPlayType,
  isTractor,
  isTrumpCard,
  kittyBonus,
  pointValue,
  shuffle,
  totalPoints,
  validatePlay,
} from "../convex/gameLogic";

// Most cases: trump suit spades, trump rank 5.
const S = "S";
const R = "5";

describe("deal", () => {
  it("gives 4 hands of 25 and a kitty of 8", () => {
    const { hands, kitty } = deal(shuffle(createDoubleDeck()));
    expect(hands.map(h => h.length)).toEqual([25, 25, 25, 25]);
    expect(kitty).toHaveLength(8);
  });

  it("uses every card of the 108-card deck exactly once", () => {
    const deck = createDoubleDeck();
    const { hands, kitty } = deal(deck);
    expect([...hands.flat(), ...kitty].sort()).toEqual([...deck].sort());
  });
});

describe("trump membership", () => {
  it("jokers, trump-rank cards of any suit and trump-suit cards are trump", () => {
    for (const c of ["JK", "jk", "5H", "5S", "3S"]) {
      expect(isTrumpCard(c, S, R)).toBe(true);
    }
    expect(isTrumpCard("3H", S, R)).toBe(false);
  });

  it("trump cards have effective suit TRUMP; others keep their suit", () => {
    expect(getEffectiveSuit("5D", S, R)).toBe("TRUMP");
    expect(getEffectiveSuit("KH", S, R)).toBe("H");
  });

  it("with no trump suit only jokers and trump-rank cards are trump", () => {
    expect(isTrumpCard("3S", S, R, true)).toBe(false);
    expect(isTrumpCard("5H", S, R, true)).toBe(true);
    expect(isTrumpCard("jk", undefined, R, true)).toBe(true);
  });
});

describe("cardStrength", () => {
  it("orders the top of trump: JK > jk > trump rank in suit > off-suit > trump A", () => {
    const order = ["JK", "jk", "5S", "5H", "AS"].map(c => cardStrength(c, S, R));
    expect([...order].sort((a, b) => b - a)).toEqual(order);
    expect(new Set(order).size).toBe(5);
  });

  it("any trump beats the ace of a plain suit", () => {
    expect(cardStrength("2S", S, R)).toBeGreaterThan(cardStrength("AH", S, R));
  });

  it("with no trump suit all trump-rank cards are equal", () => {
    expect(cardStrength("5H", S, R, true)).toBe(cardStrength("5S", S, R, true));
  });
});

describe("points", () => {
  it("5 is worth 5, 10 and K are worth 10, others 0", () => {
    expect(["5H", "TH", "KH", "AH", "JK"].map(pointValue)).toEqual([5, 10, 10, 0, 0]);
  });

  it("a whole 108-card deck is 200 points", () => {
    expect(totalPoints(createDoubleDeck())).toBe(200);
  });
});

describe("getPlayType / isTractor", () => {
  it("two identical cards are a pair; two different ones are invalid", () => {
    expect(getPlayType(["KH", "KH"], S, R)).toBe("pair");
    expect(getPlayType(["KH", "QH"], S, R)).toBe("invalid");
  });

  it("consecutive pairs of a plain suit are a tractor", () => {
    expect(isTractor(["8H", "8H", "9H", "9H"], S, R)).toBe(true);
    expect(isTractor(["8H", "8H", "TH", "TH"], S, R)).toBe(false);
  });

  it("pairs across the trump-rank gap are a tractor (44-66 with rank 5)", () => {
    expect(isTractor(["4H", "4H", "6H", "6H"], S, R)).toBe(true);
  });

  // Skipped (looks wrong, game-mechanics work tabled): getSuitStrengthOrder lists A before 2 and leaves 2 out of plain suits.
  it.skip("KK-AA and 22-33 are tractors", () => {
    expect(isTractor(["KH", "KH", "AH", "AH"], S, R)).toBe(true);
    expect(isTractor(["2H", "2H", "3H", "3H"], S, R)).toBe(true);
  });

  // Skipped (same cause): trump A is first in getSuitStrengthOrder, so it never chains into the trump-rank pairs.
  it.skip("trump A pair + off-suit trump-rank pair + in-suit trump-rank pair is a tractor", () => {
    expect(isTractor(["AS", "AS", "5H", "5H", "5S", "5S"], S, R)).toBe(true);
  });

  it("small joker pair + big joker pair is a tractor", () => {
    expect(getPlayType(["jk", "jk", "JK", "JK"], S, R)).toBe("tractor");
  });

  // Skipped: the code treats two different off-suit trump-rank cards (5H + 5D) as a pair
  // because they have equal strength. Most rule sets require identical cards. Tabled with the user.
  it.skip("off-suit trump-rank cards of different suits are not a pair", () => {
    expect(getPlayType(["5H", "5D"], S, R)).toBe("invalid");
  });
});

describe("determineTrickWinner", () => {
  it("highest card of the led suit wins", () => {
    const plays = [
      { seat: 0, cards: ["9H"] },
      { seat: 1, cards: ["KH"] },
      { seat: 2, cards: ["AD"] },
      { seat: 3, cards: ["QH"] },
    ];
    expect(determineTrickWinner(plays, S, R)).toBe(1);
  });

  it("a trump beats the led plain suit", () => {
    const plays = [
      { seat: 0, cards: ["AH"] },
      { seat: 1, cards: ["2S"] },
      { seat: 2, cards: ["KH"] },
      { seat: 3, cards: ["5D"] },
    ];
    expect(determineTrickWinner(plays, S, R)).toBe(3);
  });

  it("on a pair lead, only a matching pair can win", () => {
    const plays = [
      { seat: 0, cards: ["9H", "9H"] },
      { seat: 1, cards: ["AH", "KH"] },
      { seat: 2, cards: ["2S", "2S"] },
      { seat: 3, cards: ["JK", "jk"] },
    ];
    expect(determineTrickWinner(plays, S, R)).toBe(2);
  });

  it("equal cards: the first played wins", () => {
    const plays = [
      { seat: 2, cards: ["KH"] },
      { seat: 3, cards: ["KH"] },
    ];
    expect(determineTrickWinner(plays, S, R)).toBe(2);
  });
});

describe("validatePlay", () => {
  it("rejects a card not in hand", () => {
    expect(validatePlay(["AH"], ["KH"], null, S, R)).toMatch(/not in your hand/);
  });

  it("must follow the led suit when able, may play anything when void", () => {
    const lead = { seat: 0, cards: ["9H"] };
    expect(validatePlay(["3D"], ["3D", "4H"], lead, S, R)).not.toBeNull();
    expect(validatePlay(["4H"], ["3D", "4H"], lead, S, R)).toBeNull();
    expect(validatePlay(["3D"], ["3D", "4C"], lead, S, R)).toBeNull();
  });

  it("on a pair lead, must play a pair of that suit if holding one", () => {
    const lead = { seat: 0, cards: ["9H", "9H"] };
    const hand = ["3H", "4H", "7H", "7H"];
    expect(validatePlay(["3H", "4H"], hand, lead, S, R)).not.toBeNull();
    expect(validatePlay(["7H", "7H"], hand, lead, S, R)).toBeNull();
  });

  it("on a tractor lead, must play a tractor of that suit if holding one", () => {
    const lead = { seat: 0, cards: ["8H", "8H", "9H", "9H"] };
    const hand = ["3H", "3H", "6H", "6H", "7H", "7H"];
    expect(validatePlay(["3H", "3H", "6H", "6H"], hand, lead, S, R)).not.toBeNull();
    expect(validatePlay(["6H", "6H", "7H", "7H"], hand, lead, S, R)).toBeNull();
  });
});

describe("scoring", () => {
  it("rank change brackets at 40 / 80 / 120 / 160 / 200", () => {
    expect(calculateRankChange(35)).toEqual({ attackerChange: 0, defenderChange: 2 });
    expect(calculateRankChange(40)).toEqual({ attackerChange: 0, defenderChange: 1 });
    expect(calculateRankChange(80)).toEqual({ attackerChange: 0, defenderChange: 0 });
    expect(calculateRankChange(120)).toEqual({ attackerChange: 1, defenderChange: 0 });
    expect(calculateRankChange(160)).toEqual({ attackerChange: 2, defenderChange: 0 });
    expect(calculateRankChange(200)).toEqual({ attackerChange: 3, defenderChange: 0 });
  });

  // Skipped: the code gives defenders +2 when attackers score 0. The common rule is +3. Tabled with the user.
  it.skip("attackers scoring 0 gives defenders +3", () => {
    expect(calculateRankChange(0)).toEqual({ attackerChange: 0, defenderChange: 3 });
  });

  it("attackers win at 80 points or more", () => {
    expect(determineWinner(75, 1)).toBe("defenders");
    expect(determineWinner(80, 1)).toBe("attackers");
  });

  it("kitty points are doubled for attackers who win the last trick, else 0", () => {
    const kitty = ["5H", "KD", "3C"]; // 15 points
    expect(kittyBonus(kitty, 1, 0)).toBe(30); // seat 1 is an attacker vs declarer 0
    expect(kittyBonus(kitty, 2, 0)).toBe(0); // seat 2 is declarer's partner
  });
});
