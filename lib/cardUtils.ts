// Client-side card display helpers

const SUIT_SYMBOLS: Record<string, string> = {
  S: "\u2660", // ♠
  H: "\u2665", // ♥
  D: "\u2666", // ♦
  C: "\u2663", // ♣
};

const SUIT_COLORS: Record<string, string> = {
  S: "#000",
  H: "#e00",
  D: "#e00",
  C: "#000",
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
  G: "#15803d",
  Y: "#b45309",
  P: "#7c3aed",
  B: "#18181b",
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
  if (card === "JK") return { corner: "★", center: "🃏", color: "#b45309", label: "Big Joker" };
  if (card === "jk") return { corner: "☆", center: "🃏", color: "#52525b", label: "Joker" };
  // Wizard specials
  if (card.startsWith("WZ")) return { corner: "W", center: "🧙", color: "#7c3aed", label: "Wizard" };
  if (card.startsWith("JE")) return { corner: "J", center: "🎭", color: "#52525b", label: "Jester" };
  // Skull King specials
  if (card === "SK") return { corner: "SK", center: "💀", color: "#18181b", label: "Skull King" };
  if (card.startsWith("MM")) return { corner: "M", center: "🧜", color: "#0d9488", label: "Mermaid" };
  if (card.startsWith("PR")) return { corner: "P", center: "🏴‍☠️", color: "#18181b", label: "Pirate" };
  if (card.startsWith("ES")) return { corner: "E", center: "🏳️", color: "#71717a", label: "Escape" };
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
    color: SUIT_COLORS[suit] ?? "#000",
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
  return SUIT_COLORS[suit] ?? "#000";
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
