import { query } from "./_generated/server";
import { v } from "convex/values";

export const getBidGameState = query({
  args: { gameId: v.id("bidGames"), sessionId: v.string() },
  handler: async (ctx, { gameId, sessionId }) => {
    const game = await ctx.db.get(gameId);
    if (!game) return null;

    const room = await ctx.db.get(game.roomId);
    if (!room) return null;

    const player = room.players.find((p) => p.sessionId === sessionId);
    const mySeat = player?.seat ?? -1;

    // Redact other players' hands
    const hands = game.hands.map((hand, idx) =>
      idx === mySeat ? hand : hand.map(() => "??")
    );

    // Skull King bids are simultaneous and hidden until everyone has bid
    const allBid = game.bids.every((b) => b !== null);
    const bids =
      game.gameType === "skullking" && !allBid
        ? game.bids.map((b, idx) => (idx === mySeat ? b : null))
        : game.bids;
    const hasBid = game.bids.map((b) => b !== null);

    return {
      _id: game._id,
      gameType: game.gameType,
      phase: game.phase,
      roundNumber: game.roundNumber,
      totalRounds: game.totalRounds,
      numPlayers: game.numPlayers,
      dealerSeat: game.dealerSeat,
      hands,
      bids,
      hasBid,
      tricksWon: game.tricksWon,
      bonuses: game.bonuses,
      currentTrick: game.currentTrick,
      leadSeat: game.leadSeat,
      currentTurn: game.currentTurn,
      trickCount: game.tricks.length,
      lastTrick: game.tricks.length > 0 ? game.tricks[game.tricks.length - 1] : null,
      trumpCard: game.trumpCard,
      trumpSuit: game.trumpSuit,
      mySeat,
      handCounts: game.hands.map((h) => h.length),
      players: room.players,
      roomId: game.roomId,
      bidScores: room.bidScores ?? [],
    };
  },
});
