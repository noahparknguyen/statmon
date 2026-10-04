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

/**
 * A translucent fill in a Pokémon's PRIMARY type, for a surface that carries
 * its typing: the dex's stat bars.
 *
 * **One colour per surface, never two (D-144).** A dual type used to be a
 * gradient between both colours (D-115, retuned by D-130 and D-133), and three
 * rounds of tuning could not make it look clean, because the stops were never
 * the problem. At 28% over near-black every type colour loses most of its
 * lightness, and a dark yellow is olive, a dark orange brown, a dark red
 * maroon. One of those reads as its type, beside its badge. Two together read
 * as camouflage, and the blend between them was greyer still. Even pure
 * `#ffff00` at this share is dark olive, so brighter type colours would not
 * have saved it. The typing in full is the badges' job: both sit beside every
 * bar, at full strength, where the colours look right.
 *
 * **Translucent, where the arena's tint is opaque.** `tintFor` mixes with
 * `--color-base` because a game panel sits on the page and nothing shows
 * through it. These bars sit in a table row that changes colour on hover, so
 * the fill has to mix with `transparent` and let the row underneath do the
 * rest. Reusing `tintFor` here would have pinned every bar to the page
 * background and killed the row hover.
 *
 * @param {string[]} types the typing, primary first
 * @param {string} alpha a CSS percentage, e.g. `"28%"`
 */
export function typeFill(types, alpha) {
  if (!types?.length) return "transparent";
  return `color-mix(in srgb, ${typeColorVar(types[0])} ${alpha}, transparent)`;
}

// Badge label color. Every type color is light enough on the dark UI that
// near-black text maximizes contrast — the mid-luminance types (fighting,
// poison, ghost, dragon, dark) score far better with dark text than white
// (dragon was also nudged lighter). So all badges use dark text. (D-027)
export const typeTextVar = () => "var(--color-base)";

export const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Three-letter column header for the type chart's grid, where eighteen full
// names would not fit. Derived rather than a hand-written map — the first three
// letters happen to be unique across all eighteen (GRAss/GROund, DRAgon/DARk,
// FIRe/FIGhting all differ), and a test asserts it stays that way, so a
// nineteenth type that collided would fail rather than render two identical
// headers. Always paired with the full name for screen readers. (D-051)
export const typeAbbr = (slug) => slug.slice(0, 3).toUpperCase();
