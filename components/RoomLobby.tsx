"use client";

import { GAME_META, resolveGameType } from "@/lib/gameMeta";

interface Player {
  name: string;
  sessionId: string;
  seat: number;
}

interface RoomLobbyProps {
  roomCode: string;
  players: Player[];
  onStart: () => void;
  canStart: boolean;
  sessionId: string;
  gameType?: string;
}

export default function RoomLobby({
  roomCode,
  players,
  onStart,
  canStart,
  sessionId,
  gameType,
}: RoomLobbyProps) {
  const type = resolveGameType(gameType);
  const meta = GAME_META[type];
  const isHost = players[0]?.sessionId === sessionId;
  const isTractor = type === "tractor";

  // Show seats for everyone joined plus the next empty one (up to max)
  const seatCount = Math.max(meta.min, Math.min(players.length + 1, meta.max));

  return (
    <div className="panel" style={{ maxWidth: 460, width: "100%", padding: "2rem", textAlign: "center" }}>
      <h2 style={{ margin: "0 0 0.25rem", fontSize: "1.4rem" }}>{meta.name}</h2>
      <p style={{ color: "var(--ink-soft)", fontSize: "0.85rem", margin: 0 }}>
        Share this code with friends to join
      </p>
      <div
        style={{
          fontSize: "2.2rem",
          fontWeight: 700,
          letterSpacing: "0.35em",
          color: "var(--accent)",
          margin: "1rem 0 1.5rem",
          fontFamily: "ui-monospace, monospace",
        }}
      >
        {roomCode}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.25rem" }}>
        {Array.from({ length: seatCount }, (_, seat) => {
          const player = players.find((p) => p.seat === seat);
          return (
            <div
              key={seat}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.65rem 1rem",
                background: player ? "var(--panel-tint)" : "var(--panel-soft)",
                borderRadius: 10,
                border: `1px solid ${player ? "var(--accent-soft)" : "var(--line)"}`,
              }}
            >
              <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                Seat {seat + 1}
                {isTractor ? (seat % 2 === 0 ? " · Team A" : " · Team B") : ""}
              </span>
              <span style={{ color: player ? "var(--ink)" : "var(--ink-faint)" }}>
                {player ? player.name : "Empty"}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginBottom: "1rem" }}>
        {players.length}/{meta.max} players
        {meta.min !== meta.max && ` · needs at least ${meta.min}`}
        {players.length < meta.min && " — waiting for more..."}
      </div>

      {isHost ? (
        <button className="btn btnPrimary" onClick={onStart} disabled={!canStart}>
          {canStart
            ? "Start Game"
            : `Waiting for ${meta.min - players.length} more player(s)`}
        </button>
      ) : (
        <div style={{ color: "var(--ink-soft)", fontStyle: "italic", fontSize: "0.9rem" }}>
          Waiting for host to start the game...
        </div>
      )}
    </div>
  );
}
