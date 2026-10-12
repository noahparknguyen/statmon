// The stats, in display order, with their short labels.

export const STAT_ORDER = [
  "hp",
  "attack",
  "defense",
  "spAtk",
  "spDef",
  "speed",
];

// Gen 1 had no Sp. Atk or Sp. Def: one Special stat covered both. It's kept out
// of STAT_ORDER on purpose, because that list is today's six, and the dataset's
// stored stat array depends on its exact length and order (see pokemonCodec).
// Everywhere else it's a stat key like any other, so its label lives here
// rather than in a separate map.
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

// The highest base stat there is, Blissey's HP. Bars scale to this fixed
// reference, so a bar's length means the same thing in every comparison.
export const MAX_STAT = 255;

export const statPct = (value) => `${Math.min(100, (value / MAX_STAT) * 100)}%`;
