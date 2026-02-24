"use client";

import Card from "./Card";
import { isHeartsScoringCard, calculateHeartsRoundScores } from "@/convex/heartsGameLogic";

interface HeartsScoringBreakdownProps {
  capturedCards: string[][];
  players: { name: string; seat: number }[];
}

export default function HeartsScoringBreakdown({
  capturedCards,
  players,
}: HeartsScoringBreakdownProps) {
  const scores = calculateHeartsRoundScores(capturedCards);
  const sortedPlayers = [...players].sort((a, b) => a.seat - b.seat);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {sortedPlayers.map((player) => {
        const seat = player.seat;
        const scoringCards = capturedCards[seat].filter(isHeartsScoringCard);
        const hasTC = capturedCards[seat].includes("TC");
        const hasQD = capturedCards[seat].includes("QD");
        const hasJD = capturedCards[seat].includes("JD");
        const heartCards = scoringCards.filter((c) => c[1] === "H");
        const score = scores[seat];

        // Annotation for TC
        let tcNote = "";
        if (hasTC) {
          const hasOtherScoring = heartCards.length > 0 || hasQD || hasJD;
          tcNote = hasOtherScoring ? "10\u2663 doubled all scores!" : "10\u2663 alone = -50";
        }

        return (
          <div
            key={seat}
            style={{
              background: "#f8f9fa",
              borderRadius: 8,
              padding: "0.75rem",
              border: "1px solid #ddd",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontWeight: 700 }}>{player.name}</span>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  color: score > 0 ? "#dc3545" : score < 0 ? "#28a745" : "#666",
                }}
              >
                {score > 0 ? `+${score}` : score}
              </span>
            </div>
            {scoringCards.length > 0 ? (
              <div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 0 }}>
                  {scoringCards.map((card, i) => {
                    const isSpecial = card === "QD" || card === "JD" || card === "TC";
                    return (
                      <span key={`${card}-${i}`} style={{ position: "relative" }}>
                        <Card card={card} small />
                        {isSpecial && (
                          <span
                            style={{
                              position: "absolute",
                              top: -4,
                              right: -2,
                              fontSize: "0.6rem",
                              background: card === "JD" ? "#28a745" : card === "QD" ? "#dc3545" : "#e67e22",
                              color: "#fff",
                              borderRadius: 4,
                              padding: "0 3px",
                              fontWeight: 700,
                            }}
                          >
                            {card === "QD" ? "+100" : card === "JD" ? "-100" : "x2"}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
                {tcNote && (
                  <div style={{ fontSize: "0.75rem", color: "#e67e22", fontStyle: "italic", marginTop: 4 }}>
                    {tcNote}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: "0.8rem", color: "#999" }}>No scoring cards</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
