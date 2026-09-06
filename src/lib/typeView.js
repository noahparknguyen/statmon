// Pure logic for the type chart page: what typing the URL names, what URL a
// typing produces, and how the 18 attacking types group against it.
//
// No React and no DOM, so it is unit-tested directly (typeView.test.js) and the
// page stays thin on top of it — the same split as lib/dexTable.js and
// lib/eras.js. The effectiveness maths itself is not here: that is
// lib/typeChart.js, which already answers every question this module asks.
import { eraView } from "./eras";
import { getBySlug } from "./pokemon";
import { TYPES } from "./types";
import { effectiveness, typeExistsIn, typesIn } from "./typeChart";

// Highest first, which is the order the question is asked in — "what beats
// this?" is answered at the top of the list. Every value `effectiveness` can
// return, so a tier is never missing because nobody thought of ¼×.
//
// **⅛× is in here for exactly that reason** and is the
// case that proved the comment right: it is unreachable from typing alone, but
// a defender resisting twice with an ability that halves again produces it, and
// an attacker whose multiplier is absent from this list is silently dropped
// from every tier rather than rendered wrong — the worst of the two failures
// (D-084).
export const MULT_ORDER = [4, 2, 1, 0.5, 0.25, 0.125, 0];

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
 * The canonical URL for a typing, with the generation lens and — when the
 * typing was named by picking a Pokémon — that Pokémon and its ability.
 *
 * Path segments rather than a query param, mirroring `/compare/<p1>/vs/<p2>`
 * (D-022): the typing is what the page is *about*, so it belongs in the path,
 * and `/types/water/flying` reads as what it is. The Pokémon is `?as=` because
 * it is a way of *naming* that typing rather than a different subject — which
 * is also why `parseDefender` validates it against the path instead of trusting
 * it (D-075).
 *
 * Every parameter is omitted at its default — no `asof` for the current
 * generation, no `ab` for the Pokémon's first ability — the same rule the rest
 * of the site follows, so the common case stays a clean path.
 */
export function typesUrl(
  types,
  { asof = null, as = null, ability = null } = {},
) {
  const path = ["/types", ...types].join("/");
  const query = [
    asof == null ? null : `asof=${asof}`,
    as == null ? null : `as=${as}`,
    ability == null ? null : `ab=${ability}`,
  ].filter(Boolean);
  return query.length ? `${path}?${query.join("&")}` : path;
}

/**
 * The Pokémon named by `?as=`, or null — validated against the typing the page
 * is actually showing.
 *
 * This is the move that keeps the URL a single source of truth rather than two
 * that can disagree. The Pokémon is never independent: if its typing at `gen`
 * is not the path's typing, or it did not exist that far back, the parameter is
 * simply dropped. So clicking a type chip off drops the Pokémon for free, with
 * no cleanup branch anywhere — and a stale or hand-edited link degrades to a
 * plainer view of the same page, the way `parseAsOf` and `parseTypes` do.
 */
export function parseDefender(types, searchParams, gen = null) {
  const slug = searchParams.get("as");
  const mon = slug ? getBySlug(slug) : null;
  return mon && defends(mon, types, gen) ? mon : null;
}

/**
 * Whether `mon` is a Pokémon this page could be showing: it existed at `gen`,
 * and its typing there is the typing on screen.
 *
 * Exported beside `parseDefender` because the same question has to be asked on
 * the way OUT as well as in — building the next URL has a Pokémon in hand
 * rather than a query string, and a link should never carry a parameter its own
 * page would discard on arrival.
 */
export function defends(mon, types, gen = null) {
  if (!mon || (gen != null && mon.introducedIn > gen)) return false;
  // Through parseTypes on both sides, so the comparison is between two
  // canonical lists rather than between a canonical one and a slot-ordered one.
  // Volcarona is stored Bug/Fire and canonicalises to Fire/Bug, so comparing
  // position by position against the path would reject the very Pokémon that
  // produced it.
  const mine = parseTypes(eraView(mon, gen).types, gen);
  return mine.length === types.length && mine.every((t, i) => t === types[i]);
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
export function matchupTiers(types, gen = null, ability = null) {
  if (!types.length) return [];
  const attackers = typesIn(gen);
  return MULT_ORDER.map((mult) => ({
    mult,
    types: attackers.filter(
      (a) => effectiveness(a, types, gen, ability) === mult,
    ),
  })).filter((tier) => tier.types.length > 0);
}
