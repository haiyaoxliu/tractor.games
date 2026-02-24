// ─── Role Definitions ────────────────────────────────────────────

export interface RoleDef {
  name: string;
  team: "werewolf" | "village" | "independent" | "varies";
  maxCopies: number;
  nightOrder: number; // lower = acts earlier; 0 = no night action
  hasNightAction: boolean;
}

export const ROLES: Record<string, RoleDef> = {
  copycat:            { name: "Copycat",            team: "varies",       maxCopies: 1, nightOrder: 1,  hasNightAction: true },
  doppelganger:       { name: "Doppelgänger",       team: "varies",       maxCopies: 1, nightOrder: 2,  hasNightAction: true },
  werewolf:           { name: "Werewolf",           team: "werewolf",     maxCopies: 3, nightOrder: 3,  hasNightAction: true },
  minion:             { name: "Minion",             team: "werewolf",     maxCopies: 1, nightOrder: 4,  hasNightAction: true },
  apprentice_tanner:  { name: "Apprentice Tanner",  team: "independent",  maxCopies: 1, nightOrder: 5,  hasNightAction: true },
  mason:              { name: "Mason",              team: "village",      maxCopies: 3, nightOrder: 6,  hasNightAction: true },
  seer:               { name: "Seer",               team: "village",      maxCopies: 1, nightOrder: 7,  hasNightAction: true },
  robber:             { name: "Robber",             team: "village",      maxCopies: 1, nightOrder: 8,  hasNightAction: true },
  witch:              { name: "Witch",              team: "village",      maxCopies: 1, nightOrder: 9,  hasNightAction: true },
  troublemaker:       { name: "Troublemaker",       team: "village",      maxCopies: 1, nightOrder: 10, hasNightAction: true },
  gremlin:            { name: "Gremlin",            team: "village",      maxCopies: 1, nightOrder: 11, hasNightAction: true },
  drunk:              { name: "Drunk",              team: "village",      maxCopies: 1, nightOrder: 12, hasNightAction: true },
  insomniac:          { name: "Insomniac",          team: "village",      maxCopies: 1, nightOrder: 13, hasNightAction: true },
  hunter:             { name: "Hunter",             team: "village",      maxCopies: 1, nightOrder: 0,  hasNightAction: false },
  villager:           { name: "Villager",           team: "village",      maxCopies: 4, nightOrder: 0,  hasNightAction: false },
  tanner:             { name: "Tanner",             team: "independent",  maxCopies: 1, nightOrder: 0,  hasNightAction: false },
};

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  copycat:           "View a center card and become that role (act later if applicable).",
  doppelganger:      "View a player's card, become that role, and immediately perform its night action.",
  werewolf:          "See other werewolves. Lone wolf may peek at 1 center card.",
  minion:            "See who the werewolves are. You win with the werewolf team.",
  apprentice_tanner: "See who the Tanner is. Win if Tanner dies; become Tanner if no Tanner in game.",
  mason:             "See other masons.",
  seer:              "View 1 player's card OR 2 center cards.",
  robber:            "Swap your card with a player's card, then view your new card.",
  witch:             "View a center card, then may swap it with any player's card.",
  troublemaker:      "Swap two other players' cards (without looking).",
  gremlin:           "May swap any two players' cards (including your own).",
  drunk:             "Swap your card with a center card (without looking).",
  insomniac:         "View your own card at the end of the night.",
  hunter:            "No night action. If you are killed, the player you voted for also dies.",
  villager:          "No night action. Use your wits to find the werewolves!",
  tanner:            "No night action. You win if you die. You are on no one's team.",
};

// Night wake order for display
export const NIGHT_ORDER: string[] = [
  "copycat", "doppelganger", "werewolf", "minion", "apprentice_tanner",
  "mason", "seer", "robber", "witch", "troublemaker", "gremlin", "drunk", "insomniac",
];

// ─── Game State Types ────────────────────────────────────────────

export interface NightQueueEntry {
  seat: number;
  role: string;
  order: number;
}

export interface NightAction {
  seat: number;
  role: string;
  action: unknown;
}

export interface GameState {
  originalRoles: string[];
  currentRoles: string[];
  centerCards: string[];
  currentCenterCards: string[];
  nightActionQueue: NightQueueEntry[];
  nightActionIndex: number;
  nightActions: NightAction[];
  nightInfo: unknown[];
  playerCount: number;
}

// ─── Night Action Queue ──────────────────────────────────────────

export function buildNightActionQueue(
  selectedRoles: string[],
  roleAssignments: string[], // roleAssignments[seat] = role for that seat (excludes center cards)
): NightQueueEntry[] {
  const queue: NightQueueEntry[] = [];

  for (let seat = 0; seat < roleAssignments.length; seat++) {
    const role = roleAssignments[seat];
    const def = ROLES[role];
    if (def && def.hasNightAction) {
      queue.push({ seat, role, order: def.nightOrder });
    }
  }

  queue.sort((a, b) => a.order - b.order);
  return queue;
}

// ─── Valid Night Actions ─────────────────────────────────────────

export interface NightActionOptions {
  type: string;
  description: string;
  choices?: unknown;
}

export function getValidNightActions(
  role: string,
  state: GameState,
  seat: number,
): NightActionOptions {
  const playerCount = state.playerCount;
  const otherSeats = Array.from({ length: playerCount }, (_, i) => i).filter(i => i !== seat);

  switch (role) {
    case "werewolf": {
      // Find other werewolves
      const otherWolves = [];
      for (let i = 0; i < playerCount; i++) {
        if (i !== seat && state.originalRoles[i] === "werewolf") {
          otherWolves.push(i);
        }
      }
      if (otherWolves.length === 0) {
        // Lone wolf: may peek at 1 center card
        return {
          type: "lone_wolf_peek",
          description: "You are the lone Werewolf. You may peek at one center card.",
          choices: { centerIndices: [0, 1, 2] },
        };
      }
      return {
        type: "see_wolves",
        description: "You see the other Werewolves.",
        choices: { otherWolves },
      };
    }

    case "minion": {
      const wolves = [];
      for (let i = 0; i < playerCount; i++) {
        if (state.originalRoles[i] === "werewolf") wolves.push(i);
      }
      return {
        type: "see_wolves",
        description: wolves.length > 0 ? "You see the Werewolves." : "There are no Werewolves among the players.",
        choices: { wolves },
      };
    }

    case "apprentice_tanner": {
      const tannerSeat = state.originalRoles.findIndex(r => r === "tanner");
      const hasTannerInGame = state.originalRoles.some(r => r === "tanner");
      return {
        type: "see_tanner",
        description: hasTannerInGame ? "You see the Tanner." : "There is no Tanner. You are now the Tanner.",
        choices: { tannerSeat: hasTannerInGame ? tannerSeat : -1, becomesTanner: !hasTannerInGame },
      };
    }

    case "mason": {
      const otherMasons = [];
      for (let i = 0; i < playerCount; i++) {
        if (i !== seat && state.originalRoles[i] === "mason") otherMasons.push(i);
      }
      return {
        type: "see_masons",
        description: otherMasons.length > 0 ? "You see the other Masons." : "You are the only Mason.",
        choices: { otherMasons },
      };
    }

    case "seer":
      return {
        type: "seer_choice",
        description: "View 1 player's card OR 2 center cards.",
        choices: { players: otherSeats, centerPairs: [[0, 1], [0, 2], [1, 2]] },
      };

    case "robber":
      return {
        type: "robber_swap",
        description: "Choose a player to swap cards with. You will see your new card.",
        choices: { players: otherSeats },
      };

    case "witch":
      return {
        type: "witch_action",
        description: "View a center card. You may then swap it with any player's card.",
        choices: { centerIndices: [0, 1, 2], players: Array.from({ length: playerCount }, (_, i) => i) },
      };

    case "troublemaker":
      return {
        type: "troublemaker_swap",
        description: "Swap two other players' cards (without looking).",
        choices: { players: otherSeats },
      };

    case "gremlin":
      return {
        type: "gremlin_swap",
        description: "You may swap any two players' cards (including your own), or skip.",
        choices: { players: Array.from({ length: playerCount }, (_, i) => i) },
      };

    case "drunk":
      return {
        type: "drunk_swap",
        description: "Swap your card with a center card (without looking).",
        choices: { centerIndices: [0, 1, 2] },
      };

    case "insomniac":
      return {
        type: "insomniac_peek",
        description: "You view your own card at the end of the night.",
      };

    case "copycat":
      return {
        type: "copycat_peek",
        description: "View a center card and become that role.",
        choices: { centerIndices: [0, 1, 2] },
      };

    case "doppelganger":
      return {
        type: "doppelganger_copy",
        description: "View a player's card and become that role.",
        choices: { players: otherSeats },
      };

    default:
      return { type: "none", description: "No action." };
  }
}

// ─── Process Night Action ────────────────────────────────────────

interface ActionPayload {
  type: string;
  // For lone wolf peek / seer center peek / drunk / copycat / witch
  centerIndex?: number;
  // For seer center pair
  centerIndices?: number[];
  // For seer player peek / robber / doppelganger
  targetSeat?: number;
  // For troublemaker / gremlin
  targetSeat1?: number;
  targetSeat2?: number;
  // For witch: which center card to swap with which player
  witchCenterIndex?: number;
  witchTargetSeat?: number;
  witchSkip?: boolean;
  // For gremlin: skip
  skip?: boolean;
}

export interface ProcessResult {
  currentRoles: string[];
  currentCenterCards: string[];
  nightInfo: unknown[];
  // For doppelganger: may need to add extra queue entries
  extraQueueEntries?: NightQueueEntry[];
}

export function processNightAction(
  state: GameState,
  seat: number,
  role: string,
  action: ActionPayload,
): ProcessResult {
  const currentRoles = [...state.currentRoles];
  const currentCenterCards = [...state.currentCenterCards];
  const nightInfo: unknown[] = [...state.nightInfo];

  // Initialize nightInfo for seat if needed
  if (!nightInfo[seat]) nightInfo[seat] = {};

  switch (role) {
    case "werewolf": {
      const otherWolves = [];
      for (let i = 0; i < state.playerCount; i++) {
        if (i !== seat && state.originalRoles[i] === "werewolf") otherWolves.push(i);
      }
      if (otherWolves.length === 0 && action.centerIndex !== undefined) {
        // Lone wolf peeks at center card
        const info = nightInfo[seat] as Record<string, unknown>;
        info.loneWolfPeek = { centerIndex: action.centerIndex, card: currentCenterCards[action.centerIndex] };
        nightInfo[seat] = { ...info, otherWolves: [] };
      } else {
        nightInfo[seat] = { ...(nightInfo[seat] as object), otherWolves };
      }
      break;
    }

    case "minion": {
      const wolves = [];
      for (let i = 0; i < state.playerCount; i++) {
        if (state.originalRoles[i] === "werewolf") wolves.push(i);
      }
      nightInfo[seat] = { ...(nightInfo[seat] as object), wolves };
      break;
    }

    case "apprentice_tanner": {
      const tannerSeat = state.originalRoles.findIndex(r => r === "tanner");
      const hasTanner = tannerSeat >= 0;
      nightInfo[seat] = {
        ...(nightInfo[seat] as object),
        tannerSeat: hasTanner ? tannerSeat : -1,
        becomesTanner: !hasTanner,
      };
      break;
    }

    case "mason": {
      const otherMasons = [];
      for (let i = 0; i < state.playerCount; i++) {
        if (i !== seat && state.originalRoles[i] === "mason") otherMasons.push(i);
      }
      nightInfo[seat] = { ...(nightInfo[seat] as object), otherMasons };
      break;
    }

    case "seer": {
      if (action.type === "seer_player" && action.targetSeat !== undefined) {
        nightInfo[seat] = {
          ...(nightInfo[seat] as object),
          seerPeek: { seat: action.targetSeat, card: currentRoles[action.targetSeat] },
        };
      } else if (action.type === "seer_center" && action.centerIndices) {
        const cards = action.centerIndices.map(i => ({
          index: i,
          card: currentCenterCards[i],
        }));
        nightInfo[seat] = { ...(nightInfo[seat] as object), seerCenterPeek: cards };
      }
      break;
    }

    case "robber": {
      if (action.targetSeat !== undefined) {
        const myOldRole = currentRoles[seat];
        const theirRole = currentRoles[action.targetSeat];
        currentRoles[seat] = theirRole;
        currentRoles[action.targetSeat] = myOldRole;
        nightInfo[seat] = {
          ...(nightInfo[seat] as object),
          robberSwap: { targetSeat: action.targetSeat, newCard: theirRole },
        };
      }
      break;
    }

    case "witch": {
      if (action.witchCenterIndex !== undefined) {
        const viewedCard = currentCenterCards[action.witchCenterIndex];
        nightInfo[seat] = {
          ...(nightInfo[seat] as object),
          witchPeek: { centerIndex: action.witchCenterIndex, card: viewedCard },
        };
        if (!action.witchSkip && action.witchTargetSeat !== undefined) {
          const playerCard = currentRoles[action.witchTargetSeat];
          currentRoles[action.witchTargetSeat] = viewedCard;
          currentCenterCards[action.witchCenterIndex] = playerCard;
          (nightInfo[seat] as Record<string, unknown>).witchSwap = {
            centerIndex: action.witchCenterIndex,
            targetSeat: action.witchTargetSeat,
          };
        }
      }
      break;
    }

    case "troublemaker": {
      if (action.targetSeat1 !== undefined && action.targetSeat2 !== undefined) {
        const temp = currentRoles[action.targetSeat1];
        currentRoles[action.targetSeat1] = currentRoles[action.targetSeat2];
        currentRoles[action.targetSeat2] = temp;
        nightInfo[seat] = {
          ...(nightInfo[seat] as object),
          troublemakerSwap: { seat1: action.targetSeat1, seat2: action.targetSeat2 },
        };
      }
      break;
    }

    case "gremlin": {
      if (!action.skip && action.targetSeat1 !== undefined && action.targetSeat2 !== undefined) {
        const temp = currentRoles[action.targetSeat1];
        currentRoles[action.targetSeat1] = currentRoles[action.targetSeat2];
        currentRoles[action.targetSeat2] = temp;
        nightInfo[seat] = {
          ...(nightInfo[seat] as object),
          gremlinSwap: { seat1: action.targetSeat1, seat2: action.targetSeat2 },
        };
      } else {
        nightInfo[seat] = { ...(nightInfo[seat] as object), gremlinSkip: true };
      }
      break;
    }

    case "drunk": {
      if (action.centerIndex !== undefined) {
        const temp = currentRoles[seat];
        currentRoles[seat] = currentCenterCards[action.centerIndex];
        currentCenterCards[action.centerIndex] = temp;
        nightInfo[seat] = {
          ...(nightInfo[seat] as object),
          drunkSwap: { centerIndex: action.centerIndex },
        };
      }
      break;
    }

    case "insomniac": {
      nightInfo[seat] = {
        ...(nightInfo[seat] as object),
        insomniacCard: currentRoles[seat],
      };
      break;
    }

    case "copycat": {
      if (action.centerIndex !== undefined) {
        const card = currentCenterCards[action.centerIndex];
        nightInfo[seat] = {
          ...(nightInfo[seat] as object),
          copycatPeek: { centerIndex: action.centerIndex, card },
          copiedRole: card,
        };
        // Copycat becomes that role for the rest of the night
        // If the copied role has a night action that comes later, add to queue
        const copiedDef = ROLES[card];
        if (copiedDef && copiedDef.hasNightAction && copiedDef.nightOrder > ROLES.copycat.nightOrder) {
          return {
            currentRoles,
            currentCenterCards,
            nightInfo,
            extraQueueEntries: [{ seat, role: card, order: copiedDef.nightOrder }],
          };
        }
      }
      break;
    }

    case "doppelganger": {
      if (action.targetSeat !== undefined) {
        const card = currentRoles[action.targetSeat];
        nightInfo[seat] = {
          ...(nightInfo[seat] as object),
          doppelgangerPeek: { targetSeat: action.targetSeat, card },
          copiedRole: card,
        };
        // Doppelganger becomes that role and immediately acts
        // For roles with later night order, add to queue
        const copiedDef = ROLES[card];
        if (copiedDef && copiedDef.hasNightAction && copiedDef.nightOrder > ROLES.doppelganger.nightOrder) {
          return {
            currentRoles,
            currentCenterCards,
            nightInfo,
            extraQueueEntries: [{ seat, role: card, order: copiedDef.nightOrder }],
          };
        }
      }
      break;
    }
  }

  return { currentRoles, currentCenterCards, nightInfo };
}

// ─── Vote Resolution ─────────────────────────────────────────────

export function resolveVotes(
  votes: { seat: number; targetSeat: number }[],
  currentRoles: string[],
  originalRoles: string[],
  playerCount: number,
): { killedSeats: number[]; winners: string[] } {
  // Count votes per player
  const voteCounts = new Array(playerCount).fill(0);
  for (const v of votes) {
    voteCounts[v.targetSeat]++;
  }

  // Find max votes (must be > 1 to kill)
  const maxVotes = Math.max(...voteCounts);
  let killedSeats: number[] = [];

  if (maxVotes > 1) {
    // All players tied for max votes are killed
    killedSeats = voteCounts
      .map((count, seat) => (count === maxVotes ? seat : -1))
      .filter(s => s >= 0);
  }

  // Hunter chain: if a hunter is killed, who they voted for also dies
  let changed = true;
  while (changed) {
    changed = false;
    for (const deadSeat of [...killedSeats]) {
      if (currentRoles[deadSeat] === "hunter") {
        const hunterVote = votes.find(v => v.seat === deadSeat);
        if (hunterVote && !killedSeats.includes(hunterVote.targetSeat)) {
          killedSeats.push(hunterVote.targetSeat);
          changed = true;
        }
      }
    }
  }

  // Determine winners
  const winners = determineWinners(killedSeats, currentRoles, originalRoles, playerCount);

  return { killedSeats, winners };
}

function determineWinners(
  killedSeats: number[],
  currentRoles: string[],
  originalRoles: string[],
  playerCount: number,
): string[] {
  const winners: string[] = [];

  // Check if any werewolves exist among players' final roles
  const werewolfExists = currentRoles.slice(0, playerCount).some(r => r === "werewolf");
  const werewolfDied = killedSeats.some(s => currentRoles[s] === "werewolf");

  // Check Tanner
  const tannerDied = killedSeats.some(s => currentRoles[s] === "tanner");

  // Check Apprentice Tanner
  const hasTannerRole = originalRoles.slice(0, playerCount).some(r => r === "tanner") ||
    currentRoles.slice(0, playerCount).some(r => r === "tanner");
  const apprenticeTannerSeats: number[] = [];
  for (let i = 0; i < playerCount; i++) {
    if (currentRoles[i] === "apprentice_tanner") apprenticeTannerSeats.push(i);
  }

  if (tannerDied) {
    winners.push("tanner");
    // Apprentice tanner also wins if tanner dies
    if (apprenticeTannerSeats.length > 0) {
      winners.push("apprentice_tanner");
    }
  }

  // Apprentice tanner becomes tanner if no tanner in game — wins if they die
  if (!hasTannerRole) {
    const apprenticeDied = killedSeats.some(s => currentRoles[s] === "apprentice_tanner");
    if (apprenticeDied) {
      winners.push("apprentice_tanner");
    }
  }

  if (killedSeats.length === 0) {
    // No one died
    if (!werewolfExists) {
      // No werewolves among players → village wins
      winners.push("village");
    } else {
      // Werewolves survived → werewolf wins
      winners.push("werewolf");
    }
  } else {
    // Someone died
    if (werewolfDied) {
      // Werewolf died → village wins (unless tanner also died, tanner already added)
      if (!tannerDied) {
        winners.push("village");
      } else {
        // Tanner died too — tanner wins but NOT village
        // Village does NOT win when tanner dies, even if werewolf also dies
        // UNLESS there are no werewolves at all
        if (!werewolfExists) {
          winners.push("village");
        }
      }
    } else {
      // No werewolf died
      if (!tannerDied) {
        // Werewolf team wins
        winners.push("werewolf");
      }
      // If tanner died (but no werewolf), tanner already added, werewolf also wins
      if (tannerDied && werewolfExists) {
        winners.push("werewolf");
      }
    }
  }

  return [...new Set(winners)];
}

// ─── Shuffle Utility ─────────────────────────────────────────────

export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ─── Validate Role Selection ─────────────────────────────────────

export function validateRoleSelection(
  selectedRoles: string[],
  playerCount: number,
): string | null {
  const required = playerCount + 3;
  if (selectedRoles.length !== required) {
    return `Need exactly ${required} roles for ${playerCount} players (got ${selectedRoles.length})`;
  }

  // Check max copies
  const counts: Record<string, number> = {};
  for (const role of selectedRoles) {
    counts[role] = (counts[role] ?? 0) + 1;
    const def = ROLES[role];
    if (!def) return `Unknown role: ${role}`;
    if (counts[role] > def.maxCopies) {
      return `Too many ${def.name} (max ${def.maxCopies})`;
    }
  }

  return null;
}
