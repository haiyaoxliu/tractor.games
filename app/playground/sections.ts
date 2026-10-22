// Gallery sections, shared by the gallery and the shell's section picker.

export const SECTIONS = [
  ["cards", "Cards"],
  ["hand", "Hand"],
  ["trick", "Trick area"],
  ["seats", "Other players"],
  ["widgets", "Score & bid widgets"],
  ["buttons", "Buttons & panels"],
  ["lobby", "Lobby"],
  ["room", "Room"],
  ["tractor", "Tractor board"],
  ["hearts", "Gong Zhu board"],
  ["wizard", "Wizard board"],
  ["skullking", "Skull King board"],
] as const;

export type SectionId = (typeof SECTIONS)[number][0];
