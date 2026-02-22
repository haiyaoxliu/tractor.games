import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const createRoom = mutation({
  args: { name: v.string(), sessionId: v.string() },
  handler: async (ctx, { name, sessionId }) => {
    // Generate unique room code
    let roomCode: string;
    let existing;
    do {
      roomCode = generateRoomCode();
      existing = await ctx.db
        .query("rooms")
        .withIndex("by_roomCode", (q) => q.eq("roomCode", roomCode))
        .first();
    } while (existing);

    const roomId = await ctx.db.insert("rooms", {
      roomCode,
      players: [{ name, sessionId, seat: 0 }],
      status: "waiting",
      teamRanks: [0, 0],
      defendingTeamIndex: 0,
    });

    return { roomId, roomCode };
  },
});

export const joinRoom = mutation({
  args: { roomCode: v.string(), name: v.string(), sessionId: v.string() },
  handler: async (ctx, { roomCode, name, sessionId }) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_roomCode", (q) => q.eq("roomCode", roomCode.toUpperCase()))
      .first();

    if (!room) throw new Error("Room not found");
    if (room.status !== "waiting") throw new Error("Game already in progress");

    // Check if player already in room (reconnect)
    const existingPlayer = room.players.find((p) => p.sessionId === sessionId);
    if (existingPlayer) {
      return { roomId: room._id, roomCode: room.roomCode };
    }

    if (room.players.length >= 4) throw new Error("Room is full");

    // Assign next available seat
    const takenSeats = new Set(room.players.map((p) => p.seat));
    let seat = 0;
    while (takenSeats.has(seat)) seat++;

    await ctx.db.patch(room._id, {
      players: [...room.players, { name, sessionId, seat }],
    });

    return { roomId: room._id, roomCode: room.roomCode };
  },
});

export const getRoom = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    return await ctx.db.get(roomId);
  },
});

export const getRoomByCode = query({
  args: { roomCode: v.string() },
  handler: async (ctx, { roomCode }) => {
    return await ctx.db
      .query("rooms")
      .withIndex("by_roomCode", (q) => q.eq("roomCode", roomCode.toUpperCase()))
      .first();
  },
});
