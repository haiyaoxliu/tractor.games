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
    gameId: v.optional(v.id("games")),
    teamRanks: v.optional(v.array(v.number())), // [team0&2 rank index, team1&3 rank index] into RANKS
    defendingTeamIndex: v.optional(v.number()), // 0 or 1 — which team is defending
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
});
