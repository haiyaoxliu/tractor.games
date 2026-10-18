// Fixture game states for the design playground. Shapes mirror what the
// Convex queries return, so the real board components render them as-is.
// Nothing here talks to Convex.

import type { ComponentProps } from "react";
import type GameBoard from "@/components/GameBoard";
import type HeartsGameBoard from "@/components/HeartsGameBoard";
import type BidGameBoard from "@/components/BidGameBoard";

type TractorState = ComponentProps<typeof GameBoard>["game"];
type HeartsState = ComponentProps<typeof HeartsGameBoard>["game"];
type BidState = ComponentProps<typeof BidGameBoard>["game"];

export const SESSION_ID = "playground-me";

const NAMES = ["You", "Mei", "Arjun", "Sofia", "Kenji", "Lena"];

export function players(n: number) {
  return Array.from({ length: n }, (_, seat) => ({
    name: NAMES[seat],
    sessionId: seat === 0 ? SESSION_ID : `playground-${seat}`,
    seat,
  }));
}

// ── Cards ────────────────────────────────────────────────────────────────

export const SUITS = ["S", "H", "D", "C"] as const;
export const RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"] as const;
export const TRACTOR_JOKERS = ["JK", "jk"];
export const WIZARD_SPECIALS = ["WZ1", "JE1"];
export const SK_SUITS = ["G", "Y", "P", "B"] as const;
export const SK_SPECIALS = ["SK", "MM1", "PR1", "ES1"];

export function skSuited(suit: string) {
  return Array.from({ length: 14 }, (_, i) => `${String(i + 1).padStart(2, "0")}${suit}`);
}

// ── Tractor ──────────────────────────────────────────────────────────────

const TRACTOR_HAND = [
  "JK", "jk", "2H", "2S", "AH", "KH", "KH", "QH", "TH", "5H",
  "AS", "QS", "JS", "9S", "9S", "AD", "TD", "7D", "KC", "8C", "8C", "6C", "4C", "3C", "3D",
];

const tractorBase: TractorState = {
  _id: "fixture-tractor" as TractorState["_id"],
  roomId: "fixture-room" as TractorState["roomId"],
  phase: "playing",
  trumpSuit: "H",
  trumpRank: "2",
  declarerSeat: 0,
  defendingTeam: [0, 2],
  hands: [TRACTOR_HAND, [], [], []],
  kittyDiscards: [],
  currentTrick: [
    { seat: 1, cards: ["KS", "KS"] },
    { seat: 2, cards: ["AS", "5S"] },
    { seat: 3, cards: ["7S", "7S"] },
  ],
  leadSeat: 1,
  currentTurn: 0,
  tricks: [{ plays: [], winner: 2 }],
  attackerPoints: 35,
  mySeat: 0,
  handCounts: [25, 23, 23, 23],
  trickCount: 2,
  players: players(4),
  declarations: [{ seat: 0, suit: "H", strength: 2 }],
  noTrumpSuit: false,
  teamRanks: [3, 1],
  defendingTeamIndex: 0,
  dealComplete: true,
  revealedCounts: [25, 25, 25, 25],
};

export const tractor: Record<string, TractorState> = {
  "Declaring — drawing": {
    ...tractorBase,
    phase: "declaring",
    trumpSuit: undefined,
    declarerSeat: undefined,
    defendingTeam: undefined,
    currentTrick: [],
    tricks: [],
    attackerPoints: 0,
    currentTurn: undefined,
    hands: [TRACTOR_HAND.slice(0, 12), [], [], []],
    handCounts: [25, 25, 25, 25],
    revealedCounts: [12, 14, 10, 13],
    dealComplete: false,
    declarations: [],
  },
  "Declaring — all drawn": {
    ...tractorBase,
    phase: "declaring",
    trumpSuit: "H",
    declarerSeat: undefined,
    defendingTeam: undefined,
    currentTrick: [],
    tricks: [],
    attackerPoints: 0,
    currentTurn: undefined,
    handCounts: [25, 25, 25, 25],
    declarations: [{ seat: 3, suit: "S", strength: 1 }, { seat: 0, suit: "H", strength: 2 }],
  },
  "Kitty discard": {
    ...tractorBase,
    phase: "kitty",
    currentTrick: [],
    tricks: [],
    attackerPoints: 0,
    hands: [[...TRACTOR_HAND, "4S", "6D", "8D", "JD", "5C", "9C", "TC", "QC"], [], [], []],
    handCounts: [33, 25, 25, 25],
  },
  "Playing — your turn": tractorBase,
  "Playing — waiting": {
    ...tractorBase,
    currentTrick: [{ seat: 0, cards: ["AD"] }, { seat: 1, cards: ["3D"] }],
    leadSeat: 0,
    currentTurn: 2,
    hands: [TRACTOR_HAND.filter((c) => c !== "AD"), [], [], []],
    handCounts: [24, 24, 25, 25],
  },
  "Round over": {
    ...tractorBase,
    phase: "scoring",
    currentTrick: [],
    tricks: [{ plays: [], winner: 1 }],
    hands: [[], [], [], []],
    handCounts: [0, 0, 0, 0],
    attackerPoints: 95,
    kittyDiscards: ["4S", "6D", "8D", "JD", "5C", "9C", "TC", "QC"],
  },
  "Match over": {
    ...tractorBase,
    phase: "scoring",
    currentTrick: [],
    hands: [[], [], [], []],
    handCounts: [0, 0, 0, 0],
    attackerPoints: 0,
    teamRanks: [12, 7],
  },
};

// ── Gong Zhu (Hearts) ────────────────────────────────────────────────────

const HEARTS_HAND = ["AH", "TH", "4H", "QS", "9S", "3S", "KD", "JD", "7D", "2D", "AC", "TC", "5C"];

const heartsBase: HeartsState = {
  _id: "fixture-hearts" as HeartsState["_id"],
  roomId: "fixture-room" as HeartsState["roomId"],
  phase: "playing",
  hands: [HEARTS_HAND, [], [], []],
  currentTrick: [{ seat: 2, cards: ["8D"] }, { seat: 3, cards: ["QD"] }],
  leadSeat: 2,
  currentTurn: 0,
  tricks: [{ plays: [], winner: 1 }],
  capturedCards: [[], ["KH", "2H"], ["TD"], []],
  mySeat: 0,
  handCounts: [13, 12, 12, 12],
  trickCount: 1,
  players: players(4),
  roundNumber: 2,
  heartsScores: [{ roundNumber: 1, scores: [-40, 100, 0, -260] }],
};

export const hearts: Record<string, HeartsState> = {
  "Playing — your turn": heartsBase,
  "Playing — waiting": { ...heartsBase, currentTrick: [], currentTurn: 1, leadSeat: 1 },
  "Round over": {
    ...heartsBase,
    phase: "scoring",
    hands: [[], [], [], []],
    handCounts: [0, 0, 0, 0],
    currentTrick: [],
    capturedCards: [
      ["AH", "TH", "4H", "TC"],
      ["KH", "2H", "QS"],
      ["TD", "JD", "3H", "5H"],
      ["QH", "JH", "9H", "8H", "7H", "6H"],
    ],
  },
};

// ── Wizard & Skull King ──────────────────────────────────────────────────

const WIZARD_HAND = ["WZ1", "AS", "QH", "TH", "7D", "3C", "JE1"];
const SK_HAND = ["SK", "PR1", "14B", "09Y", "12G", "03P", "ES1"];

const bidScores = [
  { roundNumber: 1, bids: [1, 0, 0, 1], tricks: [1, 0, 0, 0], scores: [30, 20, 20, -10], totals: [30, 20, 20, -10] },
  { roundNumber: 2, bids: [0, 1, 1, 0], tricks: [1, 1, 0, 0], scores: [-10, 30, -10, 20], totals: [20, 50, 10, 10] },
];

function bidBase(gameType: "wizard" | "skullking"): BidState {
  return {
    _id: `fixture-${gameType}` as BidState["_id"],
    roomId: "fixture-room" as BidState["roomId"],
    gameType,
    phase: "playing",
    roundNumber: 7,
    totalRounds: gameType === "wizard" ? 15 : 10,
    numPlayers: 4,
    dealerSeat: 3,
    hands: [gameType === "wizard" ? WIZARD_HAND : SK_HAND, [], [], []],
    bids: [2, 1, 3, 0],
    hasBid: [true, true, true, true],
    tricksWon: [1, 0, 1, 0],
    bonuses: [0, 0, 0, 0],
    currentTrick:
      gameType === "wizard"
        ? [{ seat: 1, cards: ["KH"] }, { seat: 2, cards: ["2H"] }, { seat: 3, cards: ["WZ2"] }]
        : [{ seat: 1, cards: ["10G"] }, { seat: 2, cards: ["MM1"] }, { seat: 3, cards: ["02B"] }],
    leadSeat: 1,
    currentTurn: 0,
    trickCount: 2,
    lastTrick: null,
    trumpCard: gameType === "wizard" ? "5D" : undefined,
    trumpSuit: gameType === "wizard" ? "D" : undefined,
    mySeat: 0,
    handCounts: [7, 6, 6, 6],
    players: players(4),
    bidScores,
  };
}

function bidStates(gameType: "wizard" | "skullking"): Record<string, BidState> {
  const base = bidBase(gameType);
  const states: Record<string, BidState> = {
    "Bidding — your bid": {
      ...base,
      phase: "bidding",
      bids: [null, 1, null, 2],
      hasBid: [false, true, false, true],
      tricksWon: [0, 0, 0, 0],
      currentTrick: [],
      trickCount: 0,
      currentTurn: 0,
      handCounts: [7, 7, 7, 7],
    },
    "Playing — your turn": base,
    "Playing — waiting": {
      ...base,
      currentTrick: [],
      currentTurn: 2,
      leadSeat: 2,
      lastTrick: { plays: base.currentTrick.concat({ seat: 0, cards: [base.hands[0][1]] }), winner: 3 },
    },
    "Round over": {
      ...base,
      phase: "scoring",
      hands: [[], [], [], []],
      handCounts: [0, 0, 0, 0],
      currentTrick: [],
      tricksWon: [2, 1, 4, 0],
      bonuses: gameType === "skullking" ? [0, 0, 30, 0] : [0, 0, 0, 0],
    },
    "Game over": {
      ...base,
      phase: "finished",
      hands: [[], [], [], []],
      handCounts: [0, 0, 0, 0],
      currentTrick: [],
    },
  };
  if (gameType === "wizard") {
    states["Choosing trump"] = {
      ...states["Bidding — your bid"],
      phase: "choosingTrump",
      trumpCard: "WZ3",
      trumpSuit: undefined,
      dealerSeat: 0,
      bids: [null, null, null, null],
      hasBid: [false, false, false, false],
    };
  }
  return states;
}

export const wizard = bidStates("wizard");
export const skullking = bidStates("skullking");
