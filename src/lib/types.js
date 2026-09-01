// Type metadata and token-color helpers. Colors reference the CSS custom
// properties defined in index.css (--color-type-*), so components stay
// token-driven and Tailwind's scanner never needs to see a built class name.
//
// Explicit .js extension on this module's importers matters: scripts/*.mjs load
// it under plain Node ESM (see scripts/contrast-audit.mjs).

// The 18 types, in the canonical Pokedex order (which is also PokeAPI's type
// id order). This is the single source of truth for "what types exist" — the
// contrast audit and the effectiveness chart are both checked against it rather
// than keeping their own copies.
export const TYPES = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
];

export const typeColorVar = (slug) => `var(--color-type-${slug})`;

// Badge label color. Every type color is light enough on the dark UI that
// near-black text maximizes contrast — the mid-luminance types (fighting,
// poison, ghost, dragon, dark) score far better with dark text than white
// (dragon was also nudged lighter). So all badges use dark text. (D-027)
export const typeTextVar = () => "var(--color-base)";

export const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
