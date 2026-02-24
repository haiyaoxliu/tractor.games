"use client";

import { useState } from "react";
import WerewolfRoleSelect from "./WerewolfRoleSelect";

interface Player {
  name: string;
  sessionId: string;
  seat: number;
}

interface RoomLobbyProps {
  roomCode: string;
  players: Player[];
  onStart: (selectedRoles?: string[]) => void;
  onLeave: () => void;
  canStart: boolean;
  sessionId: string;
  gameType?: string;
}

const SEAT_LABELS = ["South (You)", "West", "North", "East"];

export default function RoomLobby({
  roomCode,
  players,
  onStart,
  onLeave,
  canStart,
  sessionId,
  gameType,
}: RoomLobbyProps) {
  const isHearts = gameType === "hearts";
  const isWerewolf = gameType === "werewolf";
  const gameName = isWerewolf ? "Werewolf" : isHearts ? "Hearts" : "Tractor";
  const isHost = players[0]?.sessionId === sessionId;
  const maxPlayers = isWerewolf ? 16 : 4;

  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const requiredRoles = players.length + 3;
  const rolesValid = selectedRoles.length === requiredRoles;
  const canStartWerewolf = canStart && rolesValid;

  const effectiveCanStart = isWerewolf ? canStartWerewolf : canStart;

  return (
    <div
      style={{
        maxWidth: isWerewolf ? 600 : 500,
        margin: "0 auto",
        background: "#fff",
        borderRadius: 16,
        padding: "2rem",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        textAlign: "center",
      }}
    >
      <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem" }}>{gameName} Lobby</h2>
      <div
        style={{
          fontSize: "2rem",
          fontWeight: 700,
          letterSpacing: "0.3em",
          color: "#667eea",
          margin: "1rem 0",
          fontFamily: "monospace",
        }}
      >
        {roomCode}
      </div>
      <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
        Share this code with friends to join
      </p>

      {/* Player list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {isWerewolf ? (
          // Werewolf: dynamic player list
          players.map((player) => (
            <div
              key={player.seat}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.75rem 1rem",
                background: "#d4edda",
                borderRadius: 8,
                border: "1px solid #28a745",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                Player {player.seat + 1}
              </span>
              <span style={{ color: "#155724" }}>{player.name}</span>
            </div>
          ))
        ) : (
          // Card games: fixed 4 seats
          [0, 1, 2, 3].map((seat) => {
            const player = players.find((p) => p.seat === seat);
            return (
              <div
                key={seat}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.75rem 1rem",
                  background: player ? "#d4edda" : "#f8f9fa",
                  borderRadius: 8,
                  border: `1px solid ${player ? "#28a745" : "#ddd"}`,
                }}
              >
                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                  Seat {seat + 1}{!isHearts ? (seat % 2 === 0 ? " (Team A)" : " (Team B)") : ""}
                </span>
                <span style={{ color: player ? "#155724" : "#999" }}>
                  {player ? player.name : "Empty"}
                </span>
              </div>
            );
          })
        )}
      </div>

      <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "1rem" }}>
        {players.length}/{isWerewolf ? `${maxPlayers} players joined` : "4 players joined"}
        {!isWerewolf && players.length < 4 && " — waiting for more..."}
        {isWerewolf && players.length < 5 && " — need at least 5 players"}
      </div>

      {/* Werewolf role selection (host only) */}
      {isWerewolf && isHost && canStart && (
        <div style={{ marginBottom: "1.5rem" }}>
          <WerewolfRoleSelect
            selectedRoles={selectedRoles}
            onRolesChange={setSelectedRoles}
            playerCount={players.length}
          />
        </div>
      )}

      {isHost && (
        <button
          onClick={() => {
            if (isWerewolf) {
              onStart(selectedRoles);
            } else {
              onStart();
            }
          }}
          disabled={!effectiveCanStart}
          style={{
            padding: "10px 28px",
            fontSize: "1rem",
            fontWeight: 600,
            color: "#fff",
            background: effectiveCanStart
              ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              : "#ccc",
            border: "none",
            borderRadius: 8,
            cursor: effectiveCanStart ? "pointer" : "not-allowed",
          }}
        >
          {isWerewolf
            ? effectiveCanStart
              ? "Start Game"
              : players.length < 5
                ? `Need ${5 - players.length} more player(s)`
                : `Select ${requiredRoles - selectedRoles.length} more role(s)`
            : canStart
              ? "Start Game"
              : `Waiting for ${4 - players.length} more player(s)`
          }
        </button>
      )}
      {!isHost && (
        <div style={{ color: "#666", fontStyle: "italic" }}>
          Waiting for host to start the game...
        </div>
      )}

      <button
        onClick={onLeave}
        style={{
          display: "block",
          margin: "1.5rem auto 0",
          padding: "8px 24px",
          fontSize: "0.9rem",
          fontWeight: 600,
          color: "#dc3545",
          background: "transparent",
          border: "1px solid #dc3545",
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        Leave Room
      </button>
    </div>
  );
}
