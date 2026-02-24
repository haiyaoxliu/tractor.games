"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getSessionId, getPlayerName } from "@/lib/cardUtils";
import RoomLobby from "@/components/RoomLobby";
import GameBoard from "@/components/GameBoard";
import HeartsGameBoard from "@/components/HeartsGameBoard";

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
  const startHeartsGame = useMutation(api.heartsGame.startHeartsGame);

  const gameType = room?.gameType ?? "tractor";
  const isHearts = gameType === "hearts";

  // Get tractor game state if applicable
  const tractorGameId = room?.gameId;
  const tractorState = useQuery(
    api.gameQueries.getGameState,
    !isHearts && tractorGameId && sessionId ? { gameId: tractorGameId, sessionId } : "skip"
  );

  // Get hearts game state if applicable
  const heartsGameId = room?.heartsGameId;
  const heartsState = useQuery(
    api.heartsGameQueries.getHeartsGameState,
    isHearts && heartsGameId && sessionId ? { gameId: heartsGameId, sessionId } : "skip"
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
          gameType={gameType}
          onStart={async () => {
            try {
              if (isHearts) {
                await startHeartsGame({ roomId: room._id });
              } else {
                await startGame({ roomId: room._id });
              }
            } catch (e) {
              alert(e instanceof Error ? e.message : "Failed to start");
            }
          }}
        />
      </main>
    );
  }

  // Hearts game view
  if (isHearts && heartsState) {
    return (
      <main style={{ minHeight: "100vh", padding: "1rem", background: "#1a1a2e" }}>
        <HeartsGameBoard game={heartsState} sessionId={sessionId} />
      </main>
    );
  }

  // Tractor game view
  if (!isHearts && tractorState) {
    return (
      <main style={{ minHeight: "100vh", padding: "1rem", background: "#1a1a2e" }}>
        <GameBoard game={tractorState} sessionId={sessionId} />
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem", textAlign: "center" }}>
      <p style={{ color: "#fff" }}>Loading game...</p>
    </main>
  );
}
