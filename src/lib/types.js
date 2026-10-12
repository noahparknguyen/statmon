// The types, and helpers for their colours. The colours are the CSS custom
// properties in index.css (--color-type-*), so components use tokens and
// Tailwind's scanner never has to see a class name built at runtime.
//
// Modules that import this one name its .js extension, because scripts/*.mjs
// load it under plain Node (see scripts/contrast-audit.mjs).

// The 18 types, in the canonical Pokédex order, which is also PokéAPI's type id
// order. It's the one list of which types exist: the contrast audit and the
// effectiveness chart are both checked against it rather than keeping copies.
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

/**
 * A translucent fill in a Pokémon's primary type, for a surface that carries
 * its typing: the dex's stat bars.
 *
 * One colour per surface, never two. At 28% over near-black, every type colour
 * loses most of its lightness: a dark yellow is olive, a dark orange brown, a
 * dark red maroon. One of those still reads as its type beside its badge, but
 * two together read as camouflage, and a blend between them is greyer still.
 * Even pure `#ffff00` at this share is dark olive, so brighter type colours
 * wouldn't help. Showing the full typing is the badges' job: both sit beside
 * every bar, at full strength.
 *
 * Translucent, where the game panels' tint is opaque. `tintFor` mixes with
 * `--color-base` because a game panel sits on the page with nothing showing
 * through. These bars sit in a table row that changes colour on hover, so the
 * fill mixes with `transparent` and lets the row show through. `tintFor` here
 * would pin every bar to the page background and hide the row's hover.
 *
 * @param {string[]} types the typing, primary first
 * @param {string} alpha a CSS percentage, e.g. `"28%"`
 */
export function typeFill(types, alpha) {
  if (!types?.length) return "transparent";
  return `color-mix(in srgb, ${typeColorVar(types[0])} ${alpha}, transparent)`;
}

// Badge label colour. Every type colour is light enough that near-black text
// gives the most contrast. Even the mid-lightness types (Fighting, Poison,
// Ghost, Dragon, and Dark) score far better with dark text than white, so every
// badge uses it.
export const typeTextVar = () => "var(--color-base)";

export const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Three-letter column headers for the type chart's grid, where 18 full names
// won't fit. Taken from the name rather than written out, because the first
// three letters happen to be unique across all 18: GRAss and GROund, DRAgon and
// DARk, FIRe and FIGhting all differ. Always paired with the full name for
// screen readers.
export const typeAbbr = (slug) => slug.slice(0, 3).toUpperCase();
