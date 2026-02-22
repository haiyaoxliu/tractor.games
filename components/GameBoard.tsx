"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import PlayerHand from "./PlayerHand";
import OtherPlayerHand from "./OtherPlayerHand";
import TrickArea from "./TrickArea";
import TrumpDeclaration from "./TrumpDeclaration";
import ScoreBoard from "./ScoreBoard";
import GameStatus from "./GameStatus";
import { calculateRankChange, PROGRESSION_RANKS } from "@/convex/gameLogic";

interface Declaration {
  seat: number;
  suit?: string;
  strength: number;
}

interface GameState {
  _id: Id<"games">;
  phase: string;
  trumpSuit?: string;
  trumpRank: string;
  declarerSeat?: number;
  defendingTeam?: number[];
  hands: string[][];
  kittyDiscards: string[];
  currentTrick: { seat: number; cards: string[] }[];
  leadSeat?: number;
  currentTurn?: number;
  tricks: { plays: { seat: number; cards: string[] }[]; winner: number }[];
  attackerPoints: number;
  mySeat: number;
  handCounts: number[];
  trickCount: number;
  players: { name: string; sessionId: string; seat: number }[];
  declarations: Declaration[];
  noTrumpSuit: boolean;
  teamRanks: number[];
  defendingTeamIndex: number;
  roomId: Id<"rooms">;
  dealComplete: boolean;
  revealedCounts: number[];
}

interface GameBoardProps {
  game: GameState;
  sessionId: string;
}

export default function GameBoard({ game, sessionId }: GameBoardProps) {
  const [error, setError] = useState<string | null>(null);

  const revealCard = useMutation(api.game.revealCard);
  const declareTrump = useMutation(api.game.declareTrump);
  const finalizeTrump = useMutation(api.game.finalizeTrump);
  const discardKitty = useMutation(api.game.discardKitty);
  const playCards = useMutation(api.game.playCards);
  const nextRoundMut = useMutation(api.game.nextRound);

  const myHand = game.hands[game.mySeat] ?? [];
  const isMyTurn = game.currentTurn === game.mySeat;
  const isKittyPhase = game.phase === "kitty" && game.declarerSeat === game.mySeat;

  // Order other players relative to me: left, across, right
  const otherSeats = [
    (game.mySeat + 1) % 4, // left
    (game.mySeat + 2) % 4, // across (partner)
    (game.mySeat + 3) % 4, // right
  ];

  const handleDeclare = async (suit: string | undefined, type: "single" | "pair" | "smallJokerPair" | "bigJokerPair") => {
    setError(null);
    try {
      await declareTrump({ gameId: game._id, sessionId, suit, type });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to declare");
    }
  };

  const handleFinalize = async () => {
    setError(null);
    try {
      await finalizeTrump({ gameId: game._id });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to finalize");
    }
  };

  const handleDiscard = async (cards: string[]) => {
    setError(null);
    try {
      await discardKitty({ gameId: game._id, sessionId, discards: cards });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to discard");
    }
  };

  const handlePlay = async (cards: string[]) => {
    setError(null);
    try {
      await playCards({ gameId: game._id, sessionId, cards });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to play");
    }
  };

  const handleNextRound = async () => {
    setError(null);
    try {
      await nextRoundMut({ roomId: game.roomId });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start next round");
    }
  };

  const myRevealedCount = game.revealedCounts?.[game.mySeat] ?? myHand.length;
  const myTotalCards = game.handCounts[game.mySeat] ?? 0;
  const allMyCardsRevealed = myRevealedCount >= myTotalCards;

  const handleReveal = async (revealAll?: boolean) => {
    setError(null);
    try {
      await revealCard({ gameId: game._id, sessionId, revealAll });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reveal");
    }
  };

  const myTeam = game.defendingTeam ?? [];
  const isTeammate = (seat: number) => {
    if (myTeam.length === 0) {
      // Before declaration, teams are 0&2 vs 1&3
      return seat % 2 === game.mySeat % 2;
    }
    if (myTeam.includes(game.mySeat)) return myTeam.includes(seat);
    return !myTeam.includes(seat);
  };

  // Last completed trick (for showing results briefly)
  const lastTrick = game.tricks.length > 0 ? game.tricks[game.tricks.length - 1] : null;

  // Scoring info
  const { attackerChange, defenderChange } = calculateRankChange(game.attackerPoints);
  const defendingTeamIndex = game.defendingTeamIndex;
  const attackingTeamIndex = defendingTeamIndex === 0 ? 1 : 0;

  const defRankBefore = game.teamRanks[defendingTeamIndex];
  const atkRankBefore = game.teamRanks[attackingTeamIndex];
  const defRankAfter = defRankBefore + defenderChange;
  const atkRankAfter = atkRankBefore + attackerChange;

  const maxRankIdx = PROGRESSION_RANKS.length - 1;
  const matchWinner = defRankAfter > maxRankIdx ? defendingTeamIndex : atkRankAfter > maxRankIdx ? attackingTeamIndex : null;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "1rem" }}>
      {/* Game Status */}
      <GameStatus
        phase={game.phase}
        trumpSuit={game.trumpSuit}
        currentTurn={game.currentTurn}
        mySeat={game.mySeat}
        players={game.players}
        attackerPoints={game.attackerPoints}
        defendingTeam={game.defendingTeam}
      />

      {/* Scoreboard */}
      <div style={{ margin: "0.75rem 0" }}>
        <ScoreBoard
          attackerPoints={game.attackerPoints}
          trickCount={game.trickCount}
          phase={game.phase}
          declarerSeat={game.declarerSeat}
          defendingTeam={game.defendingTeam}
          mySeat={game.mySeat}
          players={game.players}
          teamRanks={game.teamRanks}
          defendingTeamIndex={game.defendingTeamIndex}
        />
      </div>

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

      {/* Card Reveal Controls */}
      {game.phase === "declaring" && !allMyCardsRevealed && (
        <div
          style={{
            textAlign: "center",
            padding: "1rem",
            background: "#e3f2fd",
            borderRadius: 8,
            border: "2px solid #42a5f5",
            margin: "1rem 0",
          }}
        >
          <p style={{ margin: "0 0 0.5rem", fontWeight: 600 }}>
            Drawing Cards ({myRevealedCount} / {myTotalCards})
          </p>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
            <button
              onClick={() => handleReveal(false)}
              style={{
                padding: "8px 20px",
                fontSize: "1rem",
                fontWeight: 600,
                color: "#fff",
                background: "#1976d2",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              Draw Card
            </button>
            <button
              onClick={() => handleReveal(true)}
              style={{
                padding: "8px 20px",
                fontSize: "0.9rem",
                fontWeight: 600,
                color: "#1976d2",
                background: "#e3f2fd",
                border: "2px solid #1976d2",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              Reveal All
            </button>
          </div>
        </div>
      )}

      {/* Waiting for others */}
      {game.phase === "declaring" && allMyCardsRevealed && !game.dealComplete && (
        <div
          style={{
            textAlign: "center",
            padding: "0.75rem",
            background: "#fff8e1",
            borderRadius: 8,
            border: "1px solid #ffca28",
            margin: "1rem 0",
            fontSize: "0.9rem",
            color: "#f57f17",
          }}
        >
          Waiting for other players to finish drawing cards...
        </div>
      )}

      {/* Trump Declaration */}
      {game.phase === "declaring" && (
        <TrumpDeclaration
          hand={myHand}
          onDeclare={handleDeclare}
          onFinalize={handleFinalize}
          trumpRank={game.trumpRank}
          declarations={game.declarations}
          players={game.players}
          dealComplete={game.dealComplete}
        />
      )}

      {/* Other Players (top row) */}
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
              isTeammate={isTeammate(seat)}
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
          {/* Show last trick winner */}
          {game.currentTrick.length === 0 && lastTrick && (
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
          trumpSuit={game.trumpSuit}
          trumpRank={game.trumpRank}
          noTrumpSuit={game.noTrumpSuit}
          onPlay={handlePlay}
          canPlay={isMyTurn && game.phase === "playing"}
          isKittyPhase={isKittyPhase}
          onDiscardKitty={handleDiscard}
        />
      </div>

      {/* Scoring Results */}
      {game.phase === "scoring" && (
        <div
          style={{
            textAlign: "center",
            padding: "2rem",
            background: matchWinner !== null ? "#fff3cd" : "#d4edda",
            borderRadius: 12,
            marginTop: "1rem",
          }}
        >
          {matchWinner !== null ? (
            <>
              <h2 style={{ margin: "0 0 0.5rem" }}>Match Over!</h2>
              <p style={{ fontSize: "1.2rem" }}>
                Attackers scored <strong>{game.attackerPoints}</strong> points.
              </p>
              <p style={{ fontSize: "1.3rem", fontWeight: 700, color: "#d4a017" }}>
                Team {matchWinner === 0 ? "A (Seats 0 & 2)" : "B (Seats 1 & 3)"} wins the match!
              </p>
            </>
          ) : (
            <>
              <h2 style={{ margin: "0 0 0.5rem" }}>Round Over!</h2>
              <p style={{ fontSize: "1.2rem" }}>
                Attackers scored <strong>{game.attackerPoints}</strong> points.
              </p>
              <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>
                {game.attackerPoints >= 80 ? "Attackers Win the Round!" : "Defenders Win the Round!"}
              </p>

              {/* Rank changes */}
              <div style={{ margin: "1rem 0", fontSize: "0.95rem" }}>
                <div>
                  Defenders (Team {defendingTeamIndex === 0 ? "A" : "B"}):{" "}
                  <strong>{PROGRESSION_RANKS[defRankBefore]}</strong>
                  {defenderChange > 0 && (
                    <span style={{ color: "#28a745" }}> → {PROGRESSION_RANKS[defRankAfter]}</span>
                  )}
                  {defenderChange === 0 && <span style={{ color: "#6c757d" }}> (no change)</span>}
                </div>
                <div>
                  Attackers (Team {attackingTeamIndex === 0 ? "A" : "B"}):{" "}
                  <strong>{PROGRESSION_RANKS[atkRankBefore]}</strong>
                  {attackerChange > 0 && (
                    <span style={{ color: "#28a745" }}> → {PROGRESSION_RANKS[atkRankAfter]}</span>
                  )}
                  {attackerChange === 0 && <span style={{ color: "#6c757d" }}> (no change)</span>}
                </div>
              </div>

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
                  marginTop: "0.5rem",
                }}
              >
                Next Round
              </button>
            </>
          )}

          {game.kittyDiscards.length > 0 && (
            <p style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.5rem" }}>
              Kitty discards: {game.kittyDiscards.join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
