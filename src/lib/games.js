// The games: the pool a round is drawn from, question generation, and session
// scoring (D-091, revised by D-096).
//
// Statmon's three tools answer questions you already know how to ask. A game is
// the same engines — lib/stats, lib/eras, lib/typeChart — asking *you* instead,
// so the thing you used to look up is the thing you end up knowing. That is the
// whole justification for a game on a reference site, and it is why every round
// ends with a link back into the tool that would have answered it.
//
// Pure functions over plain data — no React, no DOM — so this is unit-tested
// directly (games.test.js) and the pages stay thin on top of it. Same split as
// lib/dexTable.js, lib/eras.js and lib/typeView.js.
//
// Randomness is INJECTED rather than reached for. Every generator here takes an
// `rng` defaulting to Math.random, which is what makes a round reproducible in a
// test — and what would make a daily seeded puzzle (05_roadmap Phase 6) a caller
// rather than a rewrite.
import {
  ACROSS_THE_SPLIT,
  SORT_LONG_LABEL,
  filterRows,
  generationsFor,
  parseList,
  statKeysFor,
  typesFor,
} from "./dexTable";
import { CURRENT_GEN, eraView } from "./eras";
import { ALL_POKEMON } from "./pokemon";

/* -------------------------------------------------------------------------
   Settings — what the setup panel edits, and what the URL carries.

   The brief listed a mode per question shape: highest BST, highest single
   stat, and "which of these four moves first". They are one game with knobs
   (D-091). "Who moves first" is not a mode, it is `stats: [speed], n: 4`, and
   writing it as a mode would have been a third code path for a value of two
   existing ones.

   The knobs are the DEX'S OWN filter vocabulary (D-096), reused rather than
   reinvented: which generations a Pokémon may come from, which types, whether
   alternate forms are in, and which generation the stats are read at. Same
   parameter names, same parser, same semantics — a `?type=fire,water` means the
   identical thing on both tools.
   ---------------------------------------------------------------------- */

// Two or four. Not a free number: two is the comparison the site is built on,
// four is a doubles lead, and anything else is a longer version of the same
// question with more scrolling.
export const CONTENDER_COUNTS = [2, 4];

// A pool this small still plays, but it repeats itself within a few rounds, so
// the setup panel says so rather than letting it feel broken.
export const SMALL_POOL = 12;

// The stats a game can ask about at `asof`, in display order, with BST last
// because it is the aggregate rather than one of the six.
//
// Through `statKeysFor` rather than STAT_ORDER, so a Gen 1 game offers five
// stats and a **Special** and never offers Sp. Atk or Sp. Def — the same
// narrowing the dex's columns take under the same lens (D-049).
export const statsFor = (asof) => [...statKeysFor(asof), "bst"];

// The long name for a prompt and for a screen reader. "SpA" is a column header,
// not a question; `SORT_LONG_LABEL` already spells all of these out (including
// "Base stat total") for the dex's mobile sort control, so it is reused rather
// than restated.
export const statName = (stat) => SORT_LONG_LABEL[stat];

/**
 * The settings a bare `/games/higher` means.
 *
 * A function of `asof` rather than a constant, because "every stat" is a
 * different list under a Gen 1 lens. `DEFAULT_SETTINGS` below is the current
 * generation's, for the call sites that only need that one.
 */
export const defaultSettings = (asof = null) => ({
  n: 2,
  stats: statsFor(asof),
  gens: [],
  types: [],
  includeForms: false,
  asof,
});

export const DEFAULT_SETTINGS = defaultSettings(null);

/**
 * The stat list a lens can actually hold, mapping across the Gen 1 Special
 * split before giving anything up, and falling back to **all** of them.
 *
 * Empty means all, and that is the one place this diverges from the dex, where
 * an empty filter group is simply not a constraint (D-040). Here the stats are
 * the QUESTION SPACE rather than a filter over something visible: "ask me about
 * nothing" is not a game, so it resolves to "ask me about everything" — which
 * is also what makes the setup panel able to show every chip lit by default and
 * still keep the URL clean (D-096).
 */
export function resolveStats(wanted, asof) {
  const options = statsFor(asof);
  const picked = new Set();
  for (const stat of wanted) {
    if (options.includes(stat)) picked.add(stat);
    else {
      // Sp. Atk and Sp. Def are what Gen 1's Special became, so a drill on
      // either survives the trip in both directions rather than silently
      // resetting to "everything" — the dex's own rule for the same boundary.
      const mapped = ACROSS_THE_SPLIT[stat];
      if (mapped && options.includes(mapped)) picked.add(mapped);
    }
  }
  return picked.size ? options.filter((s) => picked.has(s)) : options;
}

/**
 * Switching the lens keeps everything else and re-reads each group through the
 * same resolution the URL parse uses, so clicking a generation chip and
 * hand-editing the URL land in the same state — and so a control never emits a
 * setting its own page would discard on arrival (the D-078 lesson).
 */
// Each list is re-DERIVED from its canonical order rather than filtered in
// place. Filtering keeps whatever order it was handed, so a settings object
// whose lists are out of order produces a URL that parses back into a different
// object — the D-078 fault, latent here because every caller happens to pass a
// canonical one. Rebuilding makes the invariant hold regardless.
export const setAsOf = (settings, asof) => ({
  ...settings,
  asof,
  stats: resolveStats(settings.stats, asof),
  gens: generationsFor(asof).filter((g) => settings.gens.includes(g)),
  types: typesFor(asof).filter((t) => settings.types.includes(t)),
});

/** Add or remove one stat. Removing the last one is refused — see `resolveStats`. */
export const toggleStat = (settings, stat) => {
  const next = new Set(settings.stats);
  if (next.has(stat)) next.delete(stat);
  else next.add(stat);
  if (next.size === 0) return settings;
  return {
    ...settings,
    stats: statsFor(settings.asof).filter((s) => next.has(s)),
  };
};

// Types and generations follow the dex exactly: re-derived from the canonical
// order so the URL is identical however the chips were clicked.
const toggleIn = (canonical, list, value) => {
  const next = new Set(list);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return canonical.filter((v) => next.has(v));
};

export const toggleGen = (settings, gen) => ({
  ...settings,
  gens: toggleIn(generationsFor(settings.asof), settings.gens, gen),
});

export const toggleType = (settings, type) => ({
  ...settings,
  types: toggleIn(typesFor(settings.asof), settings.types, type),
});

/* -------------------------------------------------------------------------
   The pool.
   ---------------------------------------------------------------------- */

/**
 * Who can be drawn.
 *
 * `filterRows` verbatim rather than a hand-rolled filter — it already caps on
 * `introducedIn` rather than `generation` (so no Alolan form turns up in a Gen 3
 * game, D-049), already hides alternate forms by default (D-056), and already
 * matches types against the ERA'S typing, so a Gen 5 game filtered to Fairy is
 * correctly empty rather than quietly wrong. A Gen 1 game is exactly 151
 * Pokémon without this module knowing that.
 */
export const poolFor = ({
  gens = [],
  types = [],
  includeForms = false,
  asof = null,
} = {}) => filterRows(ALL_POKEMON, { gens, types, includeForms, asof });

// One stat off an era view. BST is a field rather than a key in `stats`, and
// that asymmetry is the dataset's, so it is absorbed here once instead of at
// every call site.
export const statValue = (view, stat) =>
  stat === "bst" ? view.bst : view.stats[stat];

/* -------------------------------------------------------------------------
   Drawing a round.
   ---------------------------------------------------------------------- */

const pick = (list, rng) => list[Math.floor(rng() * list.length)];

// n distinct entries. Rejection on a Map rather than a shuffle: the pool is
// usually four figures and n is 2 or 4, so drawing until they differ is a
// handful of tries and does not touch the rest.
function sample(pool, n, rng) {
  const chosen = new Map();
  while (chosen.size < n) {
    const p = pick(pool, rng);
    chosen.set(p.slug, p);
  }
  return [...chosen.values()];
}

// The smallest gap that still counts as a question.
//
// Measured over 200k random default-form pairs before this was chosen: ties are
// 1.2% on BST and 2.5% on Speed, and another ~10% of single-stat pairs land
// within five points. A tie has no correct answer at all and MUST be rejected;
// a two-point gap has one, but nobody can be expected to know it, so it is a
// coin flip wearing a question's clothes.
//
// BST's floor is higher because its range is: five points out of a 175–1125
// spread is proportionally nothing, where five points of Speed is a real
// difference people actually remember.
const MARGIN_FLOOR = { bst: 5, stat: 3 };
const floorFor = (stat) =>
  stat === "bst" ? MARGIN_FLOOR.bst : MARGIN_FLOOR.stat;

// How many draws before settling for the tightest acceptable round found so far.
// It is a bound rather than a target: at the measured rejection rates the first
// or second draw is almost always fine, and this only exists so a narrow pool —
// which the setup panel can now produce (D-096) — cannot spin forever.
const MAX_DRAWS = 200;

/**
 * One round: `n` Pokémon, one stat, exactly one winner.
 *
 * Returns `{ stat, asof, contenders, values, winner, margin }`, where `values`
 * is parallel to `contenders` and `winner` is the entry itself.
 *
 * **The stat is drawn once and the contenders are redrawn.** Redrawing both
 * together would let the rejection rule quietly bias which stats get asked — a
 * stat whose spread produces tight pairs would come up less often, which is not
 * a rule anybody chose. So the round decides what it is asking about, then
 * looks for a pair worth asking it of.
 *
 * **Deliberately no cap on how easy a round can be.** Rejecting wide gaps was
 * considered and dropped: 21–38% of pairs are more than 50 apart, and a game
 * that never lets you win easily is exhausting rather than rigorous.
 *
 * Returns `null` when the settings cannot produce a question — too few Pokémon
 * to seat the round, or a pool so narrow that every draw ties. That is a real
 * state now that the filters can be narrowed by hand, so the arena renders it
 * rather than assuming it away.
 */
export function higherQuestion(settings = DEFAULT_SETTINGS, rng = Math.random) {
  const { n = 2, asof = null } = settings;
  const pool = poolFor(settings);
  if (pool.length < n) return null;

  const stats = resolveStats(settings.stats ?? [], asof);
  const key = pick(stats, rng);
  const floor = floorFor(key);
  let best = null;

  for (let draw = 0; draw < MAX_DRAWS; draw++) {
    const contenders = sample(pool, n, rng);
    const values = contenders.map((p) => statValue(eraView(p, asof), key));
    const ranked = [...values].sort((a, b) => b - a);
    const margin = ranked[0] - ranked[1];

    // A tie for first is not a hard round, it is a broken one: two right
    // answers and the game can only accept one. Never returned, at any margin.
    if (margin === 0) continue;

    const round = {
      stat: key,
      asof,
      contenders,
      values,
      winner: contenders[values.indexOf(ranked[0])],
      margin,
    };
    if (margin >= floor) return round;
    // Knowable but tight. Kept only in case the floor is never cleared, so a
    // narrow pool still plays rather than rendering nothing.
    best ??= round;
  }
  return best;
}

/* -------------------------------------------------------------------------
   The session.

   Score, streak and best-this-session are LOCAL state on the page, not URL
   state (D-092) — a play-through is not a view. The arithmetic still lives
   here, because it is pure, it is the part worth testing, and the type game
   reuses it unchanged.
   ---------------------------------------------------------------------- */

export const NEW_SESSION = { asked: 0, correct: 0, streak: 0, best: 0 };

/**
 * The session after one answer. `best` is the longest streak this session has
 * reached, so it survives the break that ends the streak itself — which is the
 * only reason to keep both numbers.
 */
export function scoreAnswer(session, wasCorrect) {
  const streak = wasCorrect ? session.streak + 1 : 0;
  return {
    asked: session.asked + 1,
    correct: session.correct + (wasCorrect ? 1 : 0),
    streak,
    best: Math.max(session.best, streak),
  };
}

/* -------------------------------------------------------------------------
   URL <-> settings. The SETTINGS are the view and live in the URL (D-022);
   the round and the score do not (D-092). Defaults are omitted, so the
   resting state is a clean /games/higher.
   ---------------------------------------------------------------------- */

/**
 * The settings named by the URL, fully resolved — `stats` always comes back as
 * a concrete list rather than a "null means all" sentinel, so no consumer has
 * to know the difference.
 *
 * Anything unrecognised, or impossible at the generation being read, degrades
 * to its default rather than throwing — the same forgiving parse as `parseView`,
 * `parseAsOf` and `parseTypes`.
 */
export function parseHigher(searchParams) {
  const rawAsOf = Number(searchParams.get("asof"));
  // The newest generation is the current view, spelled as no parameter at all —
  // one state rather than two that can disagree. Same rule as parseAsOf.
  const asof =
    Number.isInteger(rawAsOf) && rawAsOf >= 1 && rawAsOf < CURRENT_GEN
      ? rawAsOf
      : null;

  const rawN = Number(searchParams.get("n"));
  const n = CONTENDER_COUNTS.includes(rawN) ? rawN : 2;

  // Split by hand rather than through `parseList`, because that drops anything
  // outside the canonical list — and `spAtk` under a Gen 1 lens is not outside
  // it, it is `special` under another name. `resolveStats` does the mapping.
  const requestedStats = (searchParams.get("stats") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    n,
    stats: resolveStats(requestedStats, asof),
    // The dex's own parser, on the dex's own parameter names (D-096).
    gens: parseList(searchParams.get("gen"), generationsFor(asof)),
    types: parseList(searchParams.get("type"), typesFor(asof)),
    includeForms: searchParams.get("forms") === "1",
    asof,
  };
}

/**
 * The canonical URL for a settings object. Every parameter is omitted at its
 * default and every list is in canonical order, so the same game always
 * produces the same string however its chips were clicked.
 *
 * That canonicalness is load-bearing beyond the address bar: `settingsKey`
 * below is this string, and it is what the saved best streak is filed under
 * (D-098). Two ways of writing the same game would be two records.
 */
export function higherUrl(settings = DEFAULT_SETTINGS) {
  const qs = settingsKey(settings);
  return qs ? `/games/higher?${qs}` : "/games/higher";
}

export function settingsKey({
  n = 2,
  stats = [],
  gens = [],
  types = [],
  includeForms = false,
  asof = null,
} = {}) {
  const params = new URLSearchParams();
  if (n !== 2) params.set("n", String(n));
  // `stats` is always a canonical-order subset, so equal length is equal list.
  if (stats.length !== statsFor(asof).length)
    params.set("stats", stats.join(","));
  if (gens.length) params.set("gen", gens.join(","));
  if (types.length) params.set("type", types.join(","));
  if (includeForms) params.set("forms", "1");
  if (asof != null) params.set("asof", String(asof));
  return params.toString();
}
