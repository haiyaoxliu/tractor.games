# Roadmap to release-1

release-1 is the first build the audience is told to use (ADR 29 in the
mosaic umbrella: a build is `b<n>`, the first-parent commit count on main;
a name is an annotated tag, `git tag -a release-1 -m "b<n>: …"`). main is
at b13 as of 2026-10-17.

**Done when:** four friends can play each of Tractor, Gong Zhu (Hearts),
Wizard and Skull King from the lobby to the final score on
https://tractor.games, the game rules have tests, and every PR runs CI.

Each task is one PR, in order. A PR gets a Vercel preview; Convex work
uses the dev deployment (`npx convex dev`, robust-fish-54). Production
Convex is deployed only by Vercel's build on merge, never by hand.

## Where it stands (2026-10-17)

- The React 19 / Next 16.2 / convex 1.42 / eslint 9 upgrade is on main
  (0163d1b) and in production. `npm ci`, `tsc`, `eslint .` and
  `next build` all pass.
- No tests, no CI workflow, no Node version pinned.
- Wizard and Skull King landed in one commit (b9900aa, 07-09) and have
  not been played through.
- `/test` is a Tractor-only harness that ships to production.
- README still describes Next 14 / React 18 and a 6-letter name.
- PR #1 (Werewolf, February) was branched before Wizard and Skull King
  and is far behind main.

## Tasks

### Foundation

1. **CI.** Done (#3). A GitHub Actions workflow on pull requests and main: Node 22,
   `npm ci`, `tsc --noEmit` (app and `convex/`), `npm run lint`,
   `next build` with a placeholder `NEXT_PUBLIC_CONVEX_URL`. It never runs
   `convex deploy`. Add `engines.node` to package.json.
2. **Test runner.** In review (#4). Add Vitest and `npm test`, with one smoke test (deck
   sizes: Tractor 108, Hearts 52, Wizard 60, Skull King 69). CI runs it.
3. **Build number in the footer.** Show `b<n>` (and its name, if tagged)
   on every page, per ADR 29. On Vercel the clone is shallow, so the build
   command runs `git fetch --unshallow` before counting.

### Rule tests (one file per logic module, small)

4. **Wizard rules.** `convex/bidGameLogic.ts`: follow-suit validation;
   trick winner (first wizard, all jesters, trump over led suit, no
   trump); scoring (20 + 10/trick, −10 per trick off).
5. **Skull King rules.** Same file: the mermaid > Skull King > pirate >
   mermaid triangle, escapes, black as trump; bonuses; scoring, including
   the zero bid (±10 × round). Rules edition: see Answers.
6. **Hearts rules.** `convex/heartsGameLogic.ts`: two of clubs leads,
   follow suit, trick winner, round scoring.
7. **Tractor rules.** `convex/gameLogic.ts`: trump and effective suit,
   pairs and tractors, trick winner, follow rules, kitty bonus, rank
   change.

### Play-throughs (four browser tabs against the dev deployment)

Each one plays a full game from the lobby and fixes what breaks, in the
same PR or one per bug.

8. **Wizard** with 4 players, all 15 rounds, including a round where a
   wizard is flipped and the dealer picks trump.
9. **Skull King** with 4 players, all 10 rounds.
10. **Gong Zhu (Hearts)** with 4 players, to the end of the game.
11. **Tractor** with 4 players, at least one full round and the next
    round's rank change.
12. **Rejoin.** A player who reloads or loses the connection gets their
    seat and hand back, in every game.

### Release

13. **Clean up.** Remove `/test` or keep it out of production; rewrite
    the README (stack, `npm run dev`, Convex setup, how to deploy).
14. **release-1.** Four friends play one game of each on production; the
    user tags the build `release-1`.

## Later (not release-1)

- Werewolf (PR #1): rebase onto main or close.
- 3, 5 and 6 player Wizard and Skull King play-throughs.
- The newer Skull King cards (Kraken, White Whale, Tigress, Loot).

## Answers

- Skull King uses the current rules: a mermaid taking the Skull King
  pays +40, a pirate taking a mermaid pays +20. Task 5 implements and
  tests it.
- The player-name limit is back to 6 letters (this PR).
