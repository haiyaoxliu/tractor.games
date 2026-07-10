"use client";

interface OtherPlayerHandProps {
  name: string;
  cardCount: number;
  isCurrentTurn: boolean;
  seat: number;
  isTeammate?: boolean;
  showTeamLabel?: boolean;
}

export default function OtherPlayerHand({
  name,
  cardCount,
  isCurrentTurn,
  seat,
  isTeammate,
  showTeamLabel = true,
}: OtherPlayerHandProps) {
  const borderColor = isCurrentTurn
    ? "var(--accent)"
    : showTeamLabel && isTeammate !== undefined
      ? (isTeammate ? "var(--green)" : "var(--red)")
      : "var(--line)";

  return (
    <div
      className="panel"
      style={{
        textAlign: "center",
        padding: "0.5rem",
        borderColor,
        boxShadow: isCurrentTurn ? "0 0 0 2px var(--accent-soft)" : undefined,
        minWidth: 120,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 4 }}>
        {name}
        {showTeamLabel && isTeammate !== undefined && (isTeammate ? " (ally)" : " (opp)")}
      </div>
      <div style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>
        {cardCount} card{cardCount !== 1 ? "s" : ""}
      </div>
      {isCurrentTurn && (
        <div style={{ fontSize: "0.75rem", color: "var(--accent)", fontWeight: 600, marginTop: 2 }}>
          Thinking...
        </div>
      )}
    </div>
  );
}
