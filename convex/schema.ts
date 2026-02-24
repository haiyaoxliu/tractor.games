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
    gameType: v.optional(v.union(v.literal("tractor"), v.literal("hearts"), v.literal("werewolf"))),
    gameId: v.optional(v.id("games")),
    teamRanks: v.optional(v.array(v.number())), // [team0&2 rank index, team1&3 rank index] into RANKS
    defendingTeamIndex: v.optional(v.number()), // 0 or 1 — which team is defending
    heartsGameId: v.optional(v.id("heartsGames")),
    heartsScores: v.optional(v.array(v.object({
      roundNumber: v.number(),
      scores: v.array(v.number()),
    }))),
    werewolfGameId: v.optional(v.id("werewolfGames")),
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

  werewolfGames: defineTable({
    roomId: v.id("rooms"),
    phase: v.union(
      v.literal("night"),
      v.literal("day"),
      v.literal("voting"),
      v.literal("results")
    ),
    selectedRoles: v.array(v.string()),
    originalRoles: v.array(v.string()),
    currentRoles: v.array(v.string()),
    centerCards: v.array(v.string()),
    currentCenterCards: v.array(v.string()),
    nightActionQueue: v.array(v.object({
      seat: v.number(),
      role: v.string(),
      order: v.number(),
    })),
    nightActionIndex: v.number(),
    nightActions: v.array(v.object({
      seat: v.number(),
      role: v.string(),
      action: v.any(),
    })),
    nightInfo: v.array(v.any()),
    votes: v.array(v.object({
      seat: v.number(),
      targetSeat: v.number(),
    })),
    killedSeats: v.array(v.number()),
    winners: v.array(v.string()),
    dayTimeLimit: v.optional(v.number()),
    dayStartTime: v.optional(v.number()),
  }),
});
