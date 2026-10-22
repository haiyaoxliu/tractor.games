"use client";

import Card from "./Card";
import {
  isHeartsScoringCard,
  calculateHeartsRoundScores,
  summarizeHeartsCapture,
} from "@/convex/heartsGameLogic";

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
        const { allHearts, hasQS, hasTC, tcDoubles } = summarizeHeartsCapture(capturedCards[seat]);
        const score = scores[seat];

        // Annotation for TC
        let tcNote = "";
        if (hasTC) {
          tcNote = tcDoubles ? "10\u2663 doubled all scores!" : "10\u2663 alone = -50";
        }

        return (
          <div
            key={seat}
            style={{
              background: "var(--legacy-strip-bg)",
              borderRadius: 8,
              padding: "0.75rem",
              border: "1px solid var(--legacy-gray-ddd)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontWeight: 700 }}>{player.name}</span>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  color: score > 0 ? "var(--legacy-bad)" : score < 0 ? "var(--legacy-good)" : "var(--legacy-gray-666)",
                }}
              >
                {score > 0 ? `+${score}` : score}
              </span>
            </div>
            {scoringCards.length > 0 ? (
              <div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 0 }}>
                  {scoringCards.map((card, i) => {
                    const isSpecial = card === "QS" || card === "JD" || card === "TC";
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
                              background:
                                card === "JD" || (card === "QS" && allHearts)
                                  ? "var(--legacy-good)"
                                  : card === "QS"
                                    ? "var(--legacy-bad)"
                                    : "var(--legacy-orange)",
                              color: "var(--on-color)",
                              borderRadius: 4,
                              padding: "0 3px",
                              fontWeight: 700,
                            }}
                          >
                            {card === "QS" ? (allHearts ? "-100" : "+100") : card === "JD" ? "-100" : tcDoubles ? "x2" : "-50"}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
                {allHearts && (
                  <div style={{ fontSize: "0.75rem", color: "var(--legacy-good)", fontStyle: "italic", marginTop: 4 }}>
                    {hasQS ? "\u5168\u7ea2: hearts and pig flipped!" : "\u5168\u7ea2: hearts flipped!"}
                  </div>
                )}
                {tcNote && (
                  <div style={{ fontSize: "0.75rem", color: "var(--legacy-orange)", fontStyle: "italic", marginTop: 4 }}>
                    {tcNote}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: "0.8rem", color: "var(--legacy-gray-999)" }}>No scoring cards</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
