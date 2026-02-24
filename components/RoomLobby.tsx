"use client";

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

const SEAT_LABELS = ["South (You)", "West", "North", "East"];

export default function RoomLobby({
  roomCode,
  players,
  onStart,
  canStart,
  sessionId,
  gameType,
}: RoomLobbyProps) {
  const isHearts = gameType === "hearts";
  const gameName = isHearts ? "Hearts" : "Tractor";
  const isHost = players[0]?.sessionId === sessionId;

  return (
    <div
      style={{
        maxWidth: 500,
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

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {[0, 1, 2, 3].map((seat) => {
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
        })}
      </div>

      <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "1rem" }}>
        {players.length}/4 players joined
        {players.length < 4 && " — waiting for more..."}
      </div>

      {isHost && (
        <button
          onClick={onStart}
          disabled={!canStart}
          style={{
            padding: "12px 32px",
            fontSize: "1.1rem",
            fontWeight: 600,
            color: "#fff",
            background: canStart
              ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              : "#ccc",
            border: "none",
            borderRadius: 8,
            cursor: canStart ? "pointer" : "not-allowed",
          }}
        >
          {canStart ? "Start Game" : `Waiting for ${4 - players.length} more player(s)`}
        </button>
      )}
      {!isHost && (
        <div style={{ color: "#666", fontStyle: "italic" }}>
          Waiting for host to start the game...
        </div>
      )}
    </div>
  );
}
