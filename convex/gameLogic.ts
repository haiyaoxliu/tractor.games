// Pure game logic — no Convex imports, fully testable

const SUITS = ["S", "H", "D", "C"] as const; // Spades, Hearts, Diamonds, Clubs
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K"] as const;

/** Rank progression order for trump rank advancement (index 0="2", 12="A") */
export const PROGRESSION_RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"] as const;

export type Suit = (typeof SUITS)[number];
export type Card = string; // e.g. "2S", "TH", "JK" (big joker), "jk" (small joker)

// ─── Deck ────────────────────────────────────────────────────────────────────

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(`${rank}${suit}`);
    }
  }
  deck.push("JK"); // big joker
  deck.push("jk"); // small joker
  return deck;
}

export function createDoubleDeck(): Card[] {
  return [...createDeck(), ...createDeck()];
}

export function shuffle(cards: Card[]): Card[] {
  const a = [...cards];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function deal(deck: Card[]): { hands: Card[][]; kitty: Card[] } {
  const hands: Card[][] = [[], [], [], []];
  // Deal 25 cards to each player (100 total), 8 remain for kitty
  for (let i = 0; i < 100; i++) {
    hands[i % 4].push(deck[i]);
  }
  const kitty = deck.slice(100, 108);
  return { hands, kitty };
}

// ─── Card Properties ─────────────────────────────────────────────────────────

export function isJoker(card: Card): boolean {
  return card === "JK" || card === "jk";
}

export function isBigJoker(card: Card): boolean {
  return card === "JK";
}

export function isSmallJoker(card: Card): boolean {
  return card === "jk";
}

export function getRank(card: Card): string {
  if (isJoker(card)) return card;
  return card[0];
}

export function getSuit(card: Card): string {
  if (isJoker(card)) return "JOKER";
  return card[1];
}

export function isTrumpCard(card: Card, trumpSuit: string | undefined, trumpRank: string, noTrumpSuit?: boolean): boolean {
  if (isJoker(card)) return true;
  if (getRank(card) === trumpRank) return true;
  if (!noTrumpSuit && trumpSuit && getSuit(card) === trumpSuit) return true;
  return false;
}

/** Get the effective suit of a card (trump cards belong to "TRUMP" suit) */
export function getEffectiveSuit(card: Card, trumpSuit: string | undefined, trumpRank: string, noTrumpSuit?: boolean): string {
  if (isTrumpCard(card, trumpSuit, trumpRank, noTrumpSuit)) return "TRUMP";
  return getSuit(card);
}

// ─── Card Ordering (for comparison within a trick) ───────────────────────────

const RANK_ORDER: Record<string, number> = {
  "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
  "T": 10, "J": 11, "Q": 12, "K": 13, "A": 14,
};

/**
 * Returns numeric strength of a card for trick comparison.
 * Higher = stronger.
 */
export function cardStrength(card: Card, trumpSuit: string | undefined, trumpRank: string, noTrumpSuit?: boolean): number {
  if (isBigJoker(card)) return 1000;
  if (isSmallJoker(card)) return 999;

  const rank = getRank(card);
  const suit = getSuit(card);

  if (noTrumpSuit) {
    // No trump suit mode: trump rank cards all equal at 997, no suit bonus
    if (rank === trumpRank) return 997;
    return RANK_ORDER[rank] ?? 0;
  }

  // Trump rank in trump suit is highest non-joker
  if (rank === trumpRank && suit === trumpSuit) return 998;
  // Trump rank in other suits
  if (rank === trumpRank) return 997;

  // Trump suit cards
  if (trumpSuit && suit === trumpSuit) {
    return 500 + (RANK_ORDER[rank] ?? 0);
  }

  // Non-trump cards
  return RANK_ORDER[rank] ?? 0;
}

// ─── Point Values ────────────────────────────────────────────────────────────

export function pointValue(card: Card): number {
  if (isJoker(card)) return 0;
  const rank = getRank(card);
  if (rank === "5") return 5;
  if (rank === "T" || rank === "K") return 10;
  return 0;
}

export function totalPoints(cards: Card[]): number {
  return cards.reduce((sum, c) => sum + pointValue(c), 0);
}

// ─── Tractor Detection ──────────────────────────────────────────────────────

/**
 * Get the ordered list of card strengths for a given effective suit,
 * used to determine consecutive pairs for tractors.
 * Excludes the trump rank from non-trump suits (since those are in TRUMP suit).
 */
export function getSuitStrengthOrder(suit: string, trumpSuit: string | undefined, trumpRank: string, noTrumpSuit?: boolean): number[] {
  if (suit === "TRUMP") {
    // Trump suit ordering: non-trump-rank cards in trump suit (by rank order),
    // then trump rank off-suit (997), trump rank in-suit (998), small joker (999), big joker (1000)
    const strengths: number[] = [];
    if (!noTrumpSuit && trumpSuit) {
      // Trump suit non-trump-rank cards
      for (const rank of RANKS) {
        if (rank === trumpRank) continue;
        strengths.push(500 + (RANK_ORDER[rank] ?? 0));
      }
    }
    // Trump rank off-suit
    strengths.push(997);
    if (!noTrumpSuit && trumpSuit) {
      // Trump rank in trump suit
      strengths.push(998);
    }
    strengths.push(999); // small joker
    strengths.push(1000); // big joker
    return strengths;
  }

  // Non-trump suit: all ranks except trump rank
  const strengths: number[] = [];
  for (const rank of RANKS) {
    if (rank === trumpRank) continue;
    const val = RANK_ORDER[rank] ?? 0;
    if (val > 0) strengths.push(val);
  }
  return strengths;
}

/**
 * Check if the given cards form a valid tractor (2+ consecutive pairs in the same effective suit).
 */
export function isTractor(cards: Card[], trumpSuit: string | undefined, trumpRank: string, noTrumpSuit?: boolean): boolean {
  if (cards.length < 4 || cards.length % 2 !== 0) return false;

  // All cards must be same effective suit
  const suits = cards.map(c => getEffectiveSuit(c, trumpSuit, trumpRank, noTrumpSuit));
  if (!suits.every(s => s === suits[0])) return false;

  const effectiveSuit = suits[0];

  // Group by card strength and verify pairs
  const strengthMap = new Map<number, number>();
  for (const c of cards) {
    const s = cardStrength(c, trumpSuit, trumpRank, noTrumpSuit);
    strengthMap.set(s, (strengthMap.get(s) ?? 0) + 1);
  }

  // Every group must be exactly a pair
  for (const count of strengthMap.values()) {
    if (count !== 2) return false;
  }

  const pairStrengths = [...strengthMap.keys()].sort((a, b) => a - b);
  if (pairStrengths.length < 2) return false;

  // Check that pairs are consecutive in the suit's strength order
  const order = getSuitStrengthOrder(effectiveSuit, trumpSuit, trumpRank, noTrumpSuit);

  for (let i = 0; i < pairStrengths.length - 1; i++) {
    const idxA = order.indexOf(pairStrengths[i]);
    const idxB = order.indexOf(pairStrengths[i + 1]);
    if (idxA === -1 || idxB === -1) return false;
    if (idxB !== idxA + 1) return false;
  }

  return true;
}

/**
 * Determine the play type: "single", "pair", or "tractor"
 */
export function getPlayType(cards: Card[], trumpSuit: string | undefined, trumpRank: string, noTrumpSuit?: boolean): "single" | "pair" | "tractor" | "invalid" {
  if (cards.length === 1) return "single";
  if (cards.length === 2 && cards[0] === cards[1]) return "pair";
  if (cards.length === 2) {
    // Check if they're the same card strength (e.g. two off-suit trump rank cards)
    const s0 = cardStrength(cards[0], trumpSuit, trumpRank, noTrumpSuit);
    const s1 = cardStrength(cards[1], trumpSuit, trumpRank, noTrumpSuit);
    const e0 = getEffectiveSuit(cards[0], trumpSuit, trumpRank, noTrumpSuit);
    const e1 = getEffectiveSuit(cards[1], trumpSuit, trumpRank, noTrumpSuit);
    if (s0 === s1 && e0 === e1) return "pair";
    return "invalid";
  }
  if (cards.length >= 4 && isTractor(cards, trumpSuit, trumpRank, noTrumpSuit)) return "tractor";
  return "invalid";
}

// ─── Trick Winner ────────────────────────────────────────────────────────────

export interface TrickPlay {
  seat: number;
  cards: Card[];
}

/**
 * Determine the winner of a completed trick.
 * Supports singles, pairs, and tractors.
 */
export function determineTrickWinner(
  plays: TrickPlay[],
  trumpSuit: string | undefined,
  trumpRank: string,
  noTrumpSuit?: boolean
): number {
  if (plays.length === 0) throw new Error("No plays in trick");

  const leadPlay = plays[0];
  const leadType = getPlayType(leadPlay.cards, trumpSuit, trumpRank, noTrumpSuit);
  const leadSuit = getEffectiveSuit(leadPlay.cards[0], trumpSuit, trumpRank, noTrumpSuit);

  let winnerIdx = 0;
  let winnerStrength = playStrength(leadPlay, trumpSuit, trumpRank, leadSuit, leadType, noTrumpSuit);

  for (let i = 1; i < plays.length; i++) {
    const strength = playStrength(plays[i], trumpSuit, trumpRank, leadSuit, leadType, noTrumpSuit);
    if (strength > winnerStrength) {
      winnerStrength = strength;
      winnerIdx = i;
    }
  }

  return plays[winnerIdx].seat;
}

function playStrength(
  play: TrickPlay,
  trumpSuit: string | undefined,
  trumpRank: string,
  leadSuit: string,
  leadType: "single" | "pair" | "tractor" | "invalid",
  noTrumpSuit?: boolean
): number {
  const cards = play.cards;
  const effectiveSuit = getEffectiveSuit(cards[0], trumpSuit, trumpRank, noTrumpSuit);
  const playType = getPlayType(cards, trumpSuit, trumpRank, noTrumpSuit);

  // For tractor leads, only tractors can win
  if (leadType === "tractor") {
    if (playType !== "tractor") return -1;
    if (cards.length !== play.cards.length) return -1;
    // Must match suit or be trump
    const topStrength = Math.max(...cards.map(c => cardStrength(c, trumpSuit, trumpRank, noTrumpSuit)));
    if (effectiveSuit === leadSuit) return topStrength;
    if (effectiveSuit === "TRUMP" && leadSuit !== "TRUMP") return topStrength;
    return -1;
  }

  if (leadType === "pair") {
    // Only pairs can win against pair lead
    if (playType !== "pair") return -1;
    const strength = cardStrength(cards[0], trumpSuit, trumpRank, noTrumpSuit);
    if (effectiveSuit === leadSuit) return strength;
    if (effectiveSuit === "TRUMP" && leadSuit !== "TRUMP") return strength;
    return -1;
  }

  // Singles
  const strength = cardStrength(cards[0], trumpSuit, trumpRank, noTrumpSuit);
  if (effectiveSuit === leadSuit) return strength;
  if (effectiveSuit === "TRUMP" && leadSuit !== "TRUMP") return strength;
  return -1;
}

// ─── Suit Following Validation ───────────────────────────────────────────────

/**
 * Count how many pairs of a given suit exist in hand
 */
function countPairsInSuit(hand: Card[], suit: string, trumpSuit: string | undefined, trumpRank: string, noTrumpSuit?: boolean): number {
  const suitCards = hand.filter(c => getEffectiveSuit(c, trumpSuit, trumpRank, noTrumpSuit) === suit);
  const counts = new Map<string, number>();
  for (const c of suitCards) {
    const key = `${cardStrength(c, trumpSuit, trumpRank, noTrumpSuit)}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let pairs = 0;
  for (const v of counts.values()) {
    pairs += Math.floor(v / 2);
  }
  return pairs;
}

/**
 * Check if hand contains a tractor of the given suit with the given number of pairs
 */
function hasTractorInSuit(hand: Card[], suit: string, numPairs: number, trumpSuit: string | undefined, trumpRank: string, noTrumpSuit?: boolean): boolean {
  const suitCards = hand.filter(c => getEffectiveSuit(c, trumpSuit, trumpRank, noTrumpSuit) === suit);
  // Find all pairs
  const strengthCounts = new Map<number, number>();
  for (const c of suitCards) {
    const s = cardStrength(c, trumpSuit, trumpRank, noTrumpSuit);
    strengthCounts.set(s, (strengthCounts.get(s) ?? 0) + 1);
  }
  const pairStrengths = [...strengthCounts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([s]) => s)
    .sort((a, b) => a - b);

  if (pairStrengths.length < numPairs) return false;

  // Check for consecutive sequence of numPairs
  const order = getSuitStrengthOrder(suit, trumpSuit, trumpRank, noTrumpSuit);
  for (let start = 0; start <= pairStrengths.length - numPairs; start++) {
    let consecutive = true;
    for (let i = 0; i < numPairs - 1; i++) {
      const idxA = order.indexOf(pairStrengths[start + i]);
      const idxB = order.indexOf(pairStrengths[start + i + 1]);
      if (idxA === -1 || idxB === -1 || idxB !== idxA + 1) {
        consecutive = false;
        break;
      }
    }
    if (consecutive) return true;
  }
  return false;
}

/**
 * Validate that a play follows suit rules.
 * Returns an error message if invalid, or null if valid.
 */
export function validatePlay(
  playCards: Card[],
  hand: Card[],
  leadPlay: TrickPlay | null,
  trumpSuit: string | undefined,
  trumpRank: string,
  noTrumpSuit?: boolean
): string | null {
  // Check cards are in hand
  const handCopy = [...hand];
  for (const c of playCards) {
    const idx = handCopy.indexOf(c);
    if (idx === -1) return `Card ${c} is not in your hand`;
    handCopy.splice(idx, 1);
  }

  // Lead can play anything valid
  if (!leadPlay) return null;

  const leadCount = leadPlay.cards.length;
  if (playCards.length !== leadCount) {
    return `Must play ${leadCount} card(s) to match the lead`;
  }

  const leadSuit = getEffectiveSuit(leadPlay.cards[0], trumpSuit, trumpRank, noTrumpSuit);
  const leadType = getPlayType(leadPlay.cards, trumpSuit, trumpRank, noTrumpSuit);
  const suitCardsInHand = hand.filter(c => getEffectiveSuit(c, trumpSuit, trumpRank, noTrumpSuit) === leadSuit);

  if (leadType === "tractor") {
    const numPairs = leadCount / 2;

    if (suitCardsInHand.length > 0) {
      // Must play tractor of same suit if you have one
      if (hasTractorInSuit(hand, leadSuit, numPairs, trumpSuit, trumpRank, noTrumpSuit)) {
        const playType = getPlayType(playCards, trumpSuit, trumpRank, noTrumpSuit);
        if (playType !== "tractor" || getEffectiveSuit(playCards[0], trumpSuit, trumpRank, noTrumpSuit) !== leadSuit) {
          return "You must play a tractor of the lead suit if you have one";
        }
        return null;
      }

      // No tractor — must play pairs of that suit if you have any
      const pairsInSuit = countPairsInSuit(hand, leadSuit, trumpSuit, trumpRank, noTrumpSuit);
      if (pairsInSuit > 0) {
        // Count pairs played in the suit
        const playedSuitCards = playCards.filter(c => getEffectiveSuit(c, trumpSuit, trumpRank, noTrumpSuit) === leadSuit);
        const playedCounts = new Map<string, number>();
        for (const c of playedSuitCards) {
          const key = `${cardStrength(c, trumpSuit, trumpRank, noTrumpSuit)}`;
          playedCounts.set(key, (playedCounts.get(key) ?? 0) + 1);
        }
        const playedPairs = [...playedCounts.values()].reduce((sum, v) => sum + Math.floor(v / 2), 0);
        const requiredPairs = Math.min(pairsInSuit, numPairs);
        if (playedPairs < requiredPairs) {
          return "You must play as many pairs of the lead suit as possible";
        }
      }

      // Must play as many suit cards as possible
      const requiredSuitCards = Math.min(suitCardsInHand.length, leadCount);
      const suitCardsPlayed = playCards.filter(c => getEffectiveSuit(c, trumpSuit, trumpRank, noTrumpSuit) === leadSuit);
      if (suitCardsPlayed.length < requiredSuitCards) {
        return `Must play all your ${leadSuit} cards first (have ${suitCardsInHand.length})`;
      }
    }

    return null;
  }

  // Pair lead
  if (leadType === "pair") {
    if (playCards.length === 2) {
      const playType = getPlayType(playCards, trumpSuit, trumpRank, noTrumpSuit);
      if (playType !== "pair") {
        // Check if they have a pair in the lead suit
        if (countPairsInSuit(hand, leadSuit, trumpSuit, trumpRank, noTrumpSuit) > 0) {
          return "You must play a pair of the lead suit if you have one";
        }
      }
    }
  }

  // Must follow suit
  if (suitCardsInHand.length > 0) {
    const suitCardsPlayed = playCards.filter(c => getEffectiveSuit(c, trumpSuit, trumpRank, noTrumpSuit) === leadSuit);
    const requiredSuitCards = Math.min(suitCardsInHand.length, leadCount);
    if (suitCardsPlayed.length < requiredSuitCards) {
      return `Must play all your ${leadSuit} cards first (have ${suitCardsInHand.length})`;
    }
  }

  return null;
}

// ─── Card Sorting (for display) ──────────────────────────────────────────────

export function sortHand(hand: Card[], trumpSuit?: string, trumpRank?: string, noTrumpSuit?: boolean): Card[] {
  return [...hand].sort((a, b) => {
    // Trump cards first
    if (trumpRank) {
      const aIsTrump = isTrumpCard(a, trumpSuit, trumpRank, noTrumpSuit);
      const bIsTrump = isTrumpCard(b, trumpSuit, trumpRank, noTrumpSuit);
      if (aIsTrump && !bIsTrump) return -1;
      if (!aIsTrump && bIsTrump) return 1;
      if (aIsTrump && bIsTrump) {
        return cardStrength(b, trumpSuit, trumpRank, noTrumpSuit) - cardStrength(a, trumpSuit, trumpRank, noTrumpSuit);
      }
    }
    // Then by suit
    const suitA = getSuit(a);
    const suitB = getSuit(b);
    if (suitA !== suitB) return suitA.localeCompare(suitB);
    // Then by rank
    return (RANK_ORDER[getRank(b)] ?? 0) - (RANK_ORDER[getRank(a)] ?? 0);
  });
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

/** Calculate rank change from attacker points (4-player, 40-point brackets) */
export function calculateRankChange(attackerPoints: number): { attackerChange: number; defenderChange: number } {
  if (attackerPoints < 40) return { attackerChange: 0, defenderChange: 2 };
  if (attackerPoints < 80) return { attackerChange: 0, defenderChange: 1 };
  if (attackerPoints < 120) return { attackerChange: 0, defenderChange: 0 };
  if (attackerPoints < 160) return { attackerChange: 1, defenderChange: 0 };
  if (attackerPoints < 200) return { attackerChange: 2, defenderChange: 0 };
  return { attackerChange: 3, defenderChange: 0 };
}

export function determineWinner(attackerPoints: number, kittyMultiplier: number): "attackers" | "defenders" {
  const totalAttackerPoints = attackerPoints;
  return totalAttackerPoints >= 80 ? "attackers" : "defenders";
}

/** Calculate bonus points from kitty if attackers win last trick */
export function kittyBonus(kittyDiscards: Card[], lastTrickWinner: number, declarerSeat: number): number {
  const declarerTeam = [declarerSeat, (declarerSeat + 2) % 4];
  const isDefenderWin = declarerTeam.includes(lastTrickWinner);
  // If attackers win last trick, kitty points are doubled and added to attacker score
  if (!isDefenderWin) {
    return totalPoints(kittyDiscards) * 2;
  }
  return 0;
}
