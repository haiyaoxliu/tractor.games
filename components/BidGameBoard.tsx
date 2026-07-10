"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import Card from "./Card";
import PlayerHand from "./PlayerHand";
import BidScoreSheet from "./BidScoreSheet";
import { sortBidHand } from "@/convex/bidGameLogic";
import { suitColor, suitSymbol } from "@/lib/cardUtils";

interface BidGameState {
  _id: Id<"bidGames">;
  gameType: "wizard" | "skullking";
  phase: string;
  roundNumber: number;
  totalRounds: number;
  numPlayers: number;
  dealerSeat: number;
  hands: string[][];
  bids: (number | null)[];
  hasBid: boolean[];
  tricksWon: number[];
  bonuses: number[];
  currentTrick: { seat: number; cards: string[] }[];
  leadSeat: number;
  currentTurn: number;
  trickCount: number;
  lastTrick: { plays: { seat: number; cards: string[] }[]; winner: number } | null;
  trumpCard?: string;
  trumpSuit?: string;
  mySeat: number;
  handCounts: number[];
  players: { name: string; sessionId: string; seat: number }[];
  roomId: Id<"rooms">;
  bidScores: {
    roundNumber: number;
    bids: number[];
    tricks: number[];
    scores: number[];
    totals: number[];
  }[];
}

interface BidGameBoardProps {
  game: BidGameState;
  sessionId: string;
}

export default function BidGameBoard({ game, sessionId }: BidGameBoardProps) {
  const [error, setError] = useState<string | null>(null);

  const placeBid = useMutation(api.bidGame.placeBid);
  const chooseTrump = useMutation(api.bidGame.chooseTrump);
  const playCard = useMutation(api.bidGame.playBidCard);
  const nextRound = useMutation(api.bidGame.nextBidRound);
  const restart = useMutation(api.bidGame.restartBidGame);

  const gameName = game.gameType === "wizard" ? "Wizard" : "Skull King";
  const n = game.numPlayers;
  const myHand = game.hands[game.mySeat] ?? [];
  const isMyTurn = game.currentTurn === game.mySeat;
  const isDealer = game.dealerSeat === game.mySeat;
  const nameOf = (seat: number) =>
    game.players.find((p) => p.seat === seat)?.name ?? `Seat ${seat + 1}`;

  // Other players in clockwise order starting from my left
  const otherSeats = Array.from({ length: n - 1 }, (_, i) => (game.mySeat + i + 1) % n);

  const run = async (fn: () => Promise<unknown>) => {
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  };

  const myBidTurn =
    game.phase === "bidding" &&
    (game.gameType === "wizard" ? isMyTurn : !game.hasBid[game.mySeat]);

  const lastRoundScore =
    game.bidScores.length > 0 ? game.bidScores[game.bidScores.length - 1] : null;
  const isFinalRound = game.roundNumber >= game.totalRounds;

  // ── Trump indicator ──
  const trumpInfo = (() => {
    if (game.gameType === "skullking")
      return <span style={{ fontWeight: 600 }}>🏴 Jolly Roger is trump</span>;
    if (game.phase === "choosingTrump")
      return <span>🧙 flipped — {nameOf(game.dealerSeat)} picks trump</span>;
    if (!game.trumpSuit || game.trumpSuit === "none")
      return <span style={{ fontWeight: 600 }}>No trump</span>;
    return (
      <span style={{ fontWeight: 700, color: suitColor(game.trumpSuit) }}>
        {suitSymbol(game.trumpSuit)} trump
      </span>
    );
  })();

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "1rem" }}>
      {/* Status bar */}
      <div
        className="panel"
        style={{
          padding: "0.6rem 1rem",
          textAlign: "center",
          marginBottom: "0.75rem",
          fontSize: "0.9rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem 1.25rem",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <strong>{gameName}</strong>
        <span>
          Round {game.roundNumber}/{game.totalRounds}
        </span>
        {trumpInfo}
        {game.trumpCard && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            flipped: <Card card={game.trumpCard} small />
          </span>
        )}
        {game.phase === "playing" && (
          <span>
            Trick {game.trickCount + 1}/{game.roundNumber} —{" "}
            {isMyTurn ? (
              <strong style={{ color: "var(--accent)" }}>your turn</strong>
            ) : (
              `${nameOf(game.currentTurn)}'s turn`
            )}
          </span>
        )}
        {game.phase === "bidding" && game.gameType === "wizard" && (
          <span>
            bidding —{" "}
            {isMyTurn ? (
              <strong style={{ color: "var(--accent)" }}>your bid</strong>
            ) : (
              `${nameOf(game.currentTurn)}'s bid`
            )}
          </span>
        )}
        {game.phase === "bidding" && game.gameType === "skullking" && (
          <span>secret bidding — {game.hasBid.filter(Boolean).length}/{n} in</span>
        )}
      </div>

      {/* Score sheet */}
      {game.bidScores.length > 0 && game.phase !== "scoring" && game.phase !== "finished" && (
        <div style={{ marginBottom: "0.75rem" }}>
          <BidScoreSheet bidScores={game.bidScores} players={game.players} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            background: "#fef2f2",
            color: "#991b1b",
            border: "1px solid #fecaca",
            padding: "0.5rem 1rem",
            borderRadius: 8,
            fontSize: "0.85rem",
            margin: "0.5rem 0",
            textAlign: "center",
          }}
        >
          {error}
        </div>
      )}

      {/* Other players */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "0.75rem",
          margin: "0.75rem 0",
        }}
      >
        {otherSeats.map((seat) => {
          const isTurn =
            (game.phase === "playing" || (game.phase === "bidding" && game.gameType === "wizard")) &&
            game.currentTurn === seat;
          const bid = game.bids[seat];
          return (
            <div
              key={seat}
              className="panel"
              style={{
                padding: "0.5rem 0.9rem",
                minWidth: 110,
                textAlign: "center",
                borderColor: isTurn ? "var(--accent)" : undefined,
                boxShadow: isTurn ? "0 0 0 2px var(--accent-soft)" : undefined,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                {nameOf(seat)}
                {game.dealerSeat === seat && (
                  <span style={{ color: "var(--gold)", fontSize: "0.75rem" }}> · D</span>
                )}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--ink-soft)", marginTop: 2 }}>
                {game.phase === "bidding" || game.phase === "choosingTrump" ? (
                  game.hasBid[seat] ? (
                    bid !== null ? `bid ${bid}` : "bid ✓"
                  ) : (
                    "bidding…"
                  )
                ) : (
                  <>
                    won {game.tricksWon[seat]}/{bid ?? 0}
                  </>
                )}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--ink-faint)" }}>
                {game.handCounts[seat]} card{game.handCounts[seat] !== 1 ? "s" : ""}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trump choosing */}
      {game.phase === "choosingTrump" && (
        <div className="panel" style={{ padding: "1.25rem", textAlign: "center", margin: "0.75rem 0" }}>
          {isDealer ? (
            <>
              <div style={{ marginBottom: "0.75rem", fontWeight: 600 }}>
                A Wizard was flipped — choose the trump suit
              </div>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                {["S", "H", "D", "C"].map((suit) => (
                  <button
                    key={suit}
                    className="btn"
                    style={{ fontSize: "1.5rem", color: suitColor(suit), padding: "8px 18px" }}
                    onClick={() => run(() => chooseTrump({ gameId: game._id, sessionId, suit }))}
                  >
                    {suitSymbol(suit)}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div style={{ color: "var(--ink-soft)" }}>
              Waiting for {nameOf(game.dealerSeat)} to choose trump…
            </div>
          )}
        </div>
      )}

      {/* Bidding */}
      {game.phase === "bidding" && (
        <div className="panel" style={{ padding: "1.25rem", textAlign: "center", margin: "0.75rem 0" }}>
          {myBidTurn ? (
            <>
              <div style={{ marginBottom: "0.75rem", fontWeight: 600 }}>
                How many tricks will you win this round?
              </div>
              <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", flexWrap: "wrap" }}>
                {Array.from({ length: game.roundNumber + 1 }, (_, b) => (
                  <button
                    key={b}
                    className="btn"
                    style={{ minWidth: 44, fontVariantNumeric: "tabular-nums" }}
                    onClick={() => run(() => placeBid({ gameId: game._id, sessionId, bid: b }))}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div style={{ color: "var(--ink-soft)" }}>
              {game.gameType === "wizard"
                ? `Waiting for ${nameOf(game.currentTurn)} to bid…`
                : "Bid placed — waiting for the others…"}
            </div>
          )}
        </div>
      )}

      {/* Trick area */}
      {(game.phase === "playing" || game.phase === "scoring") && (
        <div
          className="panel"
          style={{
            background: "var(--panel-soft)",
            padding: "1rem",
            margin: "0.75rem 0",
            minHeight: 150,
            textAlign: "center",
          }}
        >
          {game.currentTrick.length > 0 ? (
            <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0.75rem" }}>
              {game.currentTrick.map((play) => (
                <div key={play.seat} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginBottom: 2 }}>
                    {play.seat === game.mySeat ? "You" : nameOf(play.seat)}
                  </div>
                  <Card card={play.cards[0]} />
                </div>
              ))}
            </div>
          ) : game.lastTrick && game.phase === "playing" ? (
            <div style={{ paddingTop: "0.5rem" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--ink-soft)", marginBottom: 4 }}>
                Last trick — won by{" "}
                <strong>
                  {game.lastTrick.winner === game.mySeat ? "you" : nameOf(game.lastTrick.winner)}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0.25rem", opacity: 0.6 }}>
                {game.lastTrick.plays.map((play) => (
                  <Card key={play.seat} card={play.cards[0]} small />
                ))}
              </div>
            </div>
          ) : (
            <div style={{ color: "var(--ink-faint)", paddingTop: "2rem" }}>
              {game.phase === "playing" ? `${nameOf(game.currentTurn)} leads the trick` : ""}
            </div>
          )}
        </div>
      )}

      {/* My hand */}
      {game.phase !== "finished" && (
        <div
          className="panel"
          style={{
            padding: "0.5rem",
            marginTop: "0.5rem",
            borderColor: isMyTurn && game.phase === "playing" ? "var(--accent)" : undefined,
            boxShadow:
              isMyTurn && game.phase === "playing" ? "0 0 0 2px var(--accent-soft)" : undefined,
          }}
        >
          <div style={{ fontSize: "0.8rem", color: "var(--ink-soft)", textAlign: "center", marginTop: 4 }}>
            Your hand
            {game.phase === "playing" && (
              <>
                {" "}
                · bid {game.bids[game.mySeat] ?? 0} · won {game.tricksWon[game.mySeat]}
              </>
            )}
            {isDealer && " · you are the dealer"}
          </div>
          <PlayerHand
            cards={myHand}
            onPlay={(cards) =>
              run(() => playCard({ gameId: game._id, sessionId, card: cards[0] }))
            }
            canPlay={isMyTurn && game.phase === "playing"}
            singleCardOnly
            sortFn={(cards) => sortBidHand(game.gameType, cards)}
          />
        </div>
      )}

      {/* Round scoring */}
      {game.phase === "scoring" && lastRoundScore && (
        <div
          className="panel"
          style={{ textAlign: "center", padding: "1.5rem", marginTop: "1rem" }}
        >
          <h2 style={{ margin: "0 0 1rem", fontSize: "1.2rem" }}>
            Round {game.roundNumber} complete
          </h2>
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0.75rem" }}>
            {[...game.players]
              .sort((a, b) => a.seat - b.seat)
              .map((p) => {
                const bid = lastRoundScore.bids[p.seat];
                const won = lastRoundScore.tricks[p.seat];
                const score = lastRoundScore.scores[p.seat];
                const made = bid === won;
                return (
                  <div
                    key={p.seat}
                    className="panel"
                    style={{ padding: "0.75rem 1.1rem", minWidth: 110, background: "var(--panel-soft)" }}
                  >
                    <div style={{ fontWeight: 700 }}>{p.name}</div>
                    <div style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>
                      {won}/{bid} tricks
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "1.1rem",
                        color: made ? "var(--green)" : "var(--red)",
                      }}
                    >
                      {score >= 0 ? `+${score}` : score}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--ink-faint)" }}>
                      total {lastRoundScore.totals[p.seat]}
                    </div>
                  </div>
                );
              })}
          </div>
          <button
            className="btn btnPrimary"
            style={{ marginTop: "1.25rem" }}
            onClick={() => run(() => nextRound({ roomId: game.roomId }))}
          >
            {isFinalRound ? "Show Final Results" : `Deal Round ${game.roundNumber + 1}`}
          </button>
        </div>
      )}

      {/* Finished */}
      {game.phase === "finished" && lastRoundScore && (
        <div className="panel" style={{ textAlign: "center", padding: "2rem", marginTop: "1rem" }}>
          <h2 style={{ margin: "0 0 1.25rem" }}>🏆 Final Standings</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: 360, margin: "0 auto" }}>
            {[...game.players]
              .sort((a, b) => (lastRoundScore.totals[b.seat] ?? 0) - (lastRoundScore.totals[a.seat] ?? 0))
              .map((p, i) => (
                <div
                  key={p.seat}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.6rem 1rem",
                    borderRadius: 10,
                    background: i === 0 ? "var(--panel-tint)" : "var(--panel-soft)",
                    border: `1px solid ${i === 0 ? "var(--accent-soft)" : "var(--line)"}`,
                    fontWeight: i === 0 ? 700 : 500,
                  }}
                >
                  <span>
                    {i === 0 ? "👑 " : `${i + 1}. `}
                    {p.name}
                  </span>
                  <span>{lastRoundScore.totals[p.seat] ?? 0}</span>
                </div>
              ))}
          </div>
          <div style={{ marginTop: "1.25rem" }}>
            <BidScoreSheet bidScores={game.bidScores} players={game.players} />
          </div>
          <button
            className="btn btnPrimary"
            style={{ marginTop: "1.25rem" }}
            onClick={() => run(() => restart({ roomId: game.roomId }))}
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
