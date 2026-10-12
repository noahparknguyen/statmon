// Pure logic for the type chart page: what typing the URL names, what URL a
// typing produces, and how the 18 attacking types group against it.
//
// No React and no DOM, so it's tested directly in typeView.test.js and the page
// stays thin. The effectiveness maths itself is in lib/typeChart.js.
import { eraView } from "./eras";
import { getBySlug } from "./pokemon";
import { TYPES } from "./types";
import { effectiveness, typeExistsIn, typesIn } from "./typeChart";

// Highest first, the order the question is asked in: "what beats this?" is
// answered at the top. It lists every value `effectiveness` can return, because
// an attacking type whose multiplier is missing here would silently vanish from
// every tier rather than show up wrong.
//
// That's why ⅛× is here. Typing alone can't reach it, but a defender that
// resists twice and has an ability that halves again can.
export const MULT_ORDER = [4, 2, 1, 0.5, 0.25, 0.125, 0];

/**
 * The defending typing the URL's path names, canonicalised.
 *
 * Returns at most two types, in TYPES order, so `/types/flying/water` and
 * `/types/water/flying` are one view with one canonical URL, as the dex's
 * filters are. Anything unrecognised, repeated, or not yet invented at `gen` is
 * dropped rather than throwing, so a hand-edited link gives a plainer view of
 * the same page.
 */
export function parseTypes(segments, gen = null) {
  const picked = new Set(
    segments.filter(Boolean).map((s) => String(s).toLowerCase()),
  );
  return TYPES.filter((t) => picked.has(t) && typeExistsIn(t, gen)).slice(0, 2);
}

/**
 * The canonical URL for a typing, with the generation and, when the typing was
 * named by picking a Pokémon, that Pokémon and its ability.
 *
 * The typing goes in the path rather than a query parameter, as in
 * `/compare/<p1>/vs/<p2>`: it's what the page is about, and
 * `/types/water/flying` reads as what it is. The Pokémon is `?as=` because it's
 * a way of naming that typing rather than a different subject, which is also
 * why `parseDefender` checks it against the path instead of trusting it.
 *
 * Every parameter is left out at its default: no `asof` for today's generation,
 * and no `ab` for the Pokémon's first ability. So the usual case is a clean
 * path.
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
 * The Pokémon `?as=` names, or null, checked against the typing the page is
 * showing.
 *
 * That check keeps the URL one source of truth rather than two that can
 * disagree. If the Pokémon's typing at `gen` isn't the path's typing, or it
 * didn't exist that far back, the parameter is dropped. So turning a type chip
 * off drops the Pokémon too, with no cleanup code anywhere, and a stale link
 * gives a plainer view of the same page.
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
 * Exported because the same check is needed when building the next URL, which
 * starts from a Pokémon rather than a query string. A link should never carry a
 * parameter its own page would drop on arrival.
 */
export function defends(mon, types, gen = null) {
  if (!mon || (gen != null && mon.introducedIn > gen)) return false;
  // Both sides go through parseTypes, so two canonical lists are compared.
  // Volcarona is stored Bug/Fire and canonicalises to Fire/Bug, so comparing
  // slot by slot against the path would reject the Pokémon that produced it.
  const mine = parseTypes(eraView(mon, gen).types, gen);
  return mine.length === types.length && mine.every((t, i) => t === types[i]);
}

/**
 * Adds or removes one type, up to two.
 *
 * A third pick is refused rather than pushing one of the others out: the picker
 * greys out the remaining chips when it's full, so this matches what the
 * control shows. Rebuilt in TYPES order, so the URL is the same however the
 * pair was clicked.
 */
export function toggleType(types, type) {
  if (types.includes(type)) return types.filter((t) => t !== type);
  if (types.length >= 2) return types;
  return TYPES.filter((t) => types.includes(t) || t === type);
}

/**
 * Every attacking type grouped by what it does to `types`, as
 * `[{ mult, types }]`, highest multiplier first, with empty tiers dropped.
 *
 * Dropping them is deliberate, because the shape of the answer says something:
 * a typing with no 4× row has no double weakness, and an absent row reads
 * faster than an empty one.
 *
 * With no defending types this would be every attacker at 1×, which is true but
 * not worth showing, so the page shows the grid instead.
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
