"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSessionId } from "@/lib/cardUtils";
import { GAME_META, resolveGameType } from "@/lib/gameMeta";
import RoomLobby from "@/components/RoomLobby";
import GameBoard from "@/components/GameBoard";
import HeartsGameBoard from "@/components/HeartsGameBoard";
import BidGameBoard from "@/components/BidGameBoard";

function CenteredNotice({ title, body }: { title: string; body: string }) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div className="panel" style={{ padding: "2rem", textAlign: "center" }}>
        <h2>{title}</h2>
        <p style={{ color: "var(--ink-soft)", margin: "1rem 0" }}>{body}</p>
        <Link href="/" style={{ color: "var(--accent)", fontWeight: 600 }}>
          Back to Home
        </Link>
      </div>
    </main>
  );
}

export default function RoomPage() {
  const params = useParams();
  const roomCode = (params.roomId as string).toUpperCase();

  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    // sessionStorage is unavailable during SSR, so the session id can only be
    // read after hydration
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessionId(getSessionId());
  }, []);

  const room = useQuery(api.rooms.getRoomByCode, { roomCode });
  const startGame = useMutation(api.game.startGame);
  const startHeartsGame = useMutation(api.heartsGame.startHeartsGame);
  const startBidGame = useMutation(api.bidGame.startBidGame);

  const gameType = resolveGameType(room?.gameType);
  const isHearts = gameType === "hearts";
  const isTractor = gameType === "tractor";
  const isBidGame = gameType === "wizard" || gameType === "skullking";

  // Get tractor game state if applicable
  const tractorGameId = room?.gameId;
  const tractorState = useQuery(
    api.gameQueries.getGameState,
    isTractor && tractorGameId && sessionId ? { gameId: tractorGameId, sessionId } : "skip"
  );

  // Get hearts game state if applicable
  const heartsGameId = room?.heartsGameId;
  const heartsState = useQuery(
    api.heartsGameQueries.getHeartsGameState,
    isHearts && heartsGameId && sessionId ? { gameId: heartsGameId, sessionId } : "skip"
  );

  // Get bid game (wizard / skull king) state if applicable
  const bidGameId = room?.bidGameId;
  const bidState = useQuery(
    api.bidGameQueries.getBidGameState,
    isBidGame && bidGameId && sessionId ? { gameId: bidGameId, sessionId } : "skip"
  );

  if (!sessionId || room === undefined) {
    return (
      <main style={{ padding: "3rem", textAlign: "center", color: "var(--ink-soft)" }}>
        <p>Loading…</p>
      </main>
    );
  }

  if (room === null) {
    return (
      <CenteredNotice
        title="Room Not Found"
        body={`Room code "${roomCode}" does not exist.`}
      />
    );
  }

  // Check if player is in the room
  const isInRoom = room.players.some((p) => p.sessionId === sessionId);
  if (!isInRoom) {
    return (
      <CenteredNotice title="Not in Room" body="You haven't joined this room yet." />
    );
  }

  // Lobby view
  if (room.status === "waiting") {
    const limits = GAME_META[gameType];
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <RoomLobby
          roomCode={room.roomCode}
          players={room.players}
          canStart={
            room.players.length >= limits.min && room.players.length <= limits.max
          }
          sessionId={sessionId}
          gameType={gameType}
          onStart={async () => {
            try {
              if (isHearts) {
                await startHeartsGame({ roomId: room._id });
              } else if (isBidGame) {
                await startBidGame({ roomId: room._id });
              } else {
                await startGame({ roomId: room._id });
              }
            } catch (e) {
              alert(e instanceof Error ? e.message : "Failed to start");
            }
          }}
        />
      </main>
    );
  }

  // Game views
  if (isBidGame && bidState) {
    return (
      <main style={{ minHeight: "100vh", padding: "1rem" }}>
        <BidGameBoard game={bidState} sessionId={sessionId} />
      </main>
    );
  }

  if (isHearts && heartsState) {
    return (
      <main style={{ minHeight: "100vh", padding: "1rem" }}>
        <HeartsGameBoard game={heartsState} sessionId={sessionId} />
      </main>
    );
  }

  if (isTractor && tractorState) {
    return (
      <main style={{ minHeight: "100vh", padding: "1rem" }}>
        <GameBoard game={tractorState} sessionId={sessionId} />
      </main>
    );
  }

  return (
    <main style={{ padding: "3rem", textAlign: "center", color: "var(--ink-soft)" }}>
      <p>Loading game…</p>
    </main>
  );
}
