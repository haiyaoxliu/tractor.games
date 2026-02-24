import { query } from "./_generated/server";
import { v } from "convex/values";

export const getHeartsGameState = query({
  args: { gameId: v.id("heartsGames"), sessionId: v.string() },
  handler: async (ctx, { gameId, sessionId }) => {
    const game = await ctx.db.get(gameId);
    if (!game) return null;

    const room = await ctx.db.get(game.roomId);
    if (!room) return null;

    const player = room.players.find((p) => p.sessionId === sessionId);
    const mySeat = player?.seat ?? -1;

    // Redact other players' hands
    const hands = game.hands.map((hand, idx) => {
      if (idx === mySeat) return hand;
      return hand.map(() => "??");
    });

    return {
      _id: game._id,
      phase: game.phase,
      hands,
      currentTrick: game.currentTrick,
      leadSeat: game.leadSeat,
      currentTurn: game.currentTurn,
      tricks: game.tricks,
      capturedCards: game.capturedCards,
      mySeat,
      handCounts: game.hands.map((h) => h.length),
      trickCount: game.tricks.length,
      players: room.players,
      roomId: game.roomId,
      roundNumber: game.roundNumber,
      heartsScores: room.heartsScores ?? [],
    };
  },
});
