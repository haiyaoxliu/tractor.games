"use client";

import type { CSSProperties } from "react";

interface BidRoundScore {
  roundNumber: number;
  bids: number[];
  tricks: number[];
  scores: number[];
  totals: number[];
}

interface BidScoreSheetProps {
  bidScores: BidRoundScore[];
  players: { name: string; seat: number }[];
  defaultOpen?: boolean;
}

export default function BidScoreSheet({ bidScores, players, defaultOpen }: BidScoreSheetProps) {
  if (bidScores.length === 0) return null;

  const seats = [...players].sort((a, b) => a.seat - b.seat);
  const latest = bidScores[bidScores.length - 1];

  const cell: CSSProperties = {
    padding: "4px 10px",
    textAlign: "center",
    whiteSpace: "nowrap",
  };

  return (
    <details className="panel" open={defaultOpen} style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
      <summary style={{ cursor: "pointer", fontWeight: 600, color: "var(--ink-soft)" }}>
        Scores after round {latest.roundNumber}
        {" — "}
        {seats
          .map((p) => `${p.name} ${latest.totals[p.seat] ?? 0}`)
          .join(" · ")}
      </summary>
      <div style={{ overflowX: "auto", marginTop: "0.5rem" }}>
        <table style={{ borderCollapse: "collapse", margin: "0 auto" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--line)" }}>
              <th style={{ ...cell, textAlign: "left" }}>Rd</th>
              {seats.map((p) => (
                <th key={p.seat} style={cell}>
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bidScores.map((r) => (
              <tr key={r.roundNumber} style={{ borderBottom: "1px solid var(--line)" }}>
                <td style={{ ...cell, textAlign: "left", color: "var(--ink-soft)" }}>
                  {r.roundNumber}
                </td>
                {seats.map((p) => {
                  const bid = r.bids[p.seat];
                  const won = r.tricks[p.seat];
                  const score = r.scores[p.seat];
                  const made = bid === won;
                  return (
                    <td key={p.seat} style={cell}>
                      <span style={{ color: "var(--ink-faint)" }}>
                        {won}/{bid}
                      </span>{" "}
                      <span style={{ color: made ? "var(--green)" : "var(--red)", fontWeight: 600 }}>
                        {score >= 0 ? `+${score}` : score}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <td style={{ ...cell, textAlign: "left", fontWeight: 700 }}>Σ</td>
              {seats.map((p) => (
                <td key={p.seat} style={{ ...cell, fontWeight: 700 }}>
                  {latest.totals[p.seat] ?? 0}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </details>
  );
}
