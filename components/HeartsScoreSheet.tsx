"use client";

interface HeartsScoreSheetProps {
  heartsScores: { roundNumber: number; scores: number[] }[];
  players: { name: string; seat: number }[];
  currentRound: number;
}

export default function HeartsScoreSheet({
  heartsScores,
  players,
  currentRound,
}: HeartsScoreSheetProps) {
  if (heartsScores.length === 0) return null;

  const sortedPlayers = [...players].sort((a, b) => a.seat - b.seat);

  // Calculate cumulative totals
  const cumulative = [0, 0, 0, 0];

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 8,
        padding: "1rem",
        fontSize: "0.85rem",
      }}
    >
      <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>Score Sheet</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ padding: "4px 8px", borderBottom: "2px solid #333", textAlign: "left" }}>
              Round
            </th>
            {sortedPlayers.map((p) => (
              <th
                key={p.seat}
                style={{ padding: "4px 8px", borderBottom: "2px solid #333", textAlign: "center" }}
              >
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {heartsScores.map((round) => {
            round.scores.forEach((s, i) => (cumulative[i] += s));
            const isCurrentRound = round.roundNumber === currentRound;
            return (
              <tr
                key={round.roundNumber}
                style={{ background: isCurrentRound ? "#fff3cd" : "transparent" }}
              >
                <td style={{ padding: "4px 8px", borderBottom: "1px solid #eee" }}>
                  {round.roundNumber}
                </td>
                {round.scores.map((score, idx) => (
                  <td
                    key={idx}
                    style={{
                      padding: "4px 8px",
                      borderBottom: "1px solid #eee",
                      textAlign: "center",
                      color: score > 0 ? "#dc3545" : score < 0 ? "#28a745" : "#666",
                      fontWeight: 600,
                    }}
                  >
                    {score > 0 ? `+${score}` : score}
                  </td>
                ))}
              </tr>
            );
          })}
          <tr style={{ fontWeight: 700, borderTop: "2px solid #333" }}>
            <td style={{ padding: "4px 8px" }}>Total</td>
            {cumulative.map((total, idx) => (
              <td
                key={idx}
                style={{
                  padding: "4px 8px",
                  textAlign: "center",
                  color: total > 0 ? "#dc3545" : total < 0 ? "#28a745" : "#666",
                }}
              >
                {total > 0 ? `+${total}` : total}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
