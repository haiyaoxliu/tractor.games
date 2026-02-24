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

export function displayCard(card: string): string {
  if (card === "JK") return "🃏★";
  if (card === "jk") return "🃏☆";
  const rank = card[0];
  const suit = card[1];
  return `${RANK_DISPLAY[rank] ?? rank}${SUIT_SYMBOLS[suit] ?? suit}`;
}

export function cardColor(card: string): string {
  if (card === "JK") return "#d4a017";
  if (card === "jk") return "#555";
  const suit = card[1];
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
