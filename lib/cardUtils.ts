// Client-side card display helpers

const SUIT_SYMBOLS: Record<string, string> = {
  S: "\u2660", // ♠
  H: "\u2665", // ♥
  D: "\u2666", // ♦
  C: "\u2663", // ♣
};

const SUIT_COLORS: Record<string, string> = {
  S: "var(--suit-black)",
  H: "var(--suit-red)",
  D: "var(--suit-red)",
  C: "var(--suit-black)",
};

const RANK_DISPLAY: Record<string, string> = {
  A: "A",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  T: "10",
  J: "J",
  Q: "Q",
  K: "K",
};

// Skull King suits: G parrot, Y chest, P map, B Jolly Roger (trump)
const SK_SUIT_GLYPHS: Record<string, string> = {
  G: "🦜",
  Y: "💰",
  P: "🗺️",
  B: "🏴",
};

const SK_SUIT_COLORS: Record<string, string> = {
  G: "var(--sk-parrot)",
  Y: "var(--sk-chest)",
  P: "var(--sk-map)",
  B: "var(--sk-jolly-roger)",
};

export const SK_SUIT_NAMES: Record<string, string> = {
  G: "Parrot",
  Y: "Chest",
  P: "Map",
  B: "Jolly Roger",
};

// Structured card faces for the Card component
export interface CardParts {
  corner: string; // top-left rank/initial
  cornerSuit?: string; // small suit glyph under the rank
  center: string; // big center glyph
  color: string;
  label?: string; // special-card name along the bottom
}

export function cardParts(card: string): CardParts {
  // Tractor jokers
  if (card === "JK") return { corner: "★", center: "🃏", color: "var(--card-big-joker)", label: "Big Joker" };
  if (card === "jk") return { corner: "☆", center: "🃏", color: "var(--card-joker)", label: "Joker" };
  // Wizard specials
  if (card.startsWith("WZ")) return { corner: "W", center: "🧙", color: "var(--card-wizard)", label: "Wizard" };
  if (card.startsWith("JE")) return { corner: "J", center: "🎭", color: "var(--card-jester)", label: "Jester" };
  // Skull King specials
  if (card === "SK") return { corner: "SK", center: "💀", color: "var(--card-skull-king)", label: "Skull King" };
  if (card.startsWith("MM")) return { corner: "M", center: "🧜", color: "var(--card-mermaid)", label: "Mermaid" };
  if (card.startsWith("PR")) return { corner: "P", center: "🏴‍☠️", color: "var(--card-pirate)", label: "Pirate" };
  if (card.startsWith("ES")) return { corner: "E", center: "🏳️", color: "var(--card-escape)", label: "Escape" };
  // Skull King suited: "01G".."14B"
  if (/^\d\d[GYPB]$/.test(card)) {
    const suit = card[2];
    return {
      corner: String(parseInt(card.slice(0, 2), 10)),
      center: SK_SUIT_GLYPHS[suit],
      color: SK_SUIT_COLORS[suit],
    };
  }
  // Standard rank+suit
  const rank = card[0];
  const suit = card[1];
  return {
    corner: RANK_DISPLAY[rank] ?? rank,
    cornerSuit: SUIT_SYMBOLS[suit],
    center: SUIT_SYMBOLS[suit] ?? suit,
    color: SUIT_COLORS[suit] ?? "var(--suit-black)",
  };
}

export function displayCard(card: string): string {
  if (card === "JK") return "🃏★";
  if (card === "jk") return "🃏☆";
  const parts = cardParts(card);
  if (parts.label) return `${parts.center} ${parts.label}`;
  return `${parts.corner}${parts.center}`;
}

export function cardColor(card: string): string {
  return cardParts(card).color;
}

export function suitSymbol(suit: string): string {
  return SUIT_SYMBOLS[suit] ?? suit;
}

export function suitColor(suit: string): string {
  return SUIT_COLORS[suit] ?? "var(--suit-black)";
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  // Migrate from old key
  let id = sessionStorage.getItem("card_games_session_id");
  if (!id) {
    id = sessionStorage.getItem("tractor_session_id");
    if (id) {
      sessionStorage.setItem("card_games_session_id", id);
    }
  }
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("card_games_session_id", id);
  }
  return id;
}

export function getPlayerName(): string | null {
  if (typeof window === "undefined") return null;
  // Migrate from old key
  let name = localStorage.getItem("card_games_player_name");
  if (!name) {
    name = localStorage.getItem("tractor_player_name");
    if (name) {
      localStorage.setItem("card_games_player_name", name);
    }
  }
  return name;
}

export function setPlayerName(name: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("card_games_player_name", name);
}
