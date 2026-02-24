import { mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  validateRoleSelection,
  shuffleArray,
  buildNightActionQueue,
  processNightAction,
  resolveVotes,
  ROLES,
} from "./werewolfGameLogic";

export const startWerewolfGame = mutation({
  args: {
    roomId: v.id("rooms"),
    selectedRoles: v.array(v.string()),
  },
  handler: async (ctx, { roomId, selectedRoles }) => {
    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found");
    if (room.status !== "waiting") throw new Error("Game already started");
    if ((room.gameType ?? "tractor") !== "werewolf") throw new Error("Room is not a Werewolf game");

    const playerCount = room.players.length;
    if (playerCount < 5) throw new Error("Need at least 5 players");
    if (playerCount > 16) throw new Error("Maximum 16 players");

    const validationError = validateRoleSelection(selectedRoles, playerCount);
    if (validationError) throw new Error(validationError);

    // Shuffle and assign roles
    const shuffled = shuffleArray(selectedRoles);
    const playerRoles = shuffled.slice(0, playerCount);
    const centerCards = shuffled.slice(playerCount);

    const nightActionQueue = buildNightActionQueue(selectedRoles, playerRoles);
    const nightInfo: unknown[] = new Array(playerCount).fill(null);

    const gameId = await ctx.db.insert("werewolfGames", {
      roomId,
      phase: "night",
      selectedRoles,
      originalRoles: playerRoles,
      currentRoles: [...playerRoles],
      centerCards,
      currentCenterCards: [...centerCards],
      nightActionQueue,
      nightActionIndex: 0,
      nightActions: [],
      nightInfo: nightInfo.map(i => i ?? {}),
      votes: [],
      killedSeats: [],
      winners: [],
    });

    await ctx.db.patch(roomId, {
      status: "playing",
      werewolfGameId: gameId,
    });

    return gameId;
  },
});

export const performNightAction = mutation({
  args: {
    gameId: v.id("werewolfGames"),
    sessionId: v.string(),
    action: v.any(),
  },
  handler: async (ctx, { gameId, sessionId, action }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    if (game.phase !== "night") throw new Error("Not in night phase");

    const room = await ctx.db.get(game.roomId);
    if (!room) throw new Error("Room not found");

    const player = room.players.find((p) => p.sessionId === sessionId);
    if (!player) throw new Error("Player not found");

    // Check it's this player's turn in the night queue
    if (game.nightActionIndex >= game.nightActionQueue.length) {
      throw new Error("Night phase complete");
    }
    const currentEntry = game.nightActionQueue[game.nightActionIndex];
    if (currentEntry.seat !== player.seat) {
      throw new Error("Not your turn");
    }

    const playerCount = room.players.length;
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

    const result = processNightAction(state, player.seat, currentEntry.role, action);

    const newNightActions = [
      ...game.nightActions,
      { seat: player.seat, role: currentEntry.role, action },
    ];

    // Handle extra queue entries (from copycat/doppelganger)
    let newQueue = game.nightActionQueue;
    if (result.extraQueueEntries && result.extraQueueEntries.length > 0) {
      newQueue = [...game.nightActionQueue, ...result.extraQueueEntries];
      newQueue.sort((a, b) => a.order - b.order);
    }

    const newIndex = game.nightActionIndex + 1;

    // Check if night is over
    const nightOver = newIndex >= newQueue.length;

    await ctx.db.patch(gameId, {
      currentRoles: result.currentRoles,
      currentCenterCards: result.currentCenterCards,
      nightActions: newNightActions,
      nightInfo: result.nightInfo,
      nightActionQueue: newQueue,
      nightActionIndex: newIndex,
      phase: nightOver ? "day" : "night",
      dayStartTime: nightOver ? Date.now() : undefined,
    });
  },
});

export const skipToDay = mutation({
  args: { gameId: v.id("werewolfGames") },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    if (game.phase !== "night") throw new Error("Not in night phase");

    // Process remaining night actions with auto/skip behavior
    // For simplicity, just advance to day
    await ctx.db.patch(gameId, {
      phase: "day",
      nightActionIndex: game.nightActionQueue.length,
      dayStartTime: Date.now(),
    });
  },
});

export const startVoting = mutation({
  args: { gameId: v.id("werewolfGames") },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    if (game.phase !== "day") throw new Error("Not in day phase");

    await ctx.db.patch(gameId, { phase: "voting" });
  },
});

export const castVote = mutation({
  args: {
    gameId: v.id("werewolfGames"),
    sessionId: v.string(),
    targetSeat: v.number(),
  },
  handler: async (ctx, { gameId, sessionId, targetSeat }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    if (game.phase !== "voting") throw new Error("Not in voting phase");

    const room = await ctx.db.get(game.roomId);
    if (!room) throw new Error("Room not found");

    const player = room.players.find((p) => p.sessionId === sessionId);
    if (!player) throw new Error("Player not found");

    const playerCount = room.players.length;
    if (targetSeat < 0 || targetSeat >= playerCount) {
      throw new Error("Invalid target");
    }

    // Check if already voted
    if (game.votes.some((v) => v.seat === player.seat)) {
      throw new Error("Already voted");
    }

    const newVotes = [...game.votes, { seat: player.seat, targetSeat }];

    // If all players have voted, resolve
    if (newVotes.length === playerCount) {
      const { killedSeats, winners } = resolveVotes(
        newVotes,
        game.currentRoles,
        game.originalRoles,
        playerCount,
      );
      await ctx.db.patch(gameId, {
        votes: newVotes,
        phase: "results",
        killedSeats,
        winners,
      });
    } else {
      await ctx.db.patch(gameId, { votes: newVotes });
    }
  },
});

export const nextWerewolfRound = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found");

    await ctx.db.patch(roomId, {
      status: "waiting",
      werewolfGameId: undefined,
    });
  },
});
