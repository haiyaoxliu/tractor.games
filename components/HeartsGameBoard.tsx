"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import PlayerHand from "./PlayerHand";
import OtherPlayerHand from "./OtherPlayerHand";
import TrickArea from "./TrickArea";
import HeartsScoreSheet from "./HeartsScoreSheet";
import HeartsScoringBreakdown from "./HeartsScoringBreakdown";
import { sortHeartsHand } from "@/convex/heartsGameLogic";

interface HeartsGameState {
  _id: Id<"heartsGames">;
  phase: string;
  hands: string[][];
  currentTrick: { seat: number; cards: string[] }[];
  leadSeat: number;
  currentTurn: number;
  tricks: { plays: { seat: number; cards: string[] }[]; winner: number }[];
  capturedCards: string[][];
  mySeat: number;
  handCounts: number[];
  trickCount: number;
  players: { name: string; sessionId: string; seat: number }[];
  roomId: Id<"rooms">;
  roundNumber: number;
  heartsScores: { roundNumber: number; scores: number[] }[];
}

interface HeartsGameBoardProps {
  game: HeartsGameState;
  sessionId: string;
}

export default function HeartsGameBoard({ game, sessionId }: HeartsGameBoardProps) {
  const [error, setError] = useState<string | null>(null);

  const playCard = useMutation(api.heartsGame.playHeartsCard);
  const nextRound = useMutation(api.heartsGame.nextHeartsRound);

  const myHand = game.hands[game.mySeat] ?? [];
  const isMyTurn = game.currentTurn === game.mySeat;

  // Order other players relative to me: left, across, right
  const otherSeats = [
    (game.mySeat + 1) % 4,
    (game.mySeat + 2) % 4,
    (game.mySeat + 3) % 4,
  ];

  const handlePlay = async (cards: string[]) => {
    setError(null);
    try {
      await playCard({ gameId: game._id, sessionId, card: cards[0] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to play");
    }
  };

  const handleNextRound = async () => {
    setError(null);
    try {
      await nextRound({ roomId: game.roomId });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start next round");
    }
  };

  const lastTrick = game.tricks.length > 0 ? game.tricks[game.tricks.length - 1] : null;
  const turnPlayer = game.players.find((p) => p.seat === game.currentTurn);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "1rem" }}>
      {/* Game Status */}
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          padding: "0.5rem 1rem",
          textAlign: "center",
          marginBottom: "0.75rem",
          fontSize: "0.9rem",
        }}
      >
        <strong>Hearts (拱猪)</strong> — Round {game.roundNumber} — Trick {game.trickCount + 1}/13
        {game.phase === "playing" && (
          <span>
            {" "}— {isMyTurn ? <strong style={{ color: "#667eea" }}>Your Turn</strong> : `${turnPlayer?.name}'s turn`}
          </span>
        )}
        {game.phase === "scoring" && <span> — <strong>Round Over</strong></span>}
      </div>

      {/* Previous round scores */}
      {game.heartsScores.length > 0 && (
        <div style={{ marginBottom: "0.75rem" }}>
          <HeartsScoreSheet
            heartsScores={game.heartsScores}
            players={game.players}
            currentRound={game.roundNumber - 1}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            background: "#f8d7da",
            color: "#721c24",
            padding: "0.5rem 1rem",
            borderRadius: 6,
            fontSize: "0.85rem",
            margin: "0.5rem 0",
            textAlign: "center",
          }}
        >
          {error}
        </div>
      )}

      {/* Other Players */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          margin: "1rem 0",
          gap: "1rem",
        }}
      >
        {otherSeats.map((seat) => {
          const player = game.players.find((p) => p.seat === seat);
          return (
            <OtherPlayerHand
              key={seat}
              name={player?.name ?? `Seat ${seat}`}
              cardCount={game.handCounts[seat]}
              isCurrentTurn={game.currentTurn === seat}
              seat={seat}
              showTeamLabel={false}
            />
          );
        })}
      </div>

      {/* Trick Area */}
      {(game.phase === "playing" || game.phase === "scoring") && (
        <div
          style={{
            background: "#2d5a27",
            borderRadius: 12,
            padding: "1rem",
            margin: "0.5rem 0",
            minHeight: 200,
          }}
        >
          <TrickArea
            currentTrick={game.currentTrick}
            players={game.players}
            mySeat={game.mySeat}
          />
          {game.currentTrick.length === 0 && lastTrick && game.phase === "playing" && (
            <div style={{ textAlign: "center", color: "#90EE90", fontSize: "0.85rem" }}>
              Last trick won by{" "}
              {game.players.find((p) => p.seat === lastTrick.winner)?.name ?? "unknown"}
            </div>
          )}
        </div>
      )}

      {/* My Hand */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: "0.5rem",
          marginTop: "0.5rem",
          border: isMyTurn ? "3px solid #667eea" : "1px solid #ddd",
        }}
      >
        <div style={{ fontSize: "0.8rem", color: "#666", textAlign: "center", marginBottom: 4 }}>
          Your Hand ({myHand.length} cards)
          {isMyTurn && game.phase === "playing" && (
            <span style={{ color: "#667eea", fontWeight: 700 }}> — YOUR TURN</span>
          )}
        </div>
        <PlayerHand
          cards={myHand}
          onPlay={handlePlay}
          canPlay={isMyTurn && game.phase === "playing"}
          singleCardOnly
          sortFn={sortHeartsHand}
        />
      </div>

      {/* Scoring Phase */}
      {game.phase === "scoring" && (
        <div
          style={{
            textAlign: "center",
            padding: "1.5rem",
            background: "#d4edda",
            borderRadius: 12,
            marginTop: "1rem",
          }}
        >
          <h2 style={{ margin: "0 0 1rem" }}>Round {game.roundNumber} Complete!</h2>
          <HeartsScoringBreakdown
            capturedCards={game.capturedCards}
            players={game.players}
          />
          <button
            onClick={handleNextRound}
            style={{
              padding: "10px 24px",
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "#fff",
              background: "#667eea",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              marginTop: "1rem",
            }}
          >
            Next Round
          </button>
        </div>
      )}
    </div>
  );
}
