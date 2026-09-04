// Pure logic for the type chart page: what typing the URL names, what URL a
// typing produces, and how the 18 attacking types group against it.
//
// No React and no DOM, so it is unit-tested directly (typeView.test.js) and the
// page stays thin on top of it — the same split as lib/dexTable.js and
// lib/eras.js. The effectiveness maths itself is not here: that is
// lib/typeChart.js, which already answers every question this module asks.
import { TYPES } from "./types";
import { effectiveness, typeExistsIn, typesIn } from "./typeChart";

// Highest first, which is the order the question is asked in — "what beats
// this?" is answered at the top of the list. Every value `effectiveness` can
// return, so a tier is never missing because nobody thought of ¼×.
export const MULT_ORDER = [4, 2, 1, 0.5, 0.25, 0];

/**
 * The defending typing named by the URL's path segments, canonicalised.
 *
 * Returns at most two types **in TYPES order**, so `/types/flying/water` and
 * `/types/water/flying` are one view with one canonical URL — the same
 * normalise-on-read rule `parseList` applies to the dex's filters. Anything
 * unrecognised, duplicated, or not yet invented at `gen` is dropped rather than
 * throwing: a hand-edited link degrades to a plainer view of the same page.
 */
export function parseTypes(segments, gen = null) {
  const picked = new Set(
    segments.filter(Boolean).map((s) => String(s).toLowerCase()),
  );
  return TYPES.filter((t) => picked.has(t) && typeExistsIn(t, gen)).slice(0, 2);
}

/**
 * The canonical URL for a typing, with the generation lens on top.
 *
 * Path segments rather than a query param, mirroring `/compare/<p1>/vs/<p2>`
 * (D-022): the typing is what the page is *about*, so it belongs in the path,
 * and `/types/water/flying` reads as what it is. `asof` is omitted for the
 * current generation, the same "defaults stay out of the URL" rule as
 * everywhere else on the site.
 */
export function typesUrl(types, asof = null) {
  const path = ["/types", ...types].join("/");
  return asof == null ? path : `${path}?asof=${asof}`;
}

/**
 * Adds or removes one type, capped at two.
 *
 * A third pick is refused rather than silently evicting one of the existing
 * two — the picker greys out the remaining chips when it is full, so this is
 * the state that control is already showing. Re-derived from TYPES order so the
 * URL is identical however the pair was clicked.
 */
export function toggleType(types, type) {
  if (types.includes(type)) return types.filter((t) => t !== type);
  if (types.length >= 2) return types;
  return TYPES.filter((t) => types.includes(t) || t === type);
}

/**
 * Every attacking type grouped by what it does to `types`, as
 * `[{ mult, types }]` — highest multiplier first, empty tiers dropped.
 *
 * Dropping empty tiers is deliberate: the shape of the answer carries
 * information. A typing with no 4× row has no double weakness, and that reads
 * faster from an absent row than from an empty one.
 *
 * With no defending types this is every attacker at 1×, which is true but not
 * worth rendering — the page shows the grid instead.
 */
export function matchupTiers(types, gen = null) {
  if (!types.length) return [];
  const attackers = typesIn(gen);
  return MULT_ORDER.map((mult) => ({
    mult,
    types: attackers.filter((a) => effectiveness(a, types, gen) === mult),
  })).filter((tier) => tier.types.length > 0);
}
