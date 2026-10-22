"use client";

// Every visual piece of the app in its states, rendered from fixtures by the
// real components. Shown inside an iframe by the playground shell so media
// queries see a real phone or desktop width.

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useEffect, useState, type ReactNode } from "react";
import Home from "@/app/page";
import Card from "@/components/Card";
import PlayerHand from "@/components/PlayerHand";
import TrickArea from "@/components/TrickArea";
import OtherPlayerHand from "@/components/OtherPlayerHand";
import GameStatus from "@/components/GameStatus";
import ScoreBoard from "@/components/ScoreBoard";
import TrumpDeclaration from "@/components/TrumpDeclaration";
import BidScoreSheet from "@/components/BidScoreSheet";
import HeartsScoreSheet from "@/components/HeartsScoreSheet";
import HeartsScoringBreakdown from "@/components/HeartsScoringBreakdown";
import RoomLobby from "@/components/RoomLobby";
import GameBoard from "@/components/GameBoard";
import HeartsGameBoard from "@/components/HeartsGameBoard";
import BidGameBoard from "@/components/BidGameBoard";
import { sortHeartsHand } from "@/convex/heartsGameLogic";
import { sortBidHand } from "@/convex/bidGameLogic";
import * as fx from "./fixtures";
import { type SectionId } from "./sections";
import styles from "./playground.module.css";

const noop = () => {};

// Buttons in the boards call Convex mutations; point them at an address that
// can never be a real deployment so nothing in the gallery reaches a backend.
function useStubConvex() {
  const [client] = useState(
    () => new ConvexReactClient("http://127.0.0.1:9", { skipConvexDeploymentUrlCheck: true })
  );
  return client;
}


function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  );
}

function Variant({ label, children, bare }: { label: string; children: ReactNode; bare?: boolean }) {
  return (
    <div className={styles.variant}>
      <div className={styles.variantLabel}>{label}</div>
      <div className={bare ? undefined : styles.variantBody}>{children}</div>
    </div>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}

const CARD_SECTION = (
  <>
    {fx.SUITS.map((suit) => (
      <Variant key={suit} label={`Standard · ${suit}`}>
        {fx.RANKS.map((r) => <Card key={r} card={`${r}${suit}`} />)}
      </Variant>
    ))}
    <Variant label="Tractor jokers · Wizard specials">
      {[...fx.TRACTOR_JOKERS, ...fx.WIZARD_SPECIALS].map((c) => <Card key={c} card={c} />)}
    </Variant>
    {fx.SK_SUITS.map((suit) => (
      <Variant key={suit} label={`Skull King · ${suit}`}>
        {fx.skSuited(suit).map((c) => <Card key={c} card={c} />)}
      </Variant>
    ))}
    <Variant label="Skull King specials">
      {fx.SK_SPECIALS.map((c) => <Card key={c} card={c} />)}
    </Variant>
    <Variant label="States: static · clickable (playable) · selected · face down">
      <Card card="AS" />
      <Card card="AS" onClick={noop} />
      <Card card="AS" onClick={noop} selected />
      <Card card="AS" faceDown />
      <Card card="??" />
    </Variant>
    <Variant label="Small (trick area, flipped trump)">
      {["AS", "TH", "QD", "3C", "JK", "WZ1", "SK", "14B"].map((c) => <Card key={c} card={c} small />)}
      <Card card="AS" small faceDown />
    </Variant>
  </>
);

export default function Gallery({ only }: { only?: string }) {
  const convex = useStubConvex();
  const show = (id: SectionId) => !only || only === id;

  // The lobby's name field autofocuses (the browser does it whenever the
  // page settles), which would scroll the gallery down to it. Undo that until
  // the viewer first interacts, so the gallery starts at the top.
  useEffect(() => {
    const reset = () => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      window.scrollTo(0, 0);
    };
    const stop = () => {
      document.removeEventListener("focusin", reset);
      document.removeEventListener("pointerdown", stop, true);
      document.removeEventListener("keydown", stop, true);
    };
    reset();
    document.addEventListener("focusin", reset);
    document.addEventListener("pointerdown", stop, true);
    document.addEventListener("keydown", stop, true);
    return stop;
  }, []);
  const p4 = fx.players(4);

  return (
    <ConvexProvider client={convex}>
      <div className={styles.gallery}>
        {show("cards") && <Section id="cards" title="Cards">{CARD_SECTION}</Section>}

        {show("hand") && (
          <Section id="hand" title="Hand">
            <Variant label="Tractor · your turn (click cards to select)">
              <PlayerHand cards={fx.tractor["Playing — your turn"].hands[0]} trumpSuit="H" trumpRank="2" canPlay onPlay={noop} />
            </Variant>
            <Variant label="Tractor · kitty discard">
              <PlayerHand cards={fx.tractor["Kitty discard"].hands[0]} trumpSuit="H" trumpRank="2" canPlay={false} isKittyPhase onDiscardKitty={noop} />
            </Variant>
            <Variant label="Gong Zhu · not your turn">
              <PlayerHand cards={fx.hearts["Playing — your turn"].hands[0]} canPlay={false} sortFn={sortHeartsHand} singleCardOnly />
            </Variant>
            <Variant label="Skull King · single card">
              <PlayerHand cards={fx.skullking["Playing — your turn"].hands[0]} canPlay onPlay={noop} singleCardOnly sortFn={(c) => sortBidHand("skullking", c)} />
            </Variant>
          </Section>
        )}

        {show("trick") && (
          <Section id="trick" title="Trick area">
            <Variant label="Empty">
              <TrickArea currentTrick={[]} players={p4} mySeat={0} />
            </Variant>
            <Variant label="Tractor · pairs, three played">
              <TrickArea currentTrick={fx.tractor["Playing — your turn"].currentTrick} players={p4} mySeat={0} />
            </Variant>
            <Variant label="Full trick, single cards">
              <TrickArea
                currentTrick={[
                  { seat: 0, cards: ["QS"] },
                  { seat: 1, cards: ["KS"] },
                  { seat: 2, cards: ["2S"] },
                  { seat: 3, cards: ["AH"] },
                ]}
                players={p4}
                mySeat={0}
              />
            </Variant>
            <Variant label="Tractor · four-card tractor lead">
              <TrickArea currentTrick={[{ seat: 1, cards: ["9D", "9D", "TD", "TD"] }]} players={p4} mySeat={0} />
            </Variant>
          </Section>
        )}

        {show("seats") && (
          <Section id="seats" title="Other players">
            <Row>
              <OtherPlayerHand name="Mei" cardCount={23} isCurrentTurn={false} seat={1} isTeammate={false} />
              <OtherPlayerHand name="Arjun" cardCount={23} isCurrentTurn={false} seat={2} isTeammate />
              <OtherPlayerHand name="Sofia" cardCount={1} isCurrentTurn seat={3} isTeammate={false} />
              <OtherPlayerHand name="Kenji" cardCount={12} isCurrentTurn={false} seat={1} showTeamLabel={false} />
            </Row>
          </Section>
        )}

        {show("widgets") && (
          <Section id="widgets" title="Score & bid widgets">
            {(["declaring", "playing", "scoring"] as const).map((phase) => (
              <Variant key={phase} label={`Tractor · GameStatus + ScoreBoard · ${phase}`}>
                <GameStatus phase={phase} trumpSuit={phase === "declaring" ? undefined : "H"} currentTurn={phase === "playing" ? 0 : undefined} mySeat={0} players={p4} attackerPoints={phase === "scoring" ? 95 : 35} defendingTeam={phase === "declaring" ? undefined : [0, 2]} />
                <div style={{ height: 8 }} />
                <ScoreBoard attackerPoints={phase === "scoring" ? 95 : 35} trickCount={phase === "declaring" ? 0 : 12} phase={phase} declarerSeat={phase === "declaring" ? undefined : 0} defendingTeam={phase === "declaring" ? undefined : [0, 2]} mySeat={0} players={p4} teamRanks={[3, 1]} defendingTeamIndex={0} />
              </Variant>
            ))}
            <Variant label="Tractor · trump declaration">
              <TrumpDeclaration hand={fx.tractor["Playing — your turn"].hands[0]} onDeclare={noop} onFinalize={noop} trumpRank="2" declarations={[{ seat: 3, suit: "S", strength: 1 }]} players={p4} dealComplete />
            </Variant>
            <Variant label="Gong Zhu · score sheet">
              <HeartsScoreSheet heartsScores={[...fx.hearts["Round over"].heartsScores, { roundNumber: 2, scores: [-120, 0, 200, 0] }]} players={p4} currentRound={3} />
            </Variant>
            <Variant label="Gong Zhu · scoring breakdown">
              <HeartsScoringBreakdown capturedCards={fx.hearts["Round over"].capturedCards} players={p4} />
            </Variant>
            <Variant label="Wizard / Skull King · bid score sheet (open)">
              <BidScoreSheet bidScores={fx.wizard["Round over"].bidScores} players={p4} defaultOpen />
            </Variant>
          </Section>
        )}

        {show("buttons") && (
          <Section id="buttons" title="Buttons & panels">
            <Row>
              <button className="btn">Button</button>
              <button className="btn btnPrimary">Primary</button>
              <button className="btn btnSmall">Small</button>
              <button className="btn btnPrimary btnSmall">Small primary</button>
              <button className="btn" disabled>Disabled</button>
              <button className="btn btnPrimary" disabled>Primary disabled</button>
            </Row>
            <div className="panel" style={{ padding: "1rem", marginTop: 12 }}>.panel</div>
          </Section>
        )}

        {show("lobby") && (
          <Section id="lobby" title="Lobby (home page)">
            <div className={styles.page}>
              <Home />
            </div>
          </Section>
        )}

        {show("room") && (
          <Section id="room" title="Room (waiting for players)">
            {(
              [
                ["Tractor · host, can start", "tractor", 4, fx.SESSION_ID],
                ["Gong Zhu · host, waiting for players", "hearts", 2, fx.SESSION_ID],
                ["Wizard · guest", "wizard", 3, "playground-guest"],
                ["Skull King · host, 5 of 6", "skullking", 5, fx.SESSION_ID],
              ] as const
            ).map(([label, type, n, session]) => (
              <Variant key={label} label={label} bare>
                {/* same wrapper as app/room/[roomId]/page.tsx */}
                <main style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
                  <RoomLobby roomCode="KXQZ" players={fx.players(n)} onStart={noop} canStart={n >= (type === "tractor" || type === "hearts" ? 4 : 3)} sessionId={session} gameType={type} />
                </main>
              </Variant>
            ))}
          </Section>
        )}

        {show("tractor") && (
          <Section id="tractor" title="Tractor board">
            {Object.entries(fx.tractor).map(([label, game]) => (
              <Variant key={label} label={label} bare>
                <main style={{ padding: "1rem" }}>
                  <GameBoard game={game} sessionId={fx.SESSION_ID} />
                </main>
              </Variant>
            ))}
          </Section>
        )}

        {show("hearts") && (
          <Section id="hearts" title="Gong Zhu board">
            {Object.entries(fx.hearts).map(([label, game]) => (
              <Variant key={label} label={label} bare>
                <main style={{ padding: "1rem" }}>
                  <HeartsGameBoard game={game} sessionId={fx.SESSION_ID} />
                </main>
              </Variant>
            ))}
          </Section>
        )}

        {(["wizard", "skullking"] as const).map((type) =>
          show(type) ? (
            <Section key={type} id={type} title={type === "wizard" ? "Wizard board" : "Skull King board"}>
              {Object.entries(fx[type]).map(([label, game]) => (
                <Variant key={label} label={label} bare>
                  <main style={{ padding: "1rem" }}>
                    <BidGameBoard game={game} sessionId={fx.SESSION_ID} />
                  </main>
                </Variant>
              ))}
            </Section>
          ) : null
        )}
      </div>
    </ConvexProvider>
  );
}
