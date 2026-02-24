// Pure Hearts (Gong Zhu / 拱猪) game logic — no Convex imports, fully testable

const SUITS = ["S", "H", "D", "C"] as const;
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"] as const;

export type Card = string; // e.g. "2S", "TH", "QD"

// ─── Deck ────────────────────────────────────────────────────────────────────

export function createSingleDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(`${rank}${suit}`);
    }
  }
  return deck; // 52 cards
}

export function shuffleCards(cards: Card[]): Card[] {
  const a = [...cards];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function dealHearts(deck: Card[]): { hands: Card[][] } {
  const hands: Card[][] = [[], [], [], []];
  for (let i = 0; i < 52; i++) {
    hands[i % 4].push(deck[i]);
  }
  return { hands };
}

// ─── Card Properties ─────────────────────────────────────────────────────────

export function getRank(card: Card): string {
  return card[0];
}

export function getSuit(card: Card): string {
  return card[1];
}

const RANK_ORDER: Record<string, number> = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
  "T": 10, "J": 11, "Q": 12, "K": 13, "A": 14,
};

// ─── Game Mechanics ──────────────────────────────────────────────────────────

export function findTwoOfClubs(hands: Card[][]): number {
  for (let seat = 0; seat < 4; seat++) {
    if (hands[seat].includes("2C")) return seat;
  }
  return 0; // fallback
}

export interface HeartsTrickPlay {
  seat: number;
  cards: string[]; // always single card in hearts, but kept as array for consistency
}

export function determineHeartsTrickWinner(plays: HeartsTrickPlay[]): number {
  if (plays.length === 0) throw new Error("No plays in trick");
  const leadSuit = getSuit(plays[0].cards[0]);
  let winnerIdx = 0;
  let winnerStrength = RANK_ORDER[getRank(plays[0].cards[0])] ?? 0;

  for (let i = 1; i < plays.length; i++) {
    const card = plays[i].cards[0];
    if (getSuit(card) !== leadSuit) continue; // off-suit cannot win
    const strength = RANK_ORDER[getRank(card)] ?? 0;
    if (strength > winnerStrength) {
      winnerStrength = strength;
      winnerIdx = i;
    }
  }

  return plays[winnerIdx].seat;
}

export function validateHeartsPlay(
  card: string,
  hand: string[],
  currentTrick: HeartsTrickPlay[]
): string | null {
  if (!hand.includes(card)) return `Card ${card} is not in your hand`;

  if (currentTrick.length === 0) return null; // leading, any card OK

  const leadSuit = getSuit(currentTrick[0].cards[0]);
  const cardSuit = getSuit(card);

  if (cardSuit !== leadSuit) {
    // Check if player has any cards of the lead suit
    const hasSuit = hand.some((c) => getSuit(c) === leadSuit);
    if (hasSuit) return `Must follow suit (${leadSuit})`;
  }

  return null;
}

// ─── Gong Zhu Scoring ────────────────────────────────────────────────────────

const HEART_SCORES: Record<string, number> = {
  "2H": 2, "3H": 3, "4H": 10, "5H": 5, "6H": 6, "7H": 7,
  "8H": 8, "9H": 9, "TH": 10, "JH": 20, "QH": 30, "KH": 40, "AH": 50,
};

export function isHeartsScoringCard(card: string): boolean {
  return card in HEART_SCORES || card === "QD" || card === "JD" || card === "TC";
}

export function calculateHeartsRoundScores(capturedCards: string[][]): number[] {
  const scores: number[] = [0, 0, 0, 0];

  for (let seat = 0; seat < 4; seat++) {
    const cards = capturedCards[seat];
    let heartPoints = 0;
    let hasQD = false;
    let hasJD = false;
    let hasTC = false;

    for (const card of cards) {
      if (card in HEART_SCORES) heartPoints += HEART_SCORES[card];
      if (card === "QD") hasQD = true;
      if (card === "JD") hasJD = true;
      if (card === "TC") hasTC = true;
    }

    // Base scoring: hearts + QD(+100) + JD(-100)
    let baseScore = heartPoints;
    if (hasQD) baseScore += 100;
    if (hasJD) baseScore -= 100;

    // TC logic: if TC is the ONLY scoring card, it's -50
    // otherwise it doubles ALL other scoring
    if (hasTC) {
      const hasScoringBesidesTC = heartPoints > 0 || hasQD || hasJD;
      if (!hasScoringBesidesTC) {
        scores[seat] = -50;
      } else {
        scores[seat] = baseScore * 2;
      }
    } else {
      scores[seat] = baseScore;
    }
  }

  return scores;
}

// ─── Sorting ─────────────────────────────────────────────────────────────────

const SUIT_ORDER: Record<string, number> = { S: 0, H: 1, D: 2, C: 3 };

export function sortHeartsHand(hand: Card[]): Card[] {
  return [...hand].sort((a, b) => {
    const suitA = SUIT_ORDER[getSuit(a)] ?? 4;
    const suitB = SUIT_ORDER[getSuit(b)] ?? 4;
    if (suitA !== suitB) return suitA - suitB;
    return (RANK_ORDER[getRank(b)] ?? 0) - (RANK_ORDER[getRank(a)] ?? 0);
  });
}
