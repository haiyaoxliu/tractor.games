import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  rooms: defineTable({
    roomCode: v.string(),
    players: v.array(
      v.object({
        name: v.string(),
        sessionId: v.string(),
        seat: v.number(),
      })
    ),
    status: v.union(
      v.literal("waiting"),
      v.literal("playing"),
      v.literal("finished")
    ),
    gameType: v.optional(
      v.union(
        v.literal("tractor"),
        v.literal("hearts"),
        v.literal("wizard"),
        v.literal("skullking")
      )
    ),
    gameId: v.optional(v.id("games")),
    teamRanks: v.optional(v.array(v.number())), // [team0&2 rank index, team1&3 rank index] into RANKS
    defendingTeamIndex: v.optional(v.number()), // 0 or 1 — which team is defending
    kittySeat: v.optional(v.number()), // seat holding the kitty (庄家); unset until round 1's trump is final
    heartsGameId: v.optional(v.id("heartsGames")),
    heartsScores: v.optional(v.array(v.object({
      roundNumber: v.number(),
      scores: v.array(v.number()),
    }))),
    bidGameId: v.optional(v.id("bidGames")),
    bidScores: v.optional(v.array(v.object({
      roundNumber: v.number(),
      bids: v.array(v.number()),
      tricks: v.array(v.number()),
      scores: v.array(v.number()), // round deltas
      totals: v.array(v.number()), // running totals after this round
    }))),
  }).index("by_roomCode", ["roomCode"]),

  games: defineTable({
    roomId: v.id("rooms"),
    phase: v.union(
      v.literal("dealing"),
      v.literal("declaring"),
      v.literal("kitty"),
      v.literal("playing"),
      v.literal("scoring")
    ),
    trumpSuit: v.optional(v.string()),
    trumpRank: v.string(),
    declarerSeat: v.optional(v.number()),
    defendingTeam: v.optional(v.array(v.number())), // seats of defending team
    hands: v.array(v.array(v.string())), // hands[seatIndex] = card[]
    kitty: v.array(v.string()),
    kittyDiscards: v.array(v.string()),
    currentTrick: v.array(
      v.object({
        seat: v.number(),
        cards: v.array(v.string()),
      })
    ),
    leadSeat: v.optional(v.number()),
    currentTurn: v.optional(v.number()),
    tricks: v.array(
      v.object({
        plays: v.array(
          v.object({
            seat: v.number(),
            cards: v.array(v.string()),
          })
        ),
        winner: v.number(),
      })
    ),
    attackerPoints: v.number(),
    dealComplete: v.boolean(),
    declarations: v.optional(
      v.array(
        v.object({
          seat: v.number(),
          suit: v.optional(v.string()),
          strength: v.number(), // 1=single, 2=pair, 3=small joker pair, 4=big joker pair
        })
      )
    ),
    noTrumpSuit: v.optional(v.boolean()),
    revealedCounts: v.optional(v.array(v.number())),
  }),

  heartsGames: defineTable({
    roomId: v.id("rooms"),
    phase: v.union(v.literal("playing"), v.literal("scoring")),
    hands: v.array(v.array(v.string())), // hands[seatIndex] = card[]
    currentTrick: v.array(
      v.object({
        seat: v.number(),
        cards: v.array(v.string()),
      })
    ),
    leadSeat: v.number(),
    currentTurn: v.number(),
    tricks: v.array(
      v.object({
        plays: v.array(
          v.object({
            seat: v.number(),
            cards: v.array(v.string()),
          })
        ),
        winner: v.number(),
      })
    ),
    capturedCards: v.array(v.array(v.string())), // capturedCards[seatIndex] = all won cards
    roundNumber: v.number(),
  }),

  // Shared table for bid-then-play trick games (Wizard, Skull King)
  bidGames: defineTable({
    roomId: v.id("rooms"),
    gameType: v.union(v.literal("wizard"), v.literal("skullking")),
    phase: v.union(
      v.literal("choosingTrump"), // wizard only: dealer picks trump after a wizard is flipped
      v.literal("bidding"),
      v.literal("playing"),
      v.literal("scoring"), // round over, showing results
      v.literal("finished") // all rounds played
    ),
    roundNumber: v.number(),
    totalRounds: v.number(),
    numPlayers: v.number(),
    dealerSeat: v.number(),
    hands: v.array(v.array(v.string())), // hands[seatIndex] = card[]
    bids: v.array(v.union(v.number(), v.null())), // null = not yet bid
    tricksWon: v.array(v.number()),
    bonuses: v.array(v.number()), // skull king bonus points accrued this round
    currentTrick: v.array(
      v.object({
        seat: v.number(),
        cards: v.array(v.string()),
      })
    ),
    leadSeat: v.number(),
    currentTurn: v.number(), // whose turn to bid (wizard) or play
    tricks: v.array(
      v.object({
        plays: v.array(
          v.object({
            seat: v.number(),
            cards: v.array(v.string()),
          })
        ),
        winner: v.number(),
      })
    ),
    trumpCard: v.optional(v.string()), // wizard: the flipped card
    trumpSuit: v.optional(v.string()), // wizard: "S"|"H"|"D"|"C"|"none"; skullking: "B"
  }),
});
