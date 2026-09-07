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
 * A translucent fill for a whole TYPING rather than one type.
 *
 * A single type is a flat wash; a dual type is a gradient between the two, so a
 * Pokémon's representation carries both halves of what it is (04_design §3).
 * The arena already does this behind its panels ([D-107]); this is the same
 * idea at bar scale.
 *
 * **Returns a `background`, not a `background-color`.** A caller setting
 * `backgroundColor` from this renders nothing at all for a dual type, silently
 * — a gradient is a background *image*. The same trap `tintFor` documents in
 * `gameChrome.jsx`, and the reason both spell it out.
 *
 * **Translucent, where the arena's tint is opaque.** `tintFor` mixes with
 * `--color-base` because a game panel sits on the page and nothing shows
 * through it. These bars sit in a table row that changes colour on hover, so
 * the fill has to mix with `transparent` and let the row underneath do the
 * rest. Reusing `tintFor` here would have pinned every bar to the page
 * background and killed the row hover.
 *
 * **The gradient runs along the bar (90deg), not diagonally like the arena's
 * 135deg.** A stat bar is a horizontal strip whose width is the value, so a
 * diagonal has almost no vertical run to travel and degrades into a hard edge.
 * Running it along the length also means both colours are visible at every bar
 * width, from a 5 HP sliver to a 255 Speed full bar.
 *
 * @param {string[]} types one or two type slugs, primary first
 * @param {string} alpha a CSS percentage, e.g. `"28%"`
 */
export function typeFill(types, alpha) {
  if (!types?.length) return "transparent";
  const stop = (t) =>
    `color-mix(in srgb, ${typeColorVar(t)} ${alpha}, transparent)`;
  if (types.length === 1) return stop(types[0]);
  const [a, b] = types;
  // **A 10% blend zone, not 50%.** The stops used to hold each colour to 25%
  // and blend across the middle half, and that middle went muddy: two type
  // colours are often near-complementary in HUE — bug against dragon is
  // yellow-green against purple — and a straight line between opposite hues
  // passes close to neutral. Measured across the 65 pairs whose midpoint loses
  // more than a quarter of its chroma, **29.7% of the bar was visibly muddy**
  // at 25/75 and is **5.9%** at 45/55. The seam is still soft; there is just
  // far less of it.
  //
  // **Not an oklab gradient, and that was measured too.** The usual advice is
  // to interpolate in a perceptual space, and here it does not help: oklab
  // fixes gamma-induced darkening, which is not what is happening. Opposite
  // hues pass near grey in any rectangular space, and oklab came out slightly
  // WORSE across all 153 pairs (29.9% mean chroma loss against sRGB's 26.4%).
  // `oklch` would arc around the hue circle and stay saturated, but it would
  // sweep through hues belonging to neither type — a green midpoint on a
  // Grass-less Pokémon says something false on a site about types.
  return `linear-gradient(90deg, ${stop(a)} 0%, ${stop(a)} 45%, ${stop(b)} 55%, ${stop(b)} 100%)`;
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
