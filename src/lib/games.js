// The stat game, Higher: who can be drawn, how a round is dealt, session
// scoring, and the URL that names a game.
//
// It asks the questions the tools answer, using the same engines, so every
// round ends with a link back to the tool that would have answered it.
//
// Pure functions over plain data, with no React and no DOM, so they're tested
// directly in games.test.js. Every generator takes an `rng`, defaulting to
// Math.random, so a test can deal a known round.
import {
  ACROSS_THE_SPLIT,
  SORT_LONG_LABEL,
  filterRows,
  generationsFor,
  parseList,
  statKeysFor,
  toggleIn,
  typesFor,
} from "./dexTable";
import { CURRENT_GEN, eraView } from "./eras";
import { ALL_POKEMON } from "./pokemon";

/* -------------------------------------------------------------------------
   Settings: what the setup panel edits, and what the URL carries.

   One game with knobs rather than modes: "who moves first" is
   `stats: [speed], n: 4`, not a code path of its own. The knobs are the dex's
   filters, with the same parameter names and the same parser, so
   `?type=fire,water` means the same thing on both pages.
   ---------------------------------------------------------------------- */

// Two or four: two is the comparison the site is built on, and four is a
// doubles lead. Any other count is the same question with more scrolling.
export const CONTENDER_COUNTS = [2, 4];

// A pool this small still plays, but repeats itself within a few rounds, so the
// setup panel warns about it.
export const SMALL_POOL = 12;

// The stats a game can ask about at `asof`, in display order, with BST last.
// A Gen 1 game gets Special instead of Sp. Atk and Sp. Def, as the dex's
// columns do.
export const statsFor = (asof) => [...statKeysFor(asof), "bst"];

// The full name, for the prompt and for screen readers: "Sp. Attack" rather
// than the "SpA" column header.
export const statName = (stat) => SORT_LONG_LABEL[stat];

/**
 * The settings a bare `/games/higher` means. A function of `asof`, because
 * "every stat" is a different list under a Gen 1 lens. `DEFAULT_SETTINGS` is
 * today's.
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
 * The three presets on the start screen. Each is a shortcut to settings the
 * setup panel can also reach, so a preset can't mean anything the filters
 * can't express.
 */
export const HIGHER_PRESETS = [
  {
    id: "easy",
    label: "Easy",
    blurb: "Two Pokémon, base stat total.",
    settings: { ...DEFAULT_SETTINGS, n: 2, stats: ["bst"] },
  },
  {
    id: "medium",
    label: "Medium",
    blurb: "Two Pokémon, any stat.",
    settings: DEFAULT_SETTINGS,
  },
  {
    id: "hard",
    label: "Hard",
    blurb: "Four Pokémon, any stat.",
    settings: { ...DEFAULT_SETTINGS, n: 4 },
  },
];

/**
 * The stats a lens can hold. A stat across the Gen 1 Special split maps to its
 * counterpart, and an empty list means every stat.
 *
 * Empty means all here, unlike the dex's filters, because the stats are what
 * the game asks about, and "ask me about nothing" isn't a game. It also lets
 * the setup panel light every chip by default and keep the URL clean.
 */
export function resolveStats(wanted, asof) {
  const options = statsFor(asof);
  const picked = new Set();
  for (const stat of wanted) {
    if (options.includes(stat)) picked.add(stat);
    else {
      // Sp. Atk and Sp. Def map to Gen 1's Special and back, so a drill on
      // either survives switching the lens instead of resetting to every stat.
      const mapped = ACROSS_THE_SPLIT[stat];
      if (mapped && options.includes(mapped)) picked.add(mapped);
    }
  }
  return picked.size ? options.filter((s) => picked.has(s)) : options;
}

/**
 * Switches the generation, re-reading each list the way the URL parse does.
 * So clicking a generation chip and editing the URL land in the same state,
 * and no control emits a setting the page would drop on arrival.
 *
 * Each list is rebuilt in canonical order rather than filtered in place, so a
 * list handed over out of order can't produce a URL that parses back into
 * different settings.
 */
export const setAsOf = (settings, asof) => ({
  ...settings,
  asof,
  stats: resolveStats(settings.stats, asof),
  gens: generationsFor(asof).filter((g) => settings.gens.includes(g)),
  types: typesFor(asof).filter((t) => settings.types.includes(t)),
});

/** Adds or removes one stat. Removing the last one is refused: see `resolveStats`. */
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

// Types and generations toggle the way the dex's do.
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
 * Who can be drawn, through the dex's own filter. It caps on the generation a
 * Pokémon was introduced in, so no Alolan form turns up in a Gen 3 game. It
 * hides alternate forms by default. And it matches types against the era's
 * typing, so a Gen 5 game filtered to Fairy is correctly empty.
 */
export const poolFor = ({
  gens = [],
  types = [],
  includeForms = false,
  asof = null,
} = {}) => filterRows(ALL_POKEMON, { gens, types, includeForms, asof });

// One stat from an era view. BST is a field of its own rather than a key in
// `stats`, so that difference is handled here, once.
export const statValue = (view, stat) =>
  stat === "bst" ? view.bst : view.stats[stat];

/* -------------------------------------------------------------------------
   Dealing a round.
   ---------------------------------------------------------------------- */

const pick = (list, rng) => list[Math.floor(rng() * list.length)];

// n distinct entries, drawn until they differ rather than by shuffling: the
// pool is usually large and n is 2 or 4, so it takes a handful of tries.
function sample(pool, n, rng) {
  const chosen = new Map();
  while (chosen.size < n) {
    const p = pick(pool, rng);
    chosen.set(p.slug, p);
  }
  return [...chosen.values()];
}

// The smallest gap that still counts as a question. A tie has no right answer
// and is always redrawn. A two-point gap has one, but nobody could be expected
// to know it.
//
// Measured over 200,000 random default-form pairs: ties are 1.2% on BST and
// 2.5% on Speed, and about 10% of single-stat pairs land within five points.
// BST's floor is higher because its range is: five points in a spread of 175
// to 1,125 is nothing, where five points of Speed is a real difference.
const MARGIN_FLOOR = { bst: 5, stat: 3 };
const floorFor = (stat) =>
  stat === "bst" ? MARGIN_FLOOR.bst : MARGIN_FLOOR.stat;

// Draws before settling for the closest round found. At the measured rates the
// first or second draw almost always clears the floor, so this only stops a
// narrow pool from spinning forever.
const MAX_DRAWS = 200;

/**
 * The round a given lineup produces on a given stat. Home's preview uses it
 * with two fixed Pokémon, so its winner comes from the game's own arithmetic.
 *
 * `values` is parallel to `contenders`, `winner` is the entry itself, and
 * `margin` is the gap between first and second. `types` is each contender's
 * typing in the same generation as its stats, so a Gen 1 round shows Clefairy
 * as Normal, not Fairy.
 */
export function roundFor(contenders, stat, asof = null) {
  const views = contenders.map((p) => eraView(p, asof));
  const values = views.map((view) => statValue(view, stat));
  const ranked = [...values].sort((a, b) => b - a);
  return {
    stat,
    asof,
    contenders,
    values,
    types: views.map((view) => view.types),
    winner: contenders[values.indexOf(ranked[0])],
    margin: ranked[0] - ranked[1],
  };
}

/**
 * Whether `higherQuestion` would deal this round rather than redraw it. Home's
 * preview pins its contenders, and this holds them to the game's own bar.
 */
export const isPlayableRound = (round) =>
  !!round && round.margin >= floorFor(round.stat);

/**
 * One round: `n` Pokémon, one stat, exactly one winner.
 *
 * The stat is drawn once, and only the contenders are redrawn. Redrawing both
 * would quietly ask less often about stats whose spread produces close pairs.
 *
 * There's no cap on how easy a round can be: 21 to 38% of pairs are more than
 * 50 apart, and a game that never lets you win easily is exhausting.
 *
 * Returns `null` when the settings can't produce a question: too few Pokémon,
 * or a pool so narrow that every draw ties.
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
    const round = roundFor(sample(pool, n, rng), key, asof);

    // A tie for first has two right answers and the game accepts one, so it's
    // never dealt.
    if (round.margin === 0) continue;

    if (round.margin >= floor) return round;
    // Close but answerable. Kept in case nothing clears the floor, so a narrow
    // pool still plays.
    best ??= round;
  }
  return best;
}

/* -------------------------------------------------------------------------
   The session.

   Score and streak live in the page's state, not the URL: a play-through isn't
   a view. The arithmetic is here because it's pure and worth testing, and the
   type game uses it too.
   ---------------------------------------------------------------------- */

export const NEW_SESSION = { asked: 0, correct: 0, streak: 0, best: 0 };

/**
 * The session after one answer. `best` is the longest streak this session, so
 * it survives the miss that ends the streak.
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
   The URL. The settings live in it, and the round and the score don't.
   Defaults are left out, so the resting state is a clean /games/higher.
   ---------------------------------------------------------------------- */

/**
 * The settings a URL names, fully resolved: `stats` is always a concrete list,
 * never "empty means all", so no consumer has to know the difference.
 *
 * Anything unrecognised, or impossible in the generation being read, falls
 * back to its default rather than throwing, as the dex's parser does.
 */
export function parseHigher(searchParams) {
  const rawAsOf = Number(searchParams.get("asof"));
  // Today's generation is written as no parameter at all, so there's only one
  // way to write it.
  const asof =
    Number.isInteger(rawAsOf) && rawAsOf >= 1 && rawAsOf < CURRENT_GEN
      ? rawAsOf
      : null;

  const rawN = Number(searchParams.get("n"));
  const n = CONTENDER_COUNTS.includes(rawN) ? rawN : 2;

  // Split by hand rather than with `parseList`, which would drop `spAtk` under
  // a Gen 1 lens. It isn't invalid there: it's Special under another name, and
  // `resolveStats` maps it.
  const requestedStats = (searchParams.get("stats") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    n,
    stats: resolveStats(requestedStats, asof),
    gens: parseList(searchParams.get("gen"), generationsFor(asof)),
    types: parseList(searchParams.get("type"), typesFor(asof)),
    includeForms: searchParams.get("forms") === "1",
    asof,
  };
}

/**
 * The marker that says a game has been chosen, for the one settings object
 * that writes no parameters: Medium is the defaults, and defaults stay out of
 * the URL. Without it, choosing Medium would give a bare `/games/higher`, which
 * shows the start screen, so a reload or a copied link would lose the game.
 *
 * It's written only when nothing else is, and kept out of `settingsKey`, which
 * files the saved best streak: adding it there would orphan every existing
 * record.
 */
export const PLAY_PARAM = "play";

// Every parameter either game reads. Only these count as choosing a game, so a
// shared link carrying something else, like `?utm_source=linkedin`, still
// opens on the start screen.
const GAME_PARAMS = new Set([
  PLAY_PARAM,
  "n",
  "stats",
  "gen",
  "type",
  "forms",
  "asof",
  "tier",
]);

/**
 * Whether a URL names a game rather than asking for one. Accepts a search
 * string or a `URLSearchParams`, because the pages hold one and `Layout` holds
 * the other.
 */
export const hasChosenGame = (search) =>
  [...new URLSearchParams(search).keys()].some((k) => GAME_PARAMS.has(k));

/**
 * The URL for a settings object: every parameter left out at its default and
 * every list in canonical order, so the same game always gives the same
 * string, however its chips were clicked. That matters beyond the address bar:
 * `settingsKey` is this string, and the saved best streak is filed under it,
 * so two spellings of one game would be two records.
 */
export function higherUrl(settings = DEFAULT_SETTINGS) {
  const qs = settingsKey(settings);
  return `/games/higher?${qs || PLAY_PARAM}`;
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
  // `stats` is always a canonical-order subset, so equal length means the same
  // list.
  if (stats.length !== statsFor(asof).length)
    params.set("stats", stats.join(","));
  if (gens.length) params.set("gen", gens.join(","));
  if (types.length) params.set("type", types.join(","));
  if (includeForms) params.set("forms", "1");
  if (asof != null) params.set("asof", String(asof));
  return params.toString();
}
