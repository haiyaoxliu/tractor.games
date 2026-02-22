"use client";

import { calculateRankChange, PROGRESSION_RANKS } from "@/convex/gameLogic";

interface ScoreBoardProps {
  attackerPoints: number;
  trickCount: number;
  phase: string;
  declarerSeat?: number;
  defendingTeam?: number[];
  mySeat: number;
  players: { name: string; seat: number }[];
  teamRanks: number[];
  defendingTeamIndex: number;
}

export default function ScoreBoard({
  attackerPoints,
  trickCount,
  phase,
  declarerSeat,
  defendingTeam,
  mySeat,
  players,
  teamRanks,
  defendingTeamIndex,
}: ScoreBoardProps) {
  const isDefender = defendingTeam?.includes(mySeat) ?? false;
  const myRole = isDefender ? "Defender" : "Attacker";

  const attackingTeamIndex = defendingTeamIndex === 0 ? 1 : 0;
  const defRank = PROGRESSION_RANKS[teamRanks[defendingTeamIndex]] ?? "2";
  const atkRank = PROGRESSION_RANKS[teamRanks[attackingTeamIndex]] ?? "2";

  // Rank change preview
  const { attackerChange, defenderChange } = calculateRankChange(attackerPoints);

  return (
    <div
      style={{
        display: "flex",
        gap: "1.5rem",
        padding: "0.75rem 1rem",
        background: "#f8f9fa",
        borderRadius: 8,
        fontSize: "0.85rem",
        flexWrap: "wrap",
        justifyContent: "center",
      }}
    >
      <span>
        <strong>Role:</strong>{" "}
        <span style={{ color: isDefender ? "#28a745" : "#dc3545" }}>{myRole}</span>
      </span>
      <span>
        <strong>Attacker Pts:</strong> {attackerPoints}/80
      </span>
      <span>
        <strong>Tricks:</strong> {trickCount}/25
      </span>
      <span>
        <strong>Def Rank:</strong> {defRank}
      </span>
      <span>
        <strong>Atk Rank:</strong> {atkRank}
      </span>
      {declarerSeat !== undefined && (
        <span>
          <strong>Declarer:</strong>{" "}
          {players.find((p) => p.seat === declarerSeat)?.name ?? `Seat ${declarerSeat}`}
        </span>
      )}
      {phase === "playing" && (
        <span style={{ color: "#6c757d", fontSize: "0.8rem" }}>
          {defenderChange > 0
            ? `Def +${defenderChange}`
            : attackerChange > 0
              ? `Atk +${attackerChange}`
              : "Neutral"}
        </span>
      )}
    </div>
  );
}
