// Pure logic for bid-based trick games (Wizard & Skull King) — no Convex imports
//
// Card encodings:
//   Wizard:     standard "AS".."2C" (rank+suit), wizards "WZ1".."WZ4", jesters "JE1".."JE4"
//   Skull King: "01G".."14G" parrots (green), "..Y" chests (yellow), "..P" maps (purple),
//               "..B" Jolly Roger (black, always trump); specials "SK" skull king,
//               "MM1"/"MM2" mermaids, "PR1".."PR5" pirates, "ES1".."ES5" escapes

export type BidGameType = "wizard" | "skullking";

export interface BidTrickPlay {
  seat: number;
  cards: string[]; // always a single card, array for component consistency
}

// ─── Player counts & rounds ──────────────────────────────────────────────────

export const BID_GAME_LIMITS: Record<BidGameType, { min: number; max: number }> = {
  wizard: { min: 3, max: 6 },
  skullking: { min: 3, max: 6 },
};

export function totalRoundsFor(gameType: BidGameType, numPlayers: number): number {
  if (gameType === "wizard") return Math.floor(60 / numPlayers);
  return 10;
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

export function shuffleCards(cards: string[]): string[] {
  const a = [...cards];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function dealBidRound(
  deck: string[],
  numPlayers: number,
  cardsEach: number
): { hands: string[][]; rest: string[] } {
  const hands: string[][] = Array.from({ length: numPlayers }, () => []);
  for (let i = 0; i < numPlayers * cardsEach; i++) {
    hands[i % numPlayers].push(deck[i]);
  }
  return { hands, rest: deck.slice(numPlayers * cardsEach) };
}

const RANK_ORDER: Record<string, number> = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
  T: 10, J: 11, Q: 12, K: 13, A: 14,
};

// ─── Wizard ──────────────────────────────────────────────────────────────────

const WIZ_SUITS = ["S", "H", "D", "C"] as const;
const WIZ_RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"] as const;

export function createWizardDeck(): string[] {
  const deck: string[] = [];
  for (const suit of WIZ_SUITS) {
    for (const rank of WIZ_RANKS) deck.push(`${rank}${suit}`);
  }
  for (let i = 1; i <= 4; i++) deck.push(`WZ${i}`);
  for (let i = 1; i <= 4; i++) deck.push(`JE${i}`);
  return deck; // 60 cards
}

export function isWizard(card: string): boolean {
  return card.startsWith("WZ");
}

export function isJester(card: string): boolean {
  return card.startsWith("JE");
}

function wizardSuit(card: string): string | null {
  if (isWizard(card) || isJester(card)) return null;
  return card[1];
}

// Led suit for the trick, or null if none (wizard led / only jesters so far)
function wizardLedSuit(plays: BidTrickPlay[]): string | null {
  for (const p of plays) {
    const card = p.cards[0];
    if (isWizard(card)) return null; // wizard before any suit card: free trick
    if (isJester(card)) continue;
    return wizardSuit(card);
  }
  return null;
}

export function validateWizardPlay(
  card: string,
  hand: string[],
  currentTrick: BidTrickPlay[]
): string | null {
  if (!hand.includes(card)) return "Card is not in your hand";
  if (isWizard(card) || isJester(card)) return null;
  if (currentTrick.length === 0) return null;

  const ledSuit = wizardLedSuit(currentTrick);
  if (!ledSuit) return null;
  if (wizardSuit(card) === ledSuit) return null;
  const hasLedSuit = hand.some((c) => wizardSuit(c) === ledSuit);
  if (hasLedSuit) return "Must follow the led suit (or play a Wizard/Jester)";
  return null;
}

export function determineWizardTrickWinner(
  plays: BidTrickPlay[],
  trumpSuit: string | undefined // "S"|"H"|"D"|"C" or "none"/undefined
): number {
  // First wizard wins
  for (const p of plays) {
    if (isWizard(p.cards[0])) return p.seat;
  }
  const suited = plays.filter((p) => !isJester(p.cards[0]));
  // All jesters: first jester (leader) wins
  if (suited.length === 0) return plays[0].seat;

  const strength = (card: string) => RANK_ORDER[card[0]] ?? 0;

  if (trumpSuit && trumpSuit !== "none") {
    const trumps = suited.filter((p) => wizardSuit(p.cards[0]) === trumpSuit);
    if (trumps.length > 0) {
      return trumps.reduce((best, p) =>
        strength(p.cards[0]) > strength(best.cards[0]) ? p : best
      ).seat;
    }
  }

  const ledSuit = wizardSuit(suited[0].cards[0]);
  const followers = suited.filter((p) => wizardSuit(p.cards[0]) === ledSuit);
  return followers.reduce((best, p) =>
    strength(p.cards[0]) > strength(best.cards[0]) ? p : best
  ).seat;
}

// Wizard scoring: exact bid → 20 + 10/trick; miss → -10 per trick off
export function scoreWizardRound(bids: number[], tricksWon: number[]): number[] {
  return bids.map((bid, i) =>
    bid === tricksWon[i] ? 20 + 10 * bid : -10 * Math.abs(bid - tricksWon[i])
  );
}

const WIZ_SUIT_ORDER: Record<string, number> = { C: 0, D: 1, S: 2, H: 3 };

export function sortWizardHand(hand: string[]): string[] {
  const group = (c: string) => (isJester(c) ? 0 : isWizard(c) ? 2 : 1);
  return [...hand].sort((a, b) => {
    if (group(a) !== group(b)) return group(a) - group(b);
    if (group(a) !== 1) return a.localeCompare(b);
    const sa = WIZ_SUIT_ORDER[a[1]] ?? 0;
    const sb = WIZ_SUIT_ORDER[b[1]] ?? 0;
    if (sa !== sb) return sa - sb;
    return (RANK_ORDER[a[0]] ?? 0) - (RANK_ORDER[b[0]] ?? 0);
  });
}

// ─── Skull King ──────────────────────────────────────────────────────────────

const SK_SUITS = ["G", "Y", "P", "B"] as const; // parrot, chest, map, jolly roger

export function createSkullKingDeck(): string[] {
  const deck: string[] = [];
  for (const suit of SK_SUITS) {
    for (let rank = 1; rank <= 14; rank++) {
      deck.push(`${String(rank).padStart(2, "0")}${suit}`);
    }
  }
  deck.push("SK");
  for (let i = 1; i <= 2; i++) deck.push(`MM${i}`);
  for (let i = 1; i <= 5; i++) deck.push(`PR${i}`);
  for (let i = 1; i <= 5; i++) deck.push(`ES${i}`);
  return deck; // 69 cards
}

export type SkCardKind = "suit" | "skullking" | "mermaid" | "pirate" | "escape";

export function skKind(card: string): SkCardKind {
  if (card === "SK") return "skullking";
  if (card.startsWith("MM")) return "mermaid";
  if (card.startsWith("PR")) return "pirate";
  if (card.startsWith("ES")) return "escape";
  return "suit";
}

export function skSuit(card: string): string | null {
  return skKind(card) === "suit" ? card[2] : null;
}

export function skRank(card: string): number {
  return skKind(card) === "suit" ? parseInt(card.slice(0, 2), 10) : 0;
}

// Led suit: skip escapes; first suited card sets it; a leading pirate/mermaid/SK
// means no suit obligation for the whole trick.
function skLedSuit(plays: BidTrickPlay[]): string | null {
  for (const p of plays) {
    const kind = skKind(p.cards[0]);
    if (kind === "escape") continue;
    if (kind === "suit") return skSuit(p.cards[0]);
    return null; // pirate/mermaid/SK before any suit card
  }
  return null;
}

export function validateSkullKingPlay(
  card: string,
  hand: string[],
  currentTrick: BidTrickPlay[]
): string | null {
  if (!hand.includes(card)) return "Card is not in your hand";
  if (skKind(card) !== "suit") return null; // specials always legal
  if (currentTrick.length === 0) return null;

  const ledSuit = skLedSuit(currentTrick);
  if (!ledSuit) return null;
  if (skSuit(card) === ledSuit) return null;
  const hasLedSuit = hand.some((c) => skSuit(c) === ledSuit);
  if (hasLedSuit) return "Must follow the led suit (or play a special card)";
  return null;
}

export function determineSkullKingTrickWinner(plays: BidTrickPlay[]): number {
  const kinds = plays.map((p) => skKind(p.cards[0]));
  const firstOf = (kind: SkCardKind) => plays[kinds.indexOf(kind)];

  const hasSK = kinds.includes("skullking");
  const hasMermaid = kinds.includes("mermaid");
  const hasPirate = kinds.includes("pirate");

  // Rock-paper-scissors: mermaid > SK > pirate > mermaid; all three → mermaid
  if (hasSK && hasMermaid) return firstOf("mermaid").seat;
  if (hasSK) return firstOf("skullking").seat;
  if (hasPirate) return firstOf("pirate").seat;
  if (hasMermaid) return firstOf("mermaid").seat;

  const suitedPlays = plays.filter((p) => skKind(p.cards[0]) === "suit");
  if (suitedPlays.length === 0) return plays[0].seat; // all escapes: leader wins

  const black = suitedPlays.filter((p) => skSuit(p.cards[0]) === "B");
  const pool = black.length > 0
    ? black
    : suitedPlays.filter((p) => skSuit(p.cards[0]) === skSuit(suitedPlays[0].cards[0]));
  return pool.reduce((best, p) =>
    skRank(p.cards[0]) > skRank(best.cards[0]) ? p : best
  ).seat;
}

// Bonus points credited to the trick winner (paid out only if their bid is exact):
// standard 14s +10, black 14 +20, SK captures pirates +30 each, mermaid captures SK +40,
// pirate captures mermaids +20 each
export function skullKingTrickBonus(plays: BidTrickPlay[], winnerSeat: number): number {
  let bonus = 0;
  const winnerCard = plays.find((p) => p.seat === winnerSeat)!.cards[0];
  const winnerKind = skKind(winnerCard);

  for (const p of plays) {
    const card = p.cards[0];
    if (skKind(card) === "suit" && skRank(card) === 14) {
      bonus += skSuit(card) === "B" ? 20 : 10;
    }
    if (winnerKind === "skullking" && skKind(card) === "pirate") bonus += 30;
    if (winnerKind === "mermaid" && skKind(card) === "skullking") bonus += 40;
    if (winnerKind === "pirate" && skKind(card) === "mermaid") bonus += 20;
  }
  return bonus;
}

// Skull King scoring: bid>0 exact → 20/trick + bonus; bid 0 exact → 10×round + bonus;
// miss → -10 per trick off (or -10×round for a failed 0 bid). Bonuses require exact bid.
export function scoreSkullKingRound(
  bids: number[],
  tricksWon: number[],
  bonuses: number[],
  roundNumber: number
): number[] {
  return bids.map((bid, i) => {
    if (bid === 0) {
      return tricksWon[i] === 0 ? 10 * roundNumber + bonuses[i] : -10 * roundNumber;
    }
    return bid === tricksWon[i]
      ? 20 * bid + bonuses[i]
      : -10 * Math.abs(bid - tricksWon[i]);
  });
}

const SK_SUIT_ORDER: Record<string, number> = { G: 0, Y: 1, P: 2, B: 3 };
const SK_KIND_ORDER: Record<SkCardKind, number> = {
  escape: 0, suit: 1, mermaid: 2, pirate: 3, skullking: 4,
};

export function sortSkullKingHand(hand: string[]): string[] {
  return [...hand].sort((a, b) => {
    const ka = skKind(a);
    const kb = skKind(b);
    if (ka !== kb || ka !== "suit") {
      if (SK_KIND_ORDER[ka] !== SK_KIND_ORDER[kb]) return SK_KIND_ORDER[ka] - SK_KIND_ORDER[kb];
      return a.localeCompare(b);
    }
    const sa = SK_SUIT_ORDER[skSuit(a)!] ?? 0;
    const sb = SK_SUIT_ORDER[skSuit(b)!] ?? 0;
    if (sa !== sb) return sa - sb;
    return skRank(a) - skRank(b);
  });
}

// ─── Dispatch by game type ───────────────────────────────────────────────────

export function validateBidPlay(
  gameType: BidGameType,
  card: string,
  hand: string[],
  currentTrick: BidTrickPlay[]
): string | null {
  return gameType === "wizard"
    ? validateWizardPlay(card, hand, currentTrick)
    : validateSkullKingPlay(card, hand, currentTrick);
}

export function determineBidTrickWinner(
  gameType: BidGameType,
  plays: BidTrickPlay[],
  trumpSuit: string | undefined
): number {
  return gameType === "wizard"
    ? determineWizardTrickWinner(plays, trumpSuit)
    : determineSkullKingTrickWinner(plays);
}

export function sortBidHand(gameType: BidGameType, hand: string[]): string[] {
  return gameType === "wizard" ? sortWizardHand(hand) : sortSkullKingHand(hand);
}
