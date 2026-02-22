import { query } from "./_generated/server";
import { v } from "convex/values";

export const getGameStateAllHands = query({
  args: { gameId: v.id("games"), seat: v.number() },
  handler: async (ctx, { gameId, seat }) => {
    const game = await ctx.db.get(gameId);
    if (!game) return null;

    const room = await ctx.db.get(game.roomId);
    if (!room) return null;

    return {
      _id: game._id,
      phase: game.phase,
      trumpSuit: game.trumpSuit,
      trumpRank: game.trumpRank,
      declarerSeat: game.declarerSeat,
      defendingTeam: game.defendingTeam,
      hands: game.hands, // all hands unredacted
      kittyDiscards: game.phase === "scoring" ? game.kittyDiscards : [],
      currentTrick: game.currentTrick,
      leadSeat: game.leadSeat,
      currentTurn: game.currentTurn,
      tricks: game.tricks,
      attackerPoints: game.attackerPoints,
      mySeat: seat,
      handCounts: game.hands.map((h) => h.length),
      trickCount: game.tricks.length,
      players: room.players,
      declarations: game.declarations ?? [],
      noTrumpSuit: game.noTrumpSuit ?? false,
      teamRanks: room.teamRanks ?? [0, 0],
      defendingTeamIndex: room.defendingTeamIndex ?? 0,
      roomId: game.roomId,
      dealComplete: game.dealComplete,
      revealedCounts: game.revealedCounts ?? game.hands.map((h) => h.length),
    };
  },
});

export const getGameState = query({
  args: { gameId: v.id("games"), sessionId: v.string() },
  handler: async (ctx, { gameId, sessionId }) => {
    const game = await ctx.db.get(gameId);
    if (!game) return null;

    const room = await ctx.db.get(game.roomId);
    if (!room) return null;

    const player = room.players.find((p) => p.sessionId === sessionId);
    const mySeat = player?.seat ?? -1;

    const revealedCounts = game.revealedCounts ?? game.hands.map((h) => h.length);

    // Redact other players' hands, and unrevealed cards for own hand during declaring
    const hands = game.hands.map((hand, idx) => {
      if (idx === mySeat) {
        if (game.phase === "declaring") {
          const revealed = revealedCounts[idx] ?? hand.length;
          return hand.map((card, i) => (i < revealed ? card : "??"));
        }
        return hand; // after declaring, show full hand
      }
      return hand.map(() => "??"); // hide other players' cards
    });

    // Redact kitty unless it's the declaring phase and you're the declarer
    let kitty: string[] = [];
    if (game.phase === "kitty" && mySeat === game.declarerSeat) {
      // Declarer already has kitty in their hand at this point
      kitty = [];
    }

    return {
      _id: game._id,
      phase: game.phase,
      trumpSuit: game.trumpSuit,
      trumpRank: game.trumpRank,
      declarerSeat: game.declarerSeat,
      defendingTeam: game.defendingTeam,
      hands,
      kittyDiscards: game.phase === "scoring" ? game.kittyDiscards : [],
      currentTrick: game.currentTrick,
      leadSeat: game.leadSeat,
      currentTurn: game.currentTurn,
      tricks: game.tricks,
      attackerPoints: game.attackerPoints,
      mySeat,
      handCounts: game.hands.map((h) => h.length),
      trickCount: game.tricks.length,
      players: room.players,
      declarations: game.declarations ?? [],
      noTrumpSuit: game.noTrumpSuit ?? false,
      teamRanks: room.teamRanks ?? [0, 0],
      defendingTeamIndex: room.defendingTeamIndex ?? 0,
      roomId: game.roomId,
      dealComplete: game.dealComplete,
      revealedCounts,
    };
  },
});
