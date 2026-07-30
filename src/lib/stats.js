// Stat metadata shared across the comparison UI.

export const STAT_ORDER = [
  "hp",
  "attack",
  "defense",
  "spAtk",
  "spDef",
  "speed",
];

export const STAT_LABEL = {
  hp: "HP",
  attack: "Atk",
  defense: "Def",
  spAtk: "SpA",
  spDef: "SpD",
  speed: "Spe",
};

// The maximum possible base stat (Blissey's HP). Bars scale to this fixed
// reference so a bar length means the same thing in every comparison (D-011).
export const MAX_STAT = 255;

export const statPct = (value) => `${Math.min(100, (value / MAX_STAT) * 100)}%`;
