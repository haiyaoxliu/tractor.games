"use client";

interface GameStatusProps {
  phase: string;
  trumpSuit?: string;
  currentTurn?: number;
  mySeat: number;
  players: { name: string; seat: number }[];
  attackerPoints: number;
  defendingTeam?: number[];
}

const SUIT_DISPLAY: Record<string, string> = {
  S: "♠ Spades",
  H: "♥ Hearts",
  D: "♦ Diamonds",
  C: "♣ Clubs",
};

export default function GameStatus({
  phase,
  trumpSuit,
  currentTurn,
  mySeat,
  players,
  attackerPoints,
  defendingTeam,
}: GameStatusProps) {
  let message = "";

  switch (phase) {
    case "declaring":
      message = "Declare trump suit! (Need a pair of 2s)";
      break;
    case "kitty":
      message = "Declarer is choosing cards to discard to the kitty.";
      break;
    case "playing":
      if (currentTurn === mySeat) {
        message = "Your turn to play!";
      } else {
        const turnPlayer = players.find((p) => p.seat === currentTurn);
        message = `Waiting for ${turnPlayer?.name ?? "unknown"}...`;
      }
      break;
    case "scoring": {
      const attackersWin = attackerPoints >= 80;
      const isDefender = defendingTeam?.includes(mySeat) ?? false;
      const youWin = attackersWin ? !isDefender : isDefender;
      message = youWin
        ? `You win! Attackers scored ${attackerPoints} points.`
        : `You lose. Attackers scored ${attackerPoints} points.`;
      break;
    }
  }

  return (
    <div
      style={{
        textAlign: "center",
        padding: "0.75rem",
        background: phase === "scoring" ? "#d4edda" : "#e2e3f1",
        borderRadius: 8,
        fontWeight: 600,
        fontSize: "1rem",
      }}
    >
      {trumpSuit && (
        <span style={{ marginRight: "1rem", fontSize: "0.9rem", fontWeight: 400 }}>
          Trump: {SUIT_DISPLAY[trumpSuit] ?? trumpSuit} (2s)
        </span>
      )}
      {message}
    </div>
  );
}
