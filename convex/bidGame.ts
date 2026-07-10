import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { MutationCtx } from "./_generated/server";
import {
  BID_GAME_LIMITS,
  BidGameType,
  createSkullKingDeck,
  createWizardDeck,
  dealBidRound,
  determineBidTrickWinner,
  isJester,
  isWizard,
  scoreSkullKingRound,
  scoreWizardRound,
  shuffleCards,
  skullKingTrickBonus,
  totalRoundsFor,
  validateBidPlay,
} from "./bidGameLogic";

// Deal a round and return the fields for a fresh bidGames doc
function dealRound(
  gameType: BidGameType,
  numPlayers: number,
  roundNumber: number,
  totalRounds: number,
  dealerSeat: number
) {
  const deck = shuffleCards(
    gameType === "wizard" ? createWizardDeck() : createSkullKingDeck()
  );
  const { hands, rest } = dealBidRound(deck, numPlayers, roundNumber);

  let trumpCard: string | undefined;
  let trumpSuit: string | undefined;
  let phase: "choosingTrump" | "bidding" = "bidding";

  if (gameType === "skullking") {
    trumpSuit = "B"; // Jolly Roger is always trump
  } else if (rest.length > 0) {
    trumpCard = rest[0];
    if (isWizard(trumpCard)) {
      phase = "choosingTrump"; // dealer picks
    } else if (isJester(trumpCard)) {
      trumpSuit = "none";
    } else {
      trumpSuit = trumpCard[1];
    }
  } else {
    trumpSuit = "none"; // final wizard round: whole deck dealt
  }

  const firstSeat = (dealerSeat + 1) % numPlayers;

  return {
    gameType,
    phase,
    roundNumber,
    totalRounds,
    numPlayers,
    dealerSeat,
    hands,
    bids: Array.from({ length: numPlayers }, () => null as number | null),
    tricksWon: Array.from({ length: numPlayers }, () => 0),
    bonuses: Array.from({ length: numPlayers }, () => 0),
    currentTrick: [],
    leadSeat: firstSeat,
    currentTurn: phase === "choosingTrump" ? dealerSeat : firstSeat,
    tricks: [],
    trumpCard,
    trumpSuit,
  };
}

export const startBidGame = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found");
    const gameType = room.gameType;
    if (gameType !== "wizard" && gameType !== "skullking")
      throw new Error("Room is not a bidding game");
    if (room.status !== "waiting") throw new Error("Game already started");

    const limits = BID_GAME_LIMITS[gameType];
    const n = room.players.length;
    if (n < limits.min || n > limits.max)
      throw new Error(`Need ${limits.min}-${limits.max} players`);

    const totalRounds = totalRoundsFor(gameType, n);
    const gameId = await ctx.db.insert("bidGames", {
      roomId,
      ...dealRound(gameType, n, 1, totalRounds, 0),
    });

    await ctx.db.patch(roomId, {
      status: "playing",
      bidGameId: gameId,
      bidScores: [],
    });

    return gameId;
  },
});

export const chooseTrump = mutation({
  args: {
    gameId: v.id("bidGames"),
    sessionId: v.string(),
    suit: v.string(), // "S"|"H"|"D"|"C"
  },
  handler: async (ctx, { gameId, sessionId, suit }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    if (game.phase !== "choosingTrump") throw new Error("Not choosing trump");
    if (!["S", "H", "D", "C"].includes(suit)) throw new Error("Invalid suit");

    const room = await ctx.db.get(game.roomId);
    if (!room) throw new Error("Room not found");
    const player = room.players.find((p) => p.sessionId === sessionId);
    if (!player) throw new Error("Player not found");
    if (player.seat !== game.dealerSeat)
      throw new Error("Only the dealer chooses trump");

    await ctx.db.patch(gameId, {
      trumpSuit: suit,
      phase: "bidding",
      currentTurn: (game.dealerSeat + 1) % game.numPlayers,
    });
  },
});

export const placeBid = mutation({
  args: {
    gameId: v.id("bidGames"),
    sessionId: v.string(),
    bid: v.number(),
  },
  handler: async (ctx, { gameId, sessionId, bid }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    if (game.phase !== "bidding") throw new Error("Not in bidding phase");
    if (!Number.isInteger(bid) || bid < 0 || bid > game.roundNumber)
      throw new Error(`Bid must be between 0 and ${game.roundNumber}`);

    const room = await ctx.db.get(game.roomId);
    if (!room) throw new Error("Room not found");
    const player = room.players.find((p) => p.sessionId === sessionId);
    if (!player) throw new Error("Player not found");

    const newBids = [...game.bids];

    if (game.gameType === "wizard") {
      // Sequential, public bidding starting left of the dealer
      if (player.seat !== game.currentTurn) throw new Error("Not your turn to bid");
      newBids[player.seat] = bid;
      const allBid = newBids.every((b) => b !== null);
      await ctx.db.patch(gameId, {
        bids: newBids,
        phase: allBid ? "playing" : "bidding",
        currentTurn: allBid
          ? game.leadSeat
          : (game.currentTurn + 1) % game.numPlayers,
      });
    } else {
      // Skull King: simultaneous hidden bids
      if (game.bids[player.seat] !== null) throw new Error("You already bid");
      newBids[player.seat] = bid;
      const allBid = newBids.every((b) => b !== null);
      await ctx.db.patch(gameId, {
        bids: newBids,
        phase: allBid ? "playing" : "bidding",
        currentTurn: game.leadSeat,
      });
    }
  },
});

export const playBidCard = mutation({
  args: {
    gameId: v.id("bidGames"),
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
    const error = validateBidPlay(game.gameType, card, hand, game.currentTrick);
    if (error) throw new Error(error);

    const newHands = game.hands.map((h) => [...h]);
    const idx = newHands[player.seat].indexOf(card);
    newHands[player.seat].splice(idx, 1);

    const newTrick = [...game.currentTrick, { seat: player.seat, cards: [card] }];

    if (newTrick.length < game.numPlayers) {
      // Advance to next seat that is still in the room's seat ring
      await ctx.db.patch(gameId, {
        hands: newHands,
        currentTrick: newTrick,
        currentTurn: (player.seat + 1) % game.numPlayers,
      });
      return;
    }

    // Trick complete
    const winnerSeat = determineBidTrickWinner(
      game.gameType,
      newTrick,
      game.trumpSuit
    );
    const newTricksWon = [...game.tricksWon];
    newTricksWon[winnerSeat] += 1;

    const newBonuses = [...game.bonuses];
    if (game.gameType === "skullking") {
      newBonuses[winnerSeat] += skullKingTrickBonus(newTrick, winnerSeat);
    }

    const newTricks = [...game.tricks, { plays: newTrick, winner: winnerSeat }];
    const roundOver = newHands.every((h) => h.length === 0);

    await ctx.db.patch(gameId, {
      hands: newHands,
      currentTrick: [],
      tricks: newTricks,
      tricksWon: newTricksWon,
      bonuses: newBonuses,
      leadSeat: winnerSeat,
      currentTurn: winnerSeat,
      phase: roundOver ? "scoring" : "playing",
    });

    if (roundOver) {
      await recordRoundScores(ctx, game.roomId, gameId, {
        gameType: game.gameType,
        roundNumber: game.roundNumber,
        numPlayers: game.numPlayers,
        bids: game.bids,
        tricksWon: newTricksWon,
        bonuses: newBonuses,
      });
    }
  },
});

async function recordRoundScores(
  ctx: MutationCtx,
  roomId: Id<"rooms">,
  gameId: Id<"bidGames">,
  round: {
    gameType: BidGameType;
    roundNumber: number;
    numPlayers: number;
    bids: (number | null)[];
    tricksWon: number[];
    bonuses: number[];
  }
) {
  const room = await ctx.db.get(roomId);
  if (!room) return;

  const bids = round.bids.map((b) => b ?? 0);
  const scores =
    round.gameType === "wizard"
      ? scoreWizardRound(bids, round.tricksWon)
      : scoreSkullKingRound(bids, round.tricksWon, round.bonuses, round.roundNumber);

  const prev = room.bidScores ?? [];
  const prevTotals =
    prev.length > 0
      ? prev[prev.length - 1].totals
      : Array.from({ length: round.numPlayers }, () => 0);
  const totals = scores.map((s, i) => (prevTotals[i] ?? 0) + s);

  await ctx.db.patch(roomId, {
    bidScores: [
      ...prev,
      { roundNumber: round.roundNumber, bids, tricks: round.tricksWon, scores, totals },
    ],
  });
}

export const nextBidRound = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found");
    if (!room.bidGameId) throw new Error("No current game");

    const game = await ctx.db.get(room.bidGameId);
    if (!game) throw new Error("Game not found");
    if (game.phase !== "scoring") throw new Error("Round not over");

    if (game.roundNumber >= game.totalRounds) {
      await ctx.db.patch(game._id, { phase: "finished" });
      return;
    }

    const nextRound = game.roundNumber + 1;
    const newGameId = await ctx.db.insert("bidGames", {
      roomId,
      ...dealRound(
        game.gameType,
        game.numPlayers,
        nextRound,
        game.totalRounds,
        (game.dealerSeat + 1) % game.numPlayers
      ),
    });

    await ctx.db.patch(roomId, { bidGameId: newGameId });
    return newGameId;
  },
});

export const restartBidGame = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found");
    if (!room.bidGameId) throw new Error("No current game");

    const game = await ctx.db.get(room.bidGameId);
    if (!game) throw new Error("Game not found");
    if (game.phase !== "finished") throw new Error("Game not finished");

    const newGameId = await ctx.db.insert("bidGames", {
      roomId,
      ...dealRound(game.gameType, game.numPlayers, 1, game.totalRounds, 0),
    });

    await ctx.db.patch(roomId, { bidGameId: newGameId, bidScores: [] });
    return newGameId;
  },
});
