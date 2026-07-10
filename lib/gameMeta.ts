// Client-safe game metadata (no Convex imports)

export type GameType = "tractor" | "hearts" | "wizard" | "skullking";

export const GAME_META: Record<
  GameType,
  { name: string; min: number; max: number }
> = {
  tractor: { name: "Tractor 升级", min: 4, max: 4 },
  hearts: { name: "Gong Zhu 拱猪", min: 4, max: 4 },
  wizard: { name: "Wizard", min: 3, max: 6 },
  skullking: { name: "Skull King", min: 3, max: 6 },
};

export function resolveGameType(gameType: string | undefined): GameType {
  if (gameType === "hearts" || gameType === "wizard" || gameType === "skullking")
    return gameType;
  return "tractor";
}
