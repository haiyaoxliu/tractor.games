"use client";

import { cardParts } from "@/lib/cardUtils";

interface CardProps {
  card: string;
  selected?: boolean;
  onClick?: () => void;
  faceDown?: boolean;
  small?: boolean;
}

export default function Card({ card, selected, onClick, faceDown, small }: CardProps) {
  const classes = ["playingCard"];
  if (small) classes.push("cardSmall");
  if (onClick) classes.push("cardClickable");
  if (selected) classes.push("cardSelected");

  if (faceDown || card === "??") {
    classes.push("cardBack");
    return (
      <span className={classes.join(" ")} onClick={onClick}>
        <span className="cardCenter">♠</span>
      </span>
    );
  }

  const parts = cardParts(card);

  return (
    <span className={classes.join(" ")} onClick={onClick}>
      <span className="cardCorner" style={{ color: parts.color }}>
        {parts.corner}
        {parts.cornerSuit && (
          <>
            <br />
            {parts.cornerSuit}
          </>
        )}
      </span>
      <span className="cardCenter" style={{ color: parts.color }}>
        {parts.center}
      </span>
      {parts.label && (
        <span className="cardLabel" style={{ color: parts.color }}>
          {parts.label}
        </span>
      )}
    </span>
  );
}
