// Stat metadata shared across the comparison UI.

export const STAT_ORDER = [
  "hp",
  "attack",
  "defense",
  "spAtk",
  "spDef",
  "speed",
];

// Generation 1 had no Sp. Atk / Sp. Def: a single "Special" stat covered both
// (D-045). It is deliberately NOT in STAT_ORDER — that list is the modern six,
// and the dataset's stored stat array depends on its exact length and order
// (pokemonCodec). It is a stat key like any other everywhere else, so it gets
// its label here rather than in a parallel map.
export const SPECIAL = "special";

export const GEN1_STAT_ORDER = ["hp", "attack", "defense", SPECIAL, "speed"];

export const STAT_LABEL = {
  hp: "HP",
  attack: "Atk",
  defense: "Def",
  spAtk: "SpA",
  spDef: "SpD",
  speed: "Spe",
  [SPECIAL]: "Spc",
};

// The maximum possible base stat (Blissey's HP). Bars scale to this fixed
// reference so a bar length means the same thing in every comparison (D-011).
export const MAX_STAT = 255;

export const statPct = (value) => `${Math.min(100, (value / MAX_STAT) * 100)}%`;
