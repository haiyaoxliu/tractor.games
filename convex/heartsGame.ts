import { mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  createSingleDeck,
  shuffleCards,
  dealHearts,
  findTwoOfClubs,
  validateHeartsPlay,
  determineHeartsTrickWinner,
  calculateHeartsRoundScores,
} from "./heartsGameLogic";

export const startHeartsGame = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found");
    if (room.players.length !== 4) throw new Error("Need exactly 4 players");
    if (room.status !== "waiting") throw new Error("Game already started");
    if ((room.gameType ?? "tractor") !== "hearts") throw new Error("Room is not a Hearts game");

    const deck = shuffleCards(createSingleDeck());
    const { hands } = dealHearts(deck);
    const leadSeat = findTwoOfClubs(hands);
    const roundNumber = (room.heartsScores?.length ?? 0) + 1;

    const gameId = await ctx.db.insert("heartsGames", {
      roomId,
      phase: "playing",
      hands,
      currentTrick: [],
      leadSeat,
      currentTurn: leadSeat,
      tricks: [],
      capturedCards: [[], [], [], []],
      roundNumber,
    });

    await ctx.db.patch(roomId, {
      status: "playing",
      heartsGameId: gameId,
    });

    return gameId;
  },
});

export const playHeartsCard = mutation({
  args: {
    gameId: v.id("heartsGames"),
    sessionId: v.string(),
    card: v.string(),
  },
  handler: async (ctx, { gameId, sessionId, card }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    if (game.phase !== "playing") throw new Error("Not in playing phase");

    const room = await ctx.db.get(game.roomId);
    if (!room) throw new Error("Room not found");

    const player = room.players.find((p) => p.sessionId === sessionId);
    if (!player) throw new Error("Player not found");
    if (player.seat !== game.currentTurn) throw new Error("Not your turn");

    const hand = game.hands[player.seat];
    const error = validateHeartsPlay(card, hand, game.currentTrick);
    if (error) throw new Error(error);

    // Remove card from hand
    const newHand = [...hand];
    const idx = newHand.indexOf(card);
    newHand.splice(idx, 1);

    const newHands = game.hands.map((h) => [...h]);
    newHands[player.seat] = newHand;

    const newTrick = [...game.currentTrick, { seat: player.seat, cards: [card] }];

    // If all 4 players have played, resolve trick
    if (newTrick.length === 4) {
      const winnerSeat = determineHeartsTrickWinner(newTrick);
      const trickCards = newTrick.map((p) => p.cards[0]);

      // Add trick cards to winner's captured pile
      const newCaptured = game.capturedCards.map((c) => [...c]);
      newCaptured[winnerSeat] = [...newCaptured[winnerSeat], ...trickCards];

      const newTricks = [
        ...game.tricks,
        { plays: newTrick, winner: winnerSeat },
      ];

      // Check if round is over (13 tricks = all hands empty)
      const allEmpty = newHands.every((h) => h.length === 0);

      await ctx.db.patch(gameId, {
        hands: newHands,
        currentTrick: [],
        tricks: newTricks,
        capturedCards: newCaptured,
        leadSeat: winnerSeat,
        currentTurn: winnerSeat,
        phase: allEmpty ? "scoring" : "playing",
      });
    } else {
      const nextTurn = (player.seat + 1) % 4;
      await ctx.db.patch(gameId, {
        hands: newHands,
        currentTrick: newTrick,
        currentTurn: nextTurn,
      });
    }
  },
});

export const nextHeartsRound = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found");
    if (!room.heartsGameId) throw new Error("No current Hearts game");

    const game = await ctx.db.get(room.heartsGameId);
    if (!game) throw new Error("Game not found");
    if (game.phase !== "scoring") throw new Error("Game not in scoring phase");

    // Calculate scores from captured cards
    const roundScores = calculateHeartsRoundScores(game.capturedCards);
    const existingScores = room.heartsScores ?? [];
    const newScores = [
      ...existingScores,
      { roundNumber: game.roundNumber, scores: roundScores },
    ];

    // Create new game
    const deck = shuffleCards(createSingleDeck());
    const { hands } = dealHearts(deck);
    const leadSeat = findTwoOfClubs(hands);
    const newRoundNumber = newScores.length + 1;

    const newGameId = await ctx.db.insert("heartsGames", {
      roomId,
      phase: "playing",
      hands,
      currentTrick: [],
      leadSeat,
      currentTurn: leadSeat,
      tricks: [],
      capturedCards: [[], [], [], []],
      roundNumber: newRoundNumber,
    });

    await ctx.db.patch(roomId, {
      status: "playing",
      heartsGameId: newGameId,
      heartsScores: newScores,
    });

    return newGameId;
  },
});
