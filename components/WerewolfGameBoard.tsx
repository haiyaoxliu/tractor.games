"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { ROLES, ROLE_DESCRIPTIONS } from "@/convex/werewolfGameLogic";
import WerewolfRoleInfo from "./WerewolfRoleInfo";

interface WerewolfGameState {
  _id: Id<"werewolfGames">;
  phase: string;
  mySeat: number;
  players: { name: string; sessionId: string; seat: number }[];
  roomId: Id<"rooms">;
  playerCount: number;
  selectedRoles: string[];
  myOriginalRole: string | null;
  isMyTurn?: boolean;
  activeRole?: string | null;
  nightActionOptions?: {
    type: string;
    description: string;
    choices?: unknown;
  } | null;
  myNightInfo?: unknown;
  nightActionIndex?: number;
  nightActionTotal?: number;
  // Results
  originalRoles?: string[] | null;
  currentRoles?: string[] | null;
  centerCards?: string[] | null;
  currentCenterCards?: string[] | null;
  nightInfo?: unknown[] | null;
  votes?: { seat: number; targetSeat: number }[] | null;
  killedSeats?: number[];
  winners?: string[];
  hasVoted?: boolean;
  votedCount?: number;
  dayStartTime?: number;
}

interface Props {
  game: WerewolfGameState;
  sessionId: string;
}

export default function WerewolfGameBoard({ game, sessionId }: Props) {
  const [error, setError] = useState<string | null>(null);

  const performAction = useMutation(api.werewolfGame.performNightAction);
  const startVoting = useMutation(api.werewolfGame.startVoting);
  const castVote = useMutation(api.werewolfGame.castVote);
  const nextRound = useMutation(api.werewolfGame.nextWerewolfRound);

  const playerName = (seat: number) => {
    const p = game.players.find((pl) => pl.seat === seat);
    return p?.name ?? `Player ${seat + 1}`;
  };

  const isHost = game.players[0]?.sessionId === sessionId;

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "0 auto",
        color: "#fff",
        padding: "1rem",
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <span style={{ fontSize: "1.2rem", fontWeight: 700 }}>Werewolf</span>
          <span
            style={{
              marginLeft: 8,
              fontSize: "0.8rem",
              padding: "3px 8px",
              borderRadius: 4,
              background:
                game.phase === "night" ? "#2c3e50" :
                game.phase === "day" ? "#f39c12" :
                game.phase === "voting" ? "#e74c3c" :
                "#27ae60",
              fontWeight: 600,
            }}
          >
            {game.phase.toUpperCase()}
          </span>
        </div>
        <WerewolfRoleInfo />
      </div>

      {/* My role */}
      {game.myOriginalRole && (
        <div
          style={{
            background: "rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: "0.75rem 1rem",
            marginBottom: "1rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "#aaa", marginBottom: 4 }}>
            Your original role
          </div>
          <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>
            {ROLES[game.myOriginalRole]?.name ?? game.myOriginalRole}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#ccc", marginTop: 4 }}>
            {ROLE_DESCRIPTIONS[game.myOriginalRole]}
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: "#dc3545", padding: "0.5rem 1rem", borderRadius: 8, marginBottom: "1rem", fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      {/* Phase-specific content */}
      {game.phase === "night" && (
        <NightPhase
          game={game}
          sessionId={sessionId}
          playerName={playerName}
          onAction={async (action) => {
            setError(null);
            try {
              await performAction({ gameId: game._id, sessionId, action });
            } catch (e) {
              setError(e instanceof Error ? e.message : "Failed");
            }
          }}
        />
      )}

      {game.phase === "day" && (
        <DayPhase
          game={game}
          playerName={playerName}
          isHost={isHost}
          onStartVoting={async () => {
            setError(null);
            try {
              await startVoting({ gameId: game._id });
            } catch (e) {
              setError(e instanceof Error ? e.message : "Failed");
            }
          }}
        />
      )}

      {game.phase === "voting" && (
        <VotingPhase
          game={game}
          sessionId={sessionId}
          playerName={playerName}
          onVote={async (targetSeat) => {
            setError(null);
            try {
              await castVote({ gameId: game._id, sessionId, targetSeat });
            } catch (e) {
              setError(e instanceof Error ? e.message : "Failed");
            }
          }}
        />
      )}

      {game.phase === "results" && (
        <ResultsPhase
          game={game}
          playerName={playerName}
          isHost={isHost}
          onNextRound={async () => {
            setError(null);
            try {
              await nextRound({ roomId: game.roomId });
            } catch (e) {
              setError(e instanceof Error ? e.message : "Failed");
            }
          }}
        />
      )}
    </div>
  );
}

// ─── Night Phase ─────────────────────────────────────────────────

function NightPhase({
  game,
  sessionId,
  playerName,
  onAction,
}: {
  game: WerewolfGameState;
  sessionId: string;
  playerName: (seat: number) => string;
  onAction: (action: unknown) => Promise<void>;
}) {
  const [selectedTarget, setSelectedTarget] = useState<number | null>(null);
  const [selectedTarget2, setSelectedTarget2] = useState<number | null>(null);
  const [selectedCenter, setSelectedCenter] = useState<number | null>(null);
  const [selectedCenters, setSelectedCenters] = useState<number[]>([]);
  const [seerMode, setSeerMode] = useState<"player" | "center" | null>(null);
  const [witchStep, setWitchStep] = useState<"peek" | "swap">("peek");
  const [witchPeekedIndex, setWitchPeekedIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!game.isMyTurn) {
    return (
      <div style={{ textAlign: "center", padding: "2rem 0" }}>
        <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🌙</div>
        <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>Night Phase</div>
        <div style={{ color: "#aaa", marginTop: "0.5rem" }}>
          {game.nightActionIndex !== undefined && game.nightActionTotal !== undefined
            ? `Action ${game.nightActionIndex + 1} of ${game.nightActionTotal}`
            : "Waiting for other players..."}
        </div>
        <div style={{ color: "#888", marginTop: "0.5rem", fontSize: "0.85rem" }}>
          Close your eyes and wait...
        </div>
      </div>
    );
  }

  const opts = game.nightActionOptions;
  if (!opts) return null;

  const choices = opts.choices as Record<string, unknown> | undefined;

  const submit = async (action: unknown) => {
    setSubmitting(true);
    try {
      await onAction(action);
    } finally {
      setSubmitting(false);
      setSelectedTarget(null);
      setSelectedTarget2(null);
      setSelectedCenter(null);
      setSelectedCenters([]);
      setSeerMode(null);
      setWitchStep("peek");
      setWitchPeekedIndex(null);
    }
  };

  const playerButtons = (seats: number[], selected: number | null, onSelect: (s: number) => void) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
      {seats.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: selected === s ? "2px solid #667eea" : "1px solid #555",
            background: selected === s ? "rgba(102,126,234,0.3)" : "rgba(255,255,255,0.1)",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.85rem",
          }}
        >
          {playerName(s)}
        </button>
      ))}
    </div>
  );

  const centerButtons = (indices: number[], selected: number | null, onSelect: (i: number) => void) => (
    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
      {indices.map((i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          style={{
            padding: "8px 20px",
            borderRadius: 8,
            border: selected === i ? "2px solid #667eea" : "1px solid #555",
            background: selected === i ? "rgba(102,126,234,0.3)" : "rgba(255,255,255,0.1)",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Card {i + 1}
        </button>
      ))}
    </div>
  );

  const confirmButton = (label: string, disabled: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      disabled={disabled || submitting}
      style={{
        marginTop: 12,
        padding: "10px 24px",
        borderRadius: 8,
        border: "none",
        background: disabled || submitting ? "#555" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "#fff",
        cursor: disabled || submitting ? "not-allowed" : "pointer",
        fontWeight: 600,
        fontSize: "0.95rem",
      }}
    >
      {submitting ? "..." : label}
    </button>
  );

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.05)",
        borderRadius: 12,
        padding: "1.25rem",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "0.75rem", color: "#888", marginBottom: 4 }}>
        Your action as {ROLES[game.activeRole!]?.name ?? game.activeRole}
      </div>
      <div style={{ fontSize: "0.95rem", marginBottom: "1rem", color: "#ddd" }}>
        {opts.description}
      </div>

      {/* Werewolf: see wolves or lone wolf peek */}
      {opts.type === "see_wolves" && choices && (
        <div>
          {((choices as { otherWolves?: number[] }).otherWolves ?? (choices as { wolves?: number[] }).wolves ?? []).length > 0 ? (
            <div>
              <div style={{ marginBottom: 8, fontWeight: 600 }}>
                {((choices as { otherWolves?: number[] }).otherWolves ?? (choices as { wolves?: number[] }).wolves ?? []).map(s => playerName(s as number)).join(", ")}
              </div>
            </div>
          ) : (
            <div style={{ color: "#aaa" }}>None found.</div>
          )}
          {confirmButton("Acknowledge", false, () => submit({ type: "acknowledge" }))}
        </div>
      )}

      {opts.type === "lone_wolf_peek" && (
        <div>
          {centerButtons(
            (choices as { centerIndices: number[] }).centerIndices,
            selectedCenter,
            setSelectedCenter,
          )}
          {confirmButton("Peek", selectedCenter === null, () =>
            submit({ type: "lone_wolf_peek", centerIndex: selectedCenter })
          )}
        </div>
      )}

      {/* Minion */}
      {opts.type === "see_wolves" && game.activeRole === "minion" && (
        <div />
      )}

      {/* Apprentice Tanner */}
      {opts.type === "see_tanner" && choices && (
        <div>
          {(choices as { tannerSeat: number }).tannerSeat >= 0 ? (
            <div style={{ fontWeight: 600 }}>
              The Tanner is: {playerName((choices as { tannerSeat: number }).tannerSeat)}
            </div>
          ) : (
            <div style={{ fontWeight: 600, color: "#fd7e14" }}>
              No Tanner in game. You are now the Tanner!
            </div>
          )}
          {confirmButton("Acknowledge", false, () => submit({ type: "acknowledge" }))}
        </div>
      )}

      {/* Mason */}
      {opts.type === "see_masons" && choices && (
        <div>
          {((choices as { otherMasons: number[] }).otherMasons).length > 0 ? (
            <div style={{ fontWeight: 600 }}>
              Other Masons: {(choices as { otherMasons: number[] }).otherMasons.map(s => playerName(s)).join(", ")}
            </div>
          ) : (
            <div style={{ color: "#aaa" }}>You are the only Mason.</div>
          )}
          {confirmButton("Acknowledge", false, () => submit({ type: "acknowledge" }))}
        </div>
      )}

      {/* Seer */}
      {opts.type === "seer_choice" && choices && (
        <div>
          {!seerMode && (
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button
                onClick={() => setSeerMode("player")}
                style={{
                  padding: "10px 20px", borderRadius: 8, border: "1px solid #555",
                  background: "rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", fontWeight: 600,
                }}
              >
                View a Player
              </button>
              <button
                onClick={() => setSeerMode("center")}
                style={{
                  padding: "10px 20px", borderRadius: 8, border: "1px solid #555",
                  background: "rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", fontWeight: 600,
                }}
              >
                View 2 Center Cards
              </button>
            </div>
          )}
          {seerMode === "player" && (
            <div>
              {playerButtons(
                (choices as { players: number[] }).players,
                selectedTarget,
                setSelectedTarget,
              )}
              {confirmButton("View Card", selectedTarget === null, () =>
                submit({ type: "seer_player", targetSeat: selectedTarget })
              )}
            </div>
          )}
          {seerMode === "center" && (
            <div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                {((choices as { centerPairs: number[][] }).centerPairs).map((pair) => (
                  <button
                    key={pair.join(",")}
                    onClick={() => setSelectedCenters(pair)}
                    style={{
                      padding: "8px 16px", borderRadius: 8,
                      border: selectedCenters.join(",") === pair.join(",") ? "2px solid #667eea" : "1px solid #555",
                      background: selectedCenters.join(",") === pair.join(",") ? "rgba(102,126,234,0.3)" : "rgba(255,255,255,0.1)",
                      color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem",
                    }}
                  >
                    Cards {pair[0] + 1} & {pair[1] + 1}
                  </button>
                ))}
              </div>
              {confirmButton("View Cards", selectedCenters.length !== 2, () =>
                submit({ type: "seer_center", centerIndices: selectedCenters })
              )}
            </div>
          )}
        </div>
      )}

      {/* Robber */}
      {opts.type === "robber_swap" && choices && (
        <div>
          {playerButtons(
            (choices as { players: number[] }).players,
            selectedTarget,
            setSelectedTarget,
          )}
          {confirmButton("Swap Cards", selectedTarget === null, () =>
            submit({ type: "robber_swap", targetSeat: selectedTarget })
          )}
        </div>
      )}

      {/* Witch */}
      {opts.type === "witch_action" && choices && (
        <div>
          {witchStep === "peek" && (
            <div>
              <div style={{ marginBottom: 8, fontSize: "0.85rem", color: "#aaa" }}>Choose a center card to view:</div>
              {centerButtons(
                (choices as { centerIndices: number[] }).centerIndices,
                selectedCenter,
                setSelectedCenter,
              )}
              {confirmButton("View Card", selectedCenter === null, () => {
                setWitchPeekedIndex(selectedCenter);
                setWitchStep("swap");
              })}
            </div>
          )}
          {witchStep === "swap" && (
            <div>
              <div style={{ marginBottom: 8, fontSize: "0.85rem", color: "#aaa" }}>
                Now choose a player to swap this center card with, or skip:
              </div>
              {playerButtons(
                (choices as { players: number[] }).players,
                selectedTarget,
                setSelectedTarget,
              )}
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
                {confirmButton("Swap", selectedTarget === null, () =>
                  submit({
                    type: "witch_action",
                    witchCenterIndex: witchPeekedIndex,
                    witchTargetSeat: selectedTarget,
                    witchSkip: false,
                  })
                )}
                {confirmButton("Skip", false, () =>
                  submit({
                    type: "witch_action",
                    witchCenterIndex: witchPeekedIndex,
                    witchSkip: true,
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Troublemaker */}
      {opts.type === "troublemaker_swap" && choices && (
        <div>
          <div style={{ marginBottom: 8, fontSize: "0.85rem", color: "#aaa" }}>
            Select two players to swap ({selectedTarget !== null ? "1 selected" : "none selected"}):
          </div>
          {playerButtons(
            (choices as { players: number[] }).players,
            selectedTarget2 !== null ? selectedTarget2 : selectedTarget,
            (s) => {
              if (selectedTarget === null) setSelectedTarget(s);
              else if (s === selectedTarget) setSelectedTarget(null);
              else setSelectedTarget2(s);
            },
          )}
          {selectedTarget !== null && selectedTarget2 !== null && (
            <div style={{ marginTop: 8, fontSize: "0.85rem" }}>
              Swapping: {playerName(selectedTarget)} ↔ {playerName(selectedTarget2)}
            </div>
          )}
          {confirmButton("Swap", selectedTarget === null || selectedTarget2 === null, () =>
            submit({
              type: "troublemaker_swap",
              targetSeat1: selectedTarget,
              targetSeat2: selectedTarget2,
            })
          )}
        </div>
      )}

      {/* Gremlin */}
      {opts.type === "gremlin_swap" && choices && (
        <div>
          <div style={{ marginBottom: 8, fontSize: "0.85rem", color: "#aaa" }}>
            Select two players to swap (or skip):
          </div>
          {playerButtons(
            (choices as { players: number[] }).players,
            selectedTarget2 !== null ? selectedTarget2 : selectedTarget,
            (s) => {
              if (selectedTarget === null) setSelectedTarget(s);
              else if (s === selectedTarget) setSelectedTarget(null);
              else setSelectedTarget2(s);
            },
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
            {confirmButton("Swap", selectedTarget === null || selectedTarget2 === null, () =>
              submit({
                type: "gremlin_swap",
                targetSeat1: selectedTarget,
                targetSeat2: selectedTarget2,
              })
            )}
            {confirmButton("Skip", false, () => submit({ type: "gremlin_swap", skip: true }))}
          </div>
        </div>
      )}

      {/* Drunk */}
      {opts.type === "drunk_swap" && choices && (
        <div>
          {centerButtons(
            (choices as { centerIndices: number[] }).centerIndices,
            selectedCenter,
            setSelectedCenter,
          )}
          {confirmButton("Swap", selectedCenter === null, () =>
            submit({ type: "drunk_swap", centerIndex: selectedCenter })
          )}
        </div>
      )}

      {/* Insomniac */}
      {opts.type === "insomniac_peek" && (
        <div>
          {confirmButton("View Your Card", false, () => submit({ type: "insomniac_peek" }))}
        </div>
      )}

      {/* Copycat */}
      {opts.type === "copycat_peek" && choices && (
        <div>
          {centerButtons(
            (choices as { centerIndices: number[] }).centerIndices,
            selectedCenter,
            setSelectedCenter,
          )}
          {confirmButton("View & Copy", selectedCenter === null, () =>
            submit({ type: "copycat_peek", centerIndex: selectedCenter })
          )}
        </div>
      )}

      {/* Doppelganger */}
      {opts.type === "doppelganger_copy" && choices && (
        <div>
          {playerButtons(
            (choices as { players: number[] }).players,
            selectedTarget,
            setSelectedTarget,
          )}
          {confirmButton("View & Copy", selectedTarget === null, () =>
            submit({ type: "doppelganger_copy", targetSeat: selectedTarget })
          )}
        </div>
      )}
    </div>
  );
}

// ─── Night Info Display ──────────────────────────────────────────

function NightInfoDisplay({
  info,
  playerName,
}: {
  info: Record<string, unknown>;
  playerName: (seat: number) => string;
}) {
  if (!info || Object.keys(info).length === 0) return null;

  const items: string[] = [];

  if (info.otherWolves) {
    const wolves = info.otherWolves as number[];
    items.push(wolves.length > 0
      ? `Other Werewolves: ${wolves.map(s => playerName(s)).join(", ")}`
      : "You were the lone Werewolf"
    );
  }
  if (info.loneWolfPeek) {
    const peek = info.loneWolfPeek as { centerIndex: number; card: string };
    items.push(`Peeked at center card ${peek.centerIndex + 1}: ${ROLES[peek.card]?.name ?? peek.card}`);
  }
  if (info.wolves) {
    const wolves = info.wolves as number[];
    items.push(wolves.length > 0
      ? `Werewolves: ${wolves.map(s => playerName(s)).join(", ")}`
      : "No Werewolves among players"
    );
  }
  if (info.tannerSeat !== undefined) {
    const ts = info.tannerSeat as number;
    items.push(ts >= 0 ? `Tanner: ${playerName(ts)}` : "No Tanner — you are now the Tanner");
  }
  if (info.otherMasons) {
    const masons = info.otherMasons as number[];
    items.push(masons.length > 0
      ? `Other Masons: ${masons.map(s => playerName(s)).join(", ")}`
      : "You were the only Mason"
    );
  }
  if (info.seerPeek) {
    const peek = info.seerPeek as { seat: number; card: string };
    items.push(`Viewed ${playerName(peek.seat)}'s card: ${ROLES[peek.card]?.name ?? peek.card}`);
  }
  if (info.seerCenterPeek) {
    const cards = info.seerCenterPeek as { index: number; card: string }[];
    items.push(`Center cards: ${cards.map(c => `#${c.index + 1} = ${ROLES[c.card]?.name ?? c.card}`).join(", ")}`);
  }
  if (info.robberSwap) {
    const swap = info.robberSwap as { targetSeat: number; newCard: string };
    items.push(`Swapped with ${playerName(swap.targetSeat)}. Your new card: ${ROLES[swap.newCard]?.name ?? swap.newCard}`);
  }
  if (info.witchPeek) {
    const peek = info.witchPeek as { centerIndex: number; card: string };
    items.push(`Viewed center card ${peek.centerIndex + 1}: ${ROLES[peek.card]?.name ?? peek.card}`);
  }
  if (info.witchSwap) {
    const swap = info.witchSwap as { centerIndex: number; targetSeat: number };
    items.push(`Swapped center card ${swap.centerIndex + 1} with ${playerName(swap.targetSeat)}`);
  }
  if (info.troublemakerSwap) {
    const swap = info.troublemakerSwap as { seat1: number; seat2: number };
    items.push(`Swapped ${playerName(swap.seat1)} ↔ ${playerName(swap.seat2)}`);
  }
  if (info.gremlinSwap) {
    const swap = info.gremlinSwap as { seat1: number; seat2: number };
    items.push(`Swapped ${playerName(swap.seat1)} ↔ ${playerName(swap.seat2)}`);
  }
  if (info.gremlinSkip) items.push("Skipped swap");
  if (info.drunkSwap) {
    const swap = info.drunkSwap as { centerIndex: number };
    items.push(`Swapped your card with center card ${swap.centerIndex + 1}`);
  }
  if (info.insomniacCard) {
    items.push(`Your final card: ${ROLES[info.insomniacCard as string]?.name ?? info.insomniacCard}`);
  }
  if (info.copycatPeek) {
    const peek = info.copycatPeek as { centerIndex: number; card: string };
    items.push(`Copied center card ${peek.centerIndex + 1}: ${ROLES[peek.card]?.name ?? peek.card}`);
  }
  if (info.doppelgangerPeek) {
    const peek = info.doppelgangerPeek as { targetSeat: number; card: string };
    items.push(`Copied ${playerName(peek.targetSeat)}'s role: ${ROLES[peek.card]?.name ?? peek.card}`);
  }

  if (items.length === 0) return null;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.08)",
        borderRadius: 8,
        padding: "0.75rem 1rem",
        marginBottom: "1rem",
      }}
    >
      <div style={{ fontSize: "0.75rem", color: "#888", marginBottom: 6 }}>What you learned at night:</div>
      {items.map((item, i) => (
        <div key={i} style={{ fontSize: "0.85rem", color: "#ddd", marginBottom: 2 }}>
          {item}
        </div>
      ))}
    </div>
  );
}

// ─── Day Phase ───────────────────────────────────────────────────

function DayPhase({
  game,
  playerName,
  isHost,
  onStartVoting,
}: {
  game: WerewolfGameState;
  playerName: (seat: number) => string;
  isHost: boolean;
  onStartVoting: () => void;
}) {
  return (
    <div style={{ textAlign: "center" }}>
      <NightInfoDisplay
        info={(game.myNightInfo as Record<string, unknown>) ?? {}}
        playerName={playerName}
      />

      <div
        style={{
          background: "rgba(243,156,18,0.15)",
          borderRadius: 12,
          padding: "1.5rem",
          marginBottom: "1rem",
        }}
      >
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>☀️</div>
        <div style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Discussion Time
        </div>
        <div style={{ fontSize: "0.9rem", color: "#ccc" }}>
          Discuss in person! Figure out who the Werewolves are.
        </div>
      </div>

      {isHost && (
        <button
          onClick={onStartVoting}
          style={{
            padding: "12px 32px",
            fontSize: "1rem",
            fontWeight: 600,
            color: "#fff",
            background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Start Voting
        </button>
      )}
      {!isHost && (
        <div style={{ color: "#888", fontStyle: "italic", fontSize: "0.85rem" }}>
          Waiting for host to start voting...
        </div>
      )}
    </div>
  );
}

// ─── Voting Phase ────────────────────────────────────────────────

function VotingPhase({
  game,
  sessionId,
  playerName,
  onVote,
}: {
  game: WerewolfGameState;
  sessionId: string;
  playerName: (seat: number) => string;
  onVote: (targetSeat: number) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (game.hasVoted || submitted) {
    return (
      <div style={{ textAlign: "center", padding: "2rem 0" }}>
        <NightInfoDisplay
          info={(game.myNightInfo as Record<string, unknown>) ?? {}}
          playerName={playerName}
        />
        <div style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
          Vote Cast
        </div>
        <div style={{ color: "#aaa" }}>
          Waiting for others... ({game.votedCount ?? "?"}/{game.playerCount})
        </div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center" }}>
      <NightInfoDisplay
        info={(game.myNightInfo as Record<string, unknown>) ?? {}}
        playerName={playerName}
      />

      <div style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>
        Vote for who to kill:
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: "1rem" }}>
        {Array.from({ length: game.playerCount }, (_, i) => i).map((seat) => (
          <button
            key={seat}
            onClick={() => setSelected(seat)}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              border: selected === seat ? "2px solid #e74c3c" : "1px solid #555",
              background: selected === seat ? "rgba(231,76,60,0.3)" : "rgba(255,255,255,0.1)",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.9rem",
              opacity: seat === game.mySeat ? 0.5 : 1,
            }}
          >
            {playerName(seat)}
            {seat === game.mySeat ? " (you)" : ""}
          </button>
        ))}
      </div>

      <button
        onClick={() => {
          if (selected !== null) {
            setSubmitted(true);
            onVote(selected);
          }
        }}
        disabled={selected === null}
        style={{
          padding: "10px 24px",
          borderRadius: 8,
          border: "none",
          background: selected === null ? "#555" : "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
          color: "#fff",
          cursor: selected === null ? "not-allowed" : "pointer",
          fontWeight: 600,
          fontSize: "0.95rem",
        }}
      >
        Confirm Vote
      </button>
    </div>
  );
}

// ─── Results Phase ───────────────────────────────────────────────

function ResultsPhase({
  game,
  playerName,
  isHost,
  onNextRound,
}: {
  game: WerewolfGameState;
  playerName: (seat: number) => string;
  isHost: boolean;
  onNextRound: () => void;
}) {
  const killed = game.killedSeats ?? [];
  const winners = game.winners ?? [];
  const originalRoles = game.originalRoles ?? [];
  const currentRoles = game.currentRoles ?? [];
  const votes = game.votes ?? [];

  const winnerLabel = winners.length > 0
    ? winners.map(w => w === "village" ? "Village" : w === "werewolf" ? "Werewolf Team" : w === "tanner" ? "Tanner" : "Apprentice Tanner").join(" & ")
    : "No one";

  // Determine if this player won
  const myRole = game.mySeat >= 0 ? currentRoles[game.mySeat] : null;
  const myTeam = myRole ? ROLES[myRole]?.team : null;
  const iWon = winners.some(w => {
    if (w === "village" && (myTeam === "village")) return true;
    if (w === "werewolf" && (myTeam === "werewolf")) return true;
    if (w === "tanner" && myRole === "tanner") return true;
    if (w === "apprentice_tanner" && myRole === "apprentice_tanner") return true;
    return false;
  });

  return (
    <div>
      {/* Winner banner */}
      <div
        style={{
          textAlign: "center",
          background: iWon ? "rgba(39,174,96,0.2)" : "rgba(231,76,60,0.2)",
          borderRadius: 12,
          padding: "1.25rem",
          marginBottom: "1rem",
          border: `1px solid ${iWon ? "#27ae60" : "#e74c3c"}`,
        }}
      >
        <div style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 4 }}>
          {iWon ? "You Won!" : "You Lost"}
        </div>
        <div style={{ fontSize: "0.95rem", color: "#ccc" }}>
          {winnerLabel} wins!
        </div>
      </div>

      {/* Killed players */}
      {killed.length > 0 ? (
        <div style={{ marginBottom: "1rem", textAlign: "center" }}>
          <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: 4 }}>Killed:</div>
          <div style={{ fontWeight: 600 }}>
            {killed.map(s => playerName(s)).join(", ")}
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: "1rem", textAlign: "center", color: "#aaa" }}>
          No one was killed.
        </div>
      )}

      {/* All roles revealed */}
      <div
        style={{
          background: "rgba(255,255,255,0.05)",
          borderRadius: 12,
          padding: "1rem",
          marginBottom: "1rem",
        }}
      >
        <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: 8 }}>Role Reveal:</div>
        {Array.from({ length: game.playerCount }, (_, i) => i).map((seat) => {
          const orig = originalRoles[seat];
          const curr = currentRoles[seat];
          const changed = orig !== curr;
          const isDead = killed.includes(seat);
          const vote = votes.find(v => v.seat === seat);

          return (
            <div
              key={seat}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "6px 0",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                opacity: isDead ? 0.6 : 1,
              }}
            >
              <div>
                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                  {playerName(seat)}
                  {seat === game.mySeat ? " (you)" : ""}
                  {isDead ? " ☠️" : ""}
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "0.85rem" }}>
                  {ROLES[curr]?.name ?? curr}
                </span>
                {changed && (
                  <span style={{ fontSize: "0.7rem", color: "#aaa", marginLeft: 4 }}>
                    (was {ROLES[orig]?.name ?? orig})
                  </span>
                )}
                {vote && (
                  <span style={{ fontSize: "0.7rem", color: "#e74c3c", marginLeft: 6 }}>
                    voted {playerName(vote.targetSeat)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Center cards */}
      {game.centerCards && game.currentCenterCards && (
        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            borderRadius: 12,
            padding: "1rem",
            marginBottom: "1rem",
          }}
        >
          <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: 8 }}>Center Cards:</div>
          {game.currentCenterCards.map((card, i) => {
            const orig = game.centerCards![i];
            const changed = card !== orig;
            return (
              <div key={i} style={{ fontSize: "0.85rem", marginBottom: 2 }}>
                Card {i + 1}: {ROLES[card]?.name ?? card}
                {changed && (
                  <span style={{ fontSize: "0.7rem", color: "#aaa", marginLeft: 4 }}>
                    (was {ROLES[orig]?.name ?? orig})
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isHost && (
        <div style={{ textAlign: "center" }}>
          <button
            onClick={onNextRound}
            style={{
              padding: "12px 32px",
              fontSize: "1rem",
              fontWeight: 600,
              color: "#fff",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Back to Lobby
          </button>
        </div>
      )}
    </div>
  );
}
