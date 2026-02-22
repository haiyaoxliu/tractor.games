"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getSessionId, getPlayerName } from "@/lib/cardUtils";
import RoomLobby from "@/components/RoomLobby";
import GameBoard from "@/components/GameBoard";

export default function RoomPage() {
  const params = useParams();
  const roomCode = (params.roomId as string).toUpperCase();

  const [sessionId, setSessionId] = useState("");
  const [playerName, setPlayerNameState] = useState<string | null>(null);

  useEffect(() => {
    setSessionId(getSessionId());
    setPlayerNameState(getPlayerName());
  }, []);

  const room = useQuery(api.rooms.getRoomByCode, { roomCode });
  const startGame = useMutation(api.game.startGame);

  // Get game state if game exists
  const gameId = room?.gameId;
  const gameState = useQuery(
    api.gameQueries.getGameState,
    gameId && sessionId ? { gameId, sessionId } : "skip"
  );

  if (!sessionId) {
    return (
      <main style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading...</p>
      </main>
    );
  }

  if (room === undefined) {
    return (
      <main style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading room...</p>
      </main>
    );
  }

  if (room === null) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: "2rem",
            borderRadius: 16,
            textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}
        >
          <h2>Room Not Found</h2>
          <p style={{ color: "#666", margin: "1rem 0" }}>
            Room code &quot;{roomCode}&quot; does not exist.
          </p>
          <a
            href="/"
            style={{
              color: "#667eea",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Back to Home
          </a>
        </div>
      </main>
    );
  }

  // Check if player is in the room
  const isInRoom = room.players.some((p) => p.sessionId === sessionId);

  if (!isInRoom) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: "2rem",
            borderRadius: 16,
            textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}
        >
          <h2>Not in Room</h2>
          <p style={{ color: "#666", margin: "1rem 0" }}>
            You haven&apos;t joined this room yet.
          </p>
          <a
            href="/"
            style={{
              color: "#667eea",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Back to Home
          </a>
        </div>
      </main>
    );
  }

  // Lobby view
  if (room.status === "waiting") {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <RoomLobby
          roomCode={room.roomCode}
          players={room.players}
          canStart={room.players.length === 4}
          sessionId={sessionId}
          onStart={async () => {
            try {
              await startGame({ roomId: room._id });
            } catch (e) {
              alert(e instanceof Error ? e.message : "Failed to start");
            }
          }}
        />
      </main>
    );
  }

  // Game view
  if (gameState) {
    return (
      <main style={{ minHeight: "100vh", padding: "1rem", background: "#1a1a2e" }}>
        <GameBoard game={gameState} sessionId={sessionId} />
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem", textAlign: "center" }}>
      <p style={{ color: "#fff" }}>Loading game...</p>
    </main>
  );
}
