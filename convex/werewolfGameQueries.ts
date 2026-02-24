import { query } from "./_generated/server";
import { v } from "convex/values";
import { getValidNightActions, ROLES } from "./werewolfGameLogic";

export const getWerewolfGameState = query({
  args: { gameId: v.id("werewolfGames"), sessionId: v.string() },
  handler: async (ctx, { gameId, sessionId }) => {
    const game = await ctx.db.get(gameId);
    if (!game) return null;

    const room = await ctx.db.get(game.roomId);
    if (!room) return null;

    const player = room.players.find((p) => p.sessionId === sessionId);
    const mySeat = player?.seat ?? -1;
    const playerCount = room.players.length;

    if (game.phase === "results") {
      // Full reveal
      return {
        _id: game._id,
        phase: game.phase,
        mySeat,
        players: room.players,
        roomId: game.roomId,
        playerCount,
        selectedRoles: game.selectedRoles,
        originalRoles: game.originalRoles,
        currentRoles: game.currentRoles,
        centerCards: game.centerCards,
        currentCenterCards: game.currentCenterCards,
        nightInfo: game.nightInfo,
        votes: game.votes,
        killedSeats: game.killedSeats,
        winners: game.winners,
        nightActionQueue: game.nightActionQueue,
        nightActionIndex: game.nightActionIndex,
        myOriginalRole: mySeat >= 0 ? game.originalRoles[mySeat] : null,
      };
    }

    // During night: only show relevant info for current player's turn
    if (game.phase === "night") {
      const currentEntry = game.nightActionIndex < game.nightActionQueue.length
        ? game.nightActionQueue[game.nightActionIndex]
        : null;

      const isMyTurn = currentEntry && currentEntry.seat === mySeat;
      const myOriginalRole = mySeat >= 0 ? game.originalRoles[mySeat] : null;

      let nightActionOptions = null;
      if (isMyTurn && currentEntry) {
        const state = {
          originalRoles: game.originalRoles,
          currentRoles: game.currentRoles,
          centerCards: game.centerCards,
          currentCenterCards: game.currentCenterCards,
          nightActionQueue: game.nightActionQueue,
          nightActionIndex: game.nightActionIndex,
          nightActions: game.nightActions,
          nightInfo: game.nightInfo,
          playerCount,
        };
        nightActionOptions = getValidNightActions(currentEntry.role, state, mySeat);
      }

      return {
        _id: game._id,
        phase: game.phase,
        mySeat,
        players: room.players,
        roomId: game.roomId,
        playerCount,
        selectedRoles: game.selectedRoles,
        myOriginalRole,
        isMyTurn: !!isMyTurn,
        activeRole: currentEntry?.role ?? null,
        nightActionOptions,
        myNightInfo: mySeat >= 0 ? game.nightInfo[mySeat] : null,
        nightActionIndex: game.nightActionIndex,
        nightActionTotal: game.nightActionQueue.length,
        // Don't reveal roles or center cards
        originalRoles: null,
        currentRoles: null,
        centerCards: null,
        currentCenterCards: null,
        nightInfo: null,
        votes: null,
        killedSeats: [],
        winners: [],
        nightActionQueue: null,
      };
    }

    // Day phase: show what player learned, hide cards
    if (game.phase === "day") {
      return {
        _id: game._id,
        phase: game.phase,
        mySeat,
        players: room.players,
        roomId: game.roomId,
        playerCount,
        selectedRoles: game.selectedRoles,
        myOriginalRole: mySeat >= 0 ? game.originalRoles[mySeat] : null,
        myNightInfo: mySeat >= 0 ? game.nightInfo[mySeat] : null,
        dayStartTime: game.dayStartTime,
        dayTimeLimit: game.dayTimeLimit,
        isMyTurn: false,
        activeRole: null,
        nightActionOptions: null,
        originalRoles: null,
        currentRoles: null,
        centerCards: null,
        currentCenterCards: null,
        nightInfo: null,
        votes: null,
        killedSeats: [],
        winners: [],
        nightActionQueue: null,
        nightActionIndex: 0,
        nightActionTotal: 0,
      };
    }

    // Voting phase
    return {
      _id: game._id,
      phase: game.phase,
      mySeat,
      players: room.players,
      roomId: game.roomId,
      playerCount,
      selectedRoles: game.selectedRoles,
      myOriginalRole: mySeat >= 0 ? game.originalRoles[mySeat] : null,
      myNightInfo: mySeat >= 0 ? game.nightInfo[mySeat] : null,
      hasVoted: game.votes.some(v => v.seat === mySeat),
      votedCount: game.votes.length,
      isMyTurn: false,
      activeRole: null,
      nightActionOptions: null,
      originalRoles: null,
      currentRoles: null,
      centerCards: null,
      currentCenterCards: null,
      nightInfo: null,
      votes: null,
      killedSeats: [],
      winners: [],
      nightActionQueue: null,
      nightActionIndex: 0,
      nightActionTotal: 0,
    };
  },
});
