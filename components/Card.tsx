"use client";

import { displayCard, cardColor } from "@/lib/cardUtils";

interface CardProps {
  card: string;
  selected?: boolean;
  onClick?: () => void;
  faceDown?: boolean;
  small?: boolean;
}

export default function Card({ card, selected, onClick, faceDown, small }: CardProps) {
  if (faceDown || card === "??") {
    return (
      <span
        style={{
          display: "inline-block",
          padding: small ? "4px 6px" : "8px 12px",
          margin: "2px",
          background: "#2c5aa0",
          color: "#fff",
          borderRadius: 6,
          fontSize: small ? "0.8rem" : "1rem",
          fontWeight: 600,
          border: "2px solid #1a3a6a",
          cursor: onClick ? "pointer" : "default",
        }}
        onClick={onClick}
      >
        🂠
      </span>
    );
  }

  return (
    <span
      onClick={onClick}
      style={{
        display: "inline-block",
        padding: small ? "4px 8px" : "8px 14px",
        margin: "2px",
        background: selected ? "#e8f0fe" : "#fff",
        color: cardColor(card),
        borderRadius: 6,
        fontSize: small ? "0.85rem" : "1.1rem",
        fontWeight: 700,
        border: `2px solid ${selected ? "#667eea" : "#ccc"}`,
        cursor: onClick ? "pointer" : "default",
        transform: selected ? "translateY(-8px)" : "none",
        transition: "transform 0.1s, border-color 0.1s",
        userSelect: "none",
      }}
    >
      {displayCard(card)}
    </span>
  );
}
