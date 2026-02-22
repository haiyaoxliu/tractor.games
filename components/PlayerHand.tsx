"use client";

import { useState } from "react";
import Card from "./Card";
import { sortHand } from "@/convex/gameLogic";

interface PlayerHandProps {
  cards: string[];
  trumpSuit?: string;
  trumpRank?: string;
  noTrumpSuit?: boolean;
  onPlay?: (cards: string[]) => void;
  canPlay: boolean;
  isKittyPhase?: boolean;
  onDiscardKitty?: (cards: string[]) => void;
}

export default function PlayerHand({
  cards,
  trumpSuit,
  trumpRank,
  noTrumpSuit,
  onPlay,
  canPlay,
  isKittyPhase,
  onDiscardKitty,
}: PlayerHandProps) {
  const [selected, setSelected] = useState<number[]>([]);

  const sorted = sortHand(cards, trumpSuit, trumpRank, noTrumpSuit);

  const toggleSelect = (idx: number) => {
    setSelected((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handlePlay = () => {
    if (!onPlay) return;
    const playCards = selected.map((i) => sorted[i]);
    onPlay(playCards);
    setSelected([]);
  };

  const handleDiscard = () => {
    if (!onDiscardKitty) return;
    const discardCards = selected.map((i) => sorted[i]);
    onDiscardKitty(discardCards);
    setSelected([]);
  };

  // Valid play counts: 1 (single), 2 (pair), 4+ even (tractor)
  const isValidPlayCount = selected.length === 1 || selected.length === 2 || (selected.length >= 4 && selected.length % 2 === 0);
  const canPlayCards = isValidPlayCount && selected.length > 0;

  return (
    <div style={{ textAlign: "center", padding: "1rem 0" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 0 }}>
        {sorted.map((card, idx) => (
          <Card
            key={`${card}-${idx}`}
            card={card}
            selected={selected.includes(idx)}
            onClick={() => toggleSelect(idx)}
          />
        ))}
      </div>
      <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", justifyContent: "center" }}>
        {isKittyPhase && onDiscardKitty && (
          <button
            onClick={handleDiscard}
            disabled={selected.length !== 8}
            style={{
              padding: "8px 20px",
              fontSize: "1rem",
              fontWeight: 600,
              color: "#fff",
              background: selected.length === 8 ? "#e67e22" : "#ccc",
              border: "none",
              borderRadius: 6,
              cursor: selected.length === 8 ? "pointer" : "not-allowed",
            }}
          >
            Discard {selected.length}/8 to Kitty
          </button>
        )}
        {canPlay && onPlay && !isKittyPhase && (
          <button
            onClick={handlePlay}
            disabled={!canPlayCards}
            style={{
              padding: "8px 20px",
              fontSize: "1rem",
              fontWeight: 600,
              color: "#fff",
              background: canPlayCards ? "#667eea" : "#ccc",
              border: "none",
              borderRadius: 6,
              cursor: canPlayCards ? "pointer" : "not-allowed",
            }}
          >
            Play {selected.length} Card{selected.length !== 1 ? "s" : ""}
          </button>
        )}
      </div>
    </div>
  );
}
