"use client";

const SUITS: { suit: string; label: string; color: string }[] = [
  { suit: "S", label: "♠ Spades", color: "#000" },
  { suit: "H", label: "♥ Hearts", color: "#e00" },
  { suit: "D", label: "♦ Diamonds", color: "#e00" },
  { suit: "C", label: "♣ Clubs", color: "#000" },
];

const SUIT_SYMBOLS: Record<string, string> = {
  S: "♠", H: "♥", D: "♦", C: "♣",
};

const STRENGTH_LABELS: Record<number, string> = {
  1: "Single",
  2: "Pair",
  3: "Small Joker Pair",
  4: "Big Joker Pair",
};

interface Declaration {
  seat: number;
  suit?: string;
  strength: number;
}

interface TrumpDeclarationProps {
  hand: string[];
  onDeclare: (suit: string | undefined, type: "single" | "pair" | "smallJokerPair" | "bigJokerPair") => void;
  onFinalize: () => void;
  trumpRank: string;
  declarations: Declaration[];
  players: { name: string; seat: number }[];
  dealComplete: boolean;
}

export default function TrumpDeclaration({
  hand,
  onDeclare,
  onFinalize,
  trumpRank,
  declarations,
  players,
  dealComplete,
}: TrumpDeclarationProps) {
  const currentDeclaration = declarations.length > 0 ? declarations[declarations.length - 1] : null;
  const currentStrength = currentDeclaration?.strength ?? 0;

  // Check which suit declarations are possible
  const suitOptions = SUITS.map((s) => {
    const count = hand.filter((c) => c === `${trumpRank}${s.suit}`).length;
    return {
      ...s,
      canSingle: count >= 1 && currentStrength < 1,
      canPair: count >= 2 && currentStrength < 2,
    };
  });

  const smallJokerCount = hand.filter((c) => c === "jk").length;
  const bigJokerCount = hand.filter((c) => c === "JK").length;
  const canSmallJokerPair = smallJokerCount >= 2 && currentStrength < 3;
  const canBigJokerPair = bigJokerCount >= 2 && currentStrength < 4;

  const anyCanDeclare =
    suitOptions.some((s) => s.canSingle || s.canPair) ||
    canSmallJokerPair ||
    canBigJokerPair;

  return (
    <div
      style={{
        textAlign: "center",
        padding: "1.5rem",
        background: "#fff3cd",
        borderRadius: 8,
        border: "2px solid #ffc107",
        margin: "1rem 0",
      }}
    >
      <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem" }}>
        Declare Trump Suit
      </h3>

      {/* Current declaration status */}
      {currentDeclaration && (
        <div
          style={{
            background: "#e8f5e9",
            padding: "0.5rem 1rem",
            borderRadius: 6,
            marginBottom: "1rem",
            fontSize: "0.9rem",
          }}
        >
          Current: <strong>
            {players.find((p) => p.seat === currentDeclaration.seat)?.name ?? `Seat ${currentDeclaration.seat}`}
          </strong> declared{" "}
          <strong>
            {currentDeclaration.suit ? SUIT_SYMBOLS[currentDeclaration.suit] : "No Trump"}{" "}
            ({STRENGTH_LABELS[currentDeclaration.strength]})
          </strong>
          {anyCanDeclare && (
            <span style={{ color: "#e67e22", fontWeight: 600, marginLeft: "0.5rem" }}>
              — Override possible!
            </span>
          )}
        </div>
      )}

      <p style={{ color: "#666", fontSize: "0.85rem", marginBottom: "1rem" }}>
        Declare with a single or pair of {trumpRank}s, or a joker pair.
        {currentStrength > 0 && " Higher strength overrides current declaration."}
      </p>

      {/* Suit declaration buttons */}
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
        {suitOptions.map((s) => (
          <div key={s.suit} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {s.canSingle && (
              <button
                onClick={() => onDeclare(s.suit, "single")}
                style={{
                  padding: "6px 12px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#fff",
                  background: s.color,
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  opacity: 0.7,
                }}
              >
                {s.label} (1)
              </button>
            )}
            {s.canPair && (
              <button
                onClick={() => onDeclare(s.suit, "pair")}
                style={{
                  padding: "8px 16px",
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "#fff",
                  background: s.color,
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                {s.label} (2)
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Joker pair buttons */}
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginTop: "0.75rem" }}>
        {canSmallJokerPair && (
          <button
            onClick={() => onDeclare(undefined, "smallJokerPair")}
            style={{
              padding: "8px 16px",
              fontSize: "1rem",
              fontWeight: 600,
              color: "#fff",
              background: "#6c757d",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            🃏 Small Joker Pair (No Trump)
          </button>
        )}
        {canBigJokerPair && (
          <button
            onClick={() => onDeclare(undefined, "bigJokerPair")}
            style={{
              padding: "8px 16px",
              fontSize: "1rem",
              fontWeight: 600,
              color: "#fff",
              background: "#343a40",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            🃏 Big Joker Pair (No Trump)
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginTop: "1rem" }}>
        <button
          onClick={onFinalize}
          disabled={!dealComplete}
          style={{
            padding: "8px 20px",
            fontSize: "0.95rem",
            fontWeight: 600,
            color: "#fff",
            background: dealComplete ? "#28a745" : "#a5d6a7",
            border: "none",
            borderRadius: 6,
            cursor: dealComplete ? "pointer" : "not-allowed",
            opacity: dealComplete ? 1 : 0.7,
          }}
        >
          {currentDeclaration
            ? `Confirm Declaration${!dealComplete ? " (drawing...)" : ""}`
            : `Proceed — No Trump Suit${!dealComplete ? " (drawing...)" : ""}`}
        </button>
      </div>
    </div>
  );
}
