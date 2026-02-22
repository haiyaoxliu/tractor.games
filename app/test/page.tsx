"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import GameBoard from "@/components/GameBoard";

export default function TestPage() {
  const [gameId, setGameId] = useState<Id<"games"> | null>(null);
  const [sessionIds, setSessionIds] = useState<string[]>([]);
  const [activeSeat, setActiveSeat] = useState(0);

  const createTestGame = useMutation(api.game.createTestGame);

  const gameState = useQuery(
    api.gameQueries.getGameState,
    gameId ? { gameId, sessionId: sessionIds[activeSeat] ?? "" } : "skip"
  );

  const handleCreate = async () => {
    const result = await createTestGame();
    setGameId(result.gameId);
    setSessionIds(result.sessionIds);
    setActiveSeat(0);
  };

  return (
    <main style={{ minHeight: "100vh", background: "#1a1a2e", padding: "1rem" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}
        >
          <h1 style={{ color: "#fff", fontSize: "1.3rem", margin: 0 }}>
            Test Mode
          </h1>
          <button
            onClick={handleCreate}
            style={{
              background: "#667eea",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "0.5rem 1.2rem",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {gameId ? "New Test Game" : "Create Test Game"}
          </button>
        </div>

        {/* Seat Switcher */}
        {gameId && (
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginBottom: "1rem",
            }}
          >
            {[0, 1, 2, 3].map((seat) => (
              <button
                key={seat}
                onClick={() => setActiveSeat(seat)}
                style={{
                  flex: 1,
                  padding: "0.5rem",
                  borderRadius: 8,
                  border: "none",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  background: activeSeat === seat ? "#667eea" : "#333",
                  color: activeSeat === seat ? "#fff" : "#aaa",
                }}
              >
                Seat {seat} (P{seat})
                {gameState?.currentTurn === seat && " *"}
              </button>
            ))}
          </div>
        )}

        {/* Game Board */}
        {gameState && sessionIds.length > 0 && (
          <GameBoard game={gameState} sessionId={sessionIds[activeSeat]} />
        )}

        {/* No game yet */}
        {!gameId && (
          <div style={{ textAlign: "center", color: "#888", marginTop: "4rem" }}>
            <p>Click &quot;Create Test Game&quot; to start a 4-player game.</p>
            <p style={{ fontSize: "0.85rem" }}>
              Switch between seats to act as different players.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
