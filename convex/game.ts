import { mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  createDoubleDeck,
  shuffle,
  deal,
  validatePlay,
  determineTrickWinner,
  totalPoints,
  kittyBonus,
  getPlayType,
  calculateRankChange,
  PROGRESSION_RANKS,
} from "./gameLogic";

const SUITS = ["S", "H", "D", "C"];

/** Get the trump rank string from a room's team ranks and defending team index */
function getTrumpRankFromRoom(teamRanks?: number[], defendingTeamIndex?: number): string {
  if (!teamRanks || defendingTeamIndex === undefined) return "2";
  const rankIdx = teamRanks[defendingTeamIndex];
  return PROGRESSION_RANKS[rankIdx] ?? "2";
}

export const createTestGame = mutation({
  args: {},
  handler: async (ctx) => {
    const sessionIds = ["test-0", "test-1", "test-2", "test-3"];
    const players = sessionIds.map((sid, i) => ({
      name: `P${i}`,
      sessionId: sid,
      seat: i,
    }));

    const roomCode = "TEST" + Math.random().toString(36).slice(2, 6).toUpperCase();
    const teamRanks = [0, 0]; // both teams start at "2"
    const defendingTeamIndex = 0;
    const trumpRank = getTrumpRankFromRoom(teamRanks, defendingTeamIndex);

    const roomId = await ctx.db.insert("rooms", {
      roomCode,
      players,
      status: "playing",
      teamRanks,
      defendingTeamIndex,
    });

    const deck = shuffle(createDoubleDeck());
    const { hands, kitty } = deal(deck);

    const gameId = await ctx.db.insert("games", {
      roomId,
      phase: "declaring",
      trumpRank,
      hands,
      kitty,
      kittyDiscards: [],
      currentTrick: [],
      tricks: [],
      attackerPoints: 0,
      dealComplete: false,
      declarations: [],
      noTrumpSuit: false,
      revealedCounts: [0, 0, 0, 0],
    });

    await ctx.db.patch(roomId, { gameId });

    return { gameId, roomId, sessionIds };
  },
});

export const startGame = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found");
    if (room.players.length !== 4) throw new Error("Need exactly 4 players");
    if (room.status !== "waiting") throw new Error("Game already started");

    // Initialize team ranks if not set
    const teamRanks = room.teamRanks ?? [0, 0];
    const defendingTeamIndex = room.defendingTeamIndex ?? 0;
    const trumpRank = getTrumpRankFromRoom(teamRanks, defendingTeamIndex);

    const deck = shuffle(createDoubleDeck());
    const { hands, kitty } = deal(deck);

    const gameId = await ctx.db.insert("games", {
      roomId,
      phase: "declaring",
      trumpRank,
      hands,
      kitty,
      kittyDiscards: [],
      currentTrick: [],
      tricks: [],
      attackerPoints: 0,
      dealComplete: false,
      declarations: [],
      noTrumpSuit: false,
      revealedCounts: [0, 0, 0, 0],
    });

    await ctx.db.patch(roomId, {
      status: "playing",
      gameId,
      teamRanks,
      defendingTeamIndex,
    });

    return gameId;
  },
});

export const revealCard = mutation({
  args: {
    gameId: v.id("games"),
    sessionId: v.string(),
    revealAll: v.optional(v.boolean()),
  },
  handler: async (ctx, { gameId, sessionId, revealAll }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    if (game.phase !== "declaring") throw new Error("Not in declaration phase");

    const room = await ctx.db.get(game.roomId);
    if (!room) throw new Error("Room not found");

    const player = room.players.find((p) => p.sessionId === sessionId);
    if (!player) throw new Error("Player not found");

    const seat = player.seat;
    const handSize = game.hands[seat].length;
    const counts = game.revealedCounts ? [...game.revealedCounts] : [0, 0, 0, 0];

    if (counts[seat] >= handSize) throw new Error("All cards already revealed");

    if (revealAll) {
      counts[seat] = handSize;
    } else {
      counts[seat] = Math.min(counts[seat] + 1, handSize);
    }

    const allRevealed = counts.every((c, i) => c >= game.hands[i].length);

    await ctx.db.patch(gameId, {
      revealedCounts: counts,
      dealComplete: allRevealed,
    });
  },
});

export const declareTrump = mutation({
  args: {
    gameId: v.id("games"),
    sessionId: v.string(),
    suit: v.optional(v.string()),
    type: v.union(
      v.literal("single"),
      v.literal("pair"),
      v.literal("smallJokerPair"),
      v.literal("bigJokerPair")
    ),
  },
  handler: async (ctx, { gameId, sessionId, suit, type }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    if (game.phase !== "declaring") throw new Error("Not in declaration phase");

    const room = await ctx.db.get(game.roomId);
    if (!room) throw new Error("Room not found");

    const player = room.players.find((p) => p.sessionId === sessionId);
    if (!player) throw new Error("Player not found");

    const fullHand = game.hands[player.seat];
    const revealedCount = game.revealedCounts ? game.revealedCounts[player.seat] : fullHand.length;
    const hand = fullHand.slice(0, revealedCount);
    const declarations = game.declarations ?? [];

    // Determine strength
    let strength: number;
    if (type === "single") {
      strength = 1;
      if (!suit || !SUITS.includes(suit)) throw new Error("Invalid suit");
      const count = hand.filter((c) => c === `${game.trumpRank}${suit}`).length;
      if (count < 1) throw new Error("Need at least one trump rank card in that suit");
    } else if (type === "pair") {
      strength = 2;
      if (!suit || !SUITS.includes(suit)) throw new Error("Invalid suit");
      const count = hand.filter((c) => c === `${game.trumpRank}${suit}`).length;
      if (count < 2) throw new Error("Need a pair of trump rank cards in that suit");
    } else if (type === "smallJokerPair") {
      strength = 3;
      const jokerCount = hand.filter((c) => c === "jk").length;
      if (jokerCount < 2) throw new Error("Need a pair of small jokers");
    } else if (type === "bigJokerPair") {
      strength = 4;
      const jokerCount = hand.filter((c) => c === "JK").length;
      if (jokerCount < 2) throw new Error("Need a pair of big jokers");
    } else {
      throw new Error("Invalid declaration type");
    }

    // Check if this overrides current declaration
    const currentDeclaration = declarations.length > 0 ? declarations[declarations.length - 1] : null;
    if (currentDeclaration && strength <= currentDeclaration.strength) {
      throw new Error("Declaration must be stronger than current declaration to override");
    }

    const newDeclaration = { seat: player.seat, suit, strength };
    const newDeclarations = [...declarations, newDeclaration];

    const isJokerDeclaration = type === "smallJokerPair" || type === "bigJokerPair";

    // Declarer's team defends
    const declarerSeat = player.seat;
    const partnerSeat = (declarerSeat + 2) % 4;
    const defendingTeam = [declarerSeat, partnerSeat];

    // Give kitty to declarer
    const newHands = game.hands.map((h) => [...h]);
    // If someone previously had the kitty, remove it first
    if (game.declarerSeat !== undefined && game.declarerSeat !== declarerSeat) {
      // Previous declarer needs kitty removed (they had it added)
      // Actually, kitty is only added when transitioning to kitty phase
      // During declaring phase, kitty stays separate
    }

    // Don't give kitty yet — wait until we transition to kitty phase
    // But do set the trump suit and declarer info
    await ctx.db.patch(gameId, {
      trumpSuit: isJokerDeclaration ? undefined : suit,
      declarerSeat,
      defendingTeam,
      declarations: newDeclarations,
      noTrumpSuit: isJokerDeclaration,
    });
  },
});

export const finalizeTrump = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    if (game.phase !== "declaring") throw new Error("Not in declaration phase");
    if (!game.dealComplete) throw new Error("All players must reveal all cards first");

    const room = await ctx.db.get(game.roomId);
    if (!room) throw new Error("Room not found");

    const declarations = game.declarations ?? [];

    if (declarations.length === 0) {
      // No one declared — fallback to no trump suit
      // Defending team's first seat gets the kitty
      const defendingTeamIndex = room.defendingTeamIndex ?? 0;
      const declarerSeat = defendingTeamIndex === 0 ? 0 : 1;
      const partnerSeat = (declarerSeat + 2) % 4;
      const defendingTeam = [declarerSeat, partnerSeat];

      const newHands = game.hands.map((h) => [...h]);
      newHands[declarerSeat] = [...newHands[declarerSeat], ...game.kitty];

      await ctx.db.patch(gameId, {
        phase: "kitty",
        hands: newHands,
        declarerSeat,
        defendingTeam,
        noTrumpSuit: true,
      });
    } else {
      const declarerSeat = game.declarerSeat!;

      // Give kitty to declarer
      const newHands = game.hands.map((h) => [...h]);
      newHands[declarerSeat] = [...newHands[declarerSeat], ...game.kitty];

      await ctx.db.patch(gameId, {
        phase: "kitty",
        hands: newHands,
      });
    }
  },
});


export const discardKitty = mutation({
  args: {
    gameId: v.id("games"),
    sessionId: v.string(),
    discards: v.array(v.string()),
  },
  handler: async (ctx, { gameId, sessionId, discards }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    if (game.phase !== "kitty") throw new Error("Not in kitty phase");

    const room = await ctx.db.get(game.roomId);
    if (!room) throw new Error("Room not found");

    const player = room.players.find((p) => p.sessionId === sessionId);
    if (!player) throw new Error("Player not found");
    if (player.seat !== game.declarerSeat) throw new Error("Only declarer can discard kitty");

    if (discards.length !== 8) throw new Error("Must discard exactly 8 cards");

    const hand = [...game.hands[player.seat]];
    // Verify all discards are in hand
    for (const card of discards) {
      const idx = hand.indexOf(card);
      if (idx === -1) throw new Error(`Card ${card} not in hand`);
      hand.splice(idx, 1);
    }

    if (hand.length !== 25) throw new Error("Hand should have 25 cards after discard");

    const newHands = game.hands.map((h) => [...h]);
    newHands[player.seat] = hand;

    // Declarer leads first trick
    await ctx.db.patch(gameId, {
      phase: "playing",
      kittyDiscards: discards,
      hands: newHands,
      leadSeat: game.declarerSeat,
      currentTurn: game.declarerSeat,
    });
  },
});

export const playCards = mutation({
  args: {
    gameId: v.id("games"),
    sessionId: v.string(),
    cards: v.array(v.string()),
  },
  handler: async (ctx, { gameId, sessionId, cards }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    if (game.phase !== "playing") throw new Error("Not in playing phase");

    const room = await ctx.db.get(game.roomId);
    if (!room) throw new Error("Room not found");

    const player = room.players.find((p) => p.sessionId === sessionId);
    if (!player) throw new Error("Player not found");
    if (player.seat !== game.currentTurn) throw new Error("Not your turn");

    const hand = game.hands[player.seat];
    const leadPlay = game.currentTrick.length > 0 ? game.currentTrick[0] : null;
    const noTrumpSuit = game.noTrumpSuit ?? false;

    // Validate play type
    if (cards.length < 1) {
      throw new Error("Must play at least 1 card");
    }

    const playType = getPlayType(cards, game.trumpSuit, game.trumpRank, noTrumpSuit);

    if (!leadPlay) {
      // Leading — must be a valid single, pair, or tractor
      if (playType === "invalid") {
        throw new Error("Invalid play: must be a single, pair, or tractor (consecutive pairs)");
      }
    } else {
      const error = validatePlay(cards, hand, leadPlay, game.trumpSuit, game.trumpRank, noTrumpSuit);
      if (error) throw new Error(error);
    }

    // Remove cards from hand
    const newHand = [...hand];
    for (const card of cards) {
      const idx = newHand.indexOf(card);
      if (idx === -1) throw new Error(`Card ${card} not in hand`);
      newHand.splice(idx, 1);
    }

    const newHands = game.hands.map((h) => [...h]);
    newHands[player.seat] = newHand;

    const newTrick = [...game.currentTrick, { seat: player.seat, cards }];

    // If all 4 players have played, resolve trick
    if (newTrick.length === 4) {
      const winnerSeat = determineTrickWinner(
        newTrick,
        game.trumpSuit,
        game.trumpRank,
        noTrumpSuit
      );

      // Calculate points in this trick
      const trickCards = newTrick.flatMap((p) => p.cards);
      const trickPoints = totalPoints(trickCards);

      // Add points if won by attacking team
      const defendingTeam = game.defendingTeam ?? [];
      const isAttackerWin = !defendingTeam.includes(winnerSeat);
      const newAttackerPoints = game.attackerPoints + (isAttackerWin ? trickPoints : 0);

      const newTricks = [
        ...game.tricks,
        { plays: newTrick, winner: winnerSeat },
      ];

      // Check if game is over (all hands empty)
      const allEmpty = newHands.every((h) => h.length === 0);

      if (allEmpty) {
        // Add kitty bonus
        const bonus = kittyBonus(
          game.kittyDiscards,
          winnerSeat,
          game.declarerSeat!
        );
        const finalAttackerPoints = newAttackerPoints + bonus;

        await ctx.db.patch(gameId, {
          hands: newHands,
          currentTrick: [],
          tricks: newTricks,
          attackerPoints: finalAttackerPoints,
          leadSeat: winnerSeat,
          currentTurn: winnerSeat,
          phase: "scoring",
        });
      } else {
        // Next trick — winner leads
        await ctx.db.patch(gameId, {
          hands: newHands,
          currentTrick: [],
          tricks: newTricks,
          attackerPoints: newAttackerPoints,
          leadSeat: winnerSeat,
          currentTurn: winnerSeat,
        });
      }
    } else {
      // Next player's turn
      const nextTurn = (player.seat + 1) % 4;
      await ctx.db.patch(gameId, {
        hands: newHands,
        currentTrick: newTrick,
        currentTurn: nextTurn,
      });
    }
  },
});

export const nextRound = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found");
    if (!room.gameId) throw new Error("No current game");

    const game = await ctx.db.get(room.gameId);
    if (!game) throw new Error("Game not found");
    if (game.phase !== "scoring") throw new Error("Game not in scoring phase");

    const teamRanks = room.teamRanks ?? [0, 0];
    const defendingTeamIndex = room.defendingTeamIndex ?? 0;
    const attackingTeamIndex = defendingTeamIndex === 0 ? 1 : 0;

    const { attackerChange, defenderChange } = calculateRankChange(game.attackerPoints);

    const newTeamRanks = [...teamRanks];
    newTeamRanks[defendingTeamIndex] += defenderChange;
    newTeamRanks[attackingTeamIndex] += attackerChange;

    // Check for match win (past Ace = index 12)
    const maxRankIndex = PROGRESSION_RANKS.length - 1; // 12 = Ace
    if (newTeamRanks[0] > maxRankIndex || newTeamRanks[1] > maxRankIndex) {
      await ctx.db.patch(roomId, {
        status: "finished",
        teamRanks: newTeamRanks,
      });
      return { matchWinner: newTeamRanks[0] > maxRankIndex ? 0 : 1 };
    }

    // Determine who defends next round
    // If defenders advanced (attackers scored < 80): same team keeps defending
    // If neutral or attackers advanced: attacking team becomes new defenders
    let newDefendingTeamIndex: number;
    if (defenderChange > 0) {
      newDefendingTeamIndex = defendingTeamIndex; // defenders keep defending
    } else {
      newDefendingTeamIndex = attackingTeamIndex; // attackers become defenders
    }

    const newTrumpRank = getTrumpRankFromRoom(newTeamRanks, newDefendingTeamIndex);

    // Create new game
    const deck = shuffle(createDoubleDeck());
    const { hands, kitty } = deal(deck);

    const newGameId = await ctx.db.insert("games", {
      roomId,
      phase: "declaring",
      trumpRank: newTrumpRank,
      hands,
      kitty,
      kittyDiscards: [],
      currentTrick: [],
      tricks: [],
      attackerPoints: 0,
      dealComplete: false,
      declarations: [],
      noTrumpSuit: false,
      revealedCounts: [0, 0, 0, 0],
    });

    await ctx.db.patch(roomId, {
      status: "playing",
      gameId: newGameId,
      teamRanks: newTeamRanks,
      defendingTeamIndex: newDefendingTeamIndex,
    });

    return { newGameId, teamRanks: newTeamRanks, matchWinner: null };
  },
});
