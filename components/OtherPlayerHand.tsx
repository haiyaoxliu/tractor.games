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
    ? "#ffc107"
    : showTeamLabel && isTeammate !== undefined
      ? (isTeammate ? "#28a745" : "#dc3545")
      : "#999";

  return (
    <div
      style={{
        textAlign: "center",
        padding: "0.5rem",
        background: isCurrentTurn ? "#fff3cd" : "#f8f9fa",
        borderRadius: 8,
        border: `2px solid ${borderColor}`,
        minWidth: 120,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 4 }}>
        {name}
        {showTeamLabel && isTeammate !== undefined && (isTeammate ? " (ally)" : " (opp)")}
      </div>
      <div style={{ fontSize: "0.85rem", color: "#666" }}>
        {cardCount} card{cardCount !== 1 ? "s" : ""}
      </div>
      {isCurrentTurn && (
        <div style={{ fontSize: "0.75rem", color: "#856404", fontWeight: 600, marginTop: 2 }}>
          Thinking...
        </div>
      )}
    </div>
  );
}
