"use client";

import Card from "./Card";

interface TrickPlay {
  seat: number;
  cards: string[];
}

interface TrickAreaProps {
  currentTrick: TrickPlay[];
  players: { name: string; seat: number }[];
  mySeat: number;
}

export default function TrickArea({ currentTrick, players, mySeat }: TrickAreaProps) {
  if (currentTrick.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "2rem", color: "#999" }}>
        No cards played yet
      </div>
    );
  }

  // Position plays relative to current player (bottom)
  const getPosition = (seat: number): string => {
    const rel = (seat - mySeat + 4) % 4;
    return ["You", "Left", "Partner", "Right"][rel];
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateAreas: `
          ".      top    ."
          "left   center right"
          ".      bottom ."
        `,
        gridTemplateColumns: "1fr 1fr 1fr",
        gridTemplateRows: "auto auto auto",
        gap: "0.5rem",
        padding: "1rem",
        minHeight: 160,
        alignItems: "center",
        justifyItems: "center",
      }}
    >
      {currentTrick.map((play) => {
        const pos = getPosition(play.seat);
        const playerName = players.find((p) => p.seat === play.seat)?.name ?? `Seat ${play.seat}`;
        const gridArea =
          pos === "You" ? "bottom" :
          pos === "Partner" ? "top" :
          pos === "Left" ? "left" : "right";

        return (
          <div key={play.seat} style={{ gridArea, textAlign: "center" }}>
            <div style={{ fontSize: "0.75rem", color: "#666", marginBottom: 2 }}>
              {playerName}
            </div>
            {play.cards.map((c, i) => (
              <Card key={`${c}-${i}`} card={c} small />
            ))}
          </div>
        );
      })}
    </div>
  );
}
