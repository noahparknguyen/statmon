// Effective — the type game: an attacking type against a defender, name the
// multiplier (D-104).
//
// The second game, and the one lib/typeChart.js was always going to carry. It
// asks the question /types answers, in the units /types answers it in — the
// multiplier ladder, through `formatMult` and `MULT_ORDER`, so a player learns
// the vocabulary the rest of the site speaks.
//
// Pure functions over plain data, no React, no DOM, unit-tested directly — the
// same split as lib/games.js, lib/dexTable.js and lib/typeView.js. Randomness is
// injected, for the same two reasons: a test can pin a round, and a daily seeded
// puzzle would be a caller rather than a rewrite.
import { abilitiesAsOf } from "./abilities";
import { filterRows, generationsFor, parseList, typesFor } from "./dexTable";
import { CURRENT_GEN, eraView } from "./eras";
import { ALL_POKEMON } from "./pokemon";
import { affectsTypes } from "./abilities";
import { effectiveness, typesIn } from "./typeChart";
import { MULT_ORDER } from "./typeView";

/* -------------------------------------------------------------------------
   The three tiers.

   One at a time, not a mix. That is what makes the answer buttons a property
   of the TIER rather than of the round: they are computed once from the
   settings, they stay put all session, and so they can never leak anything
   about the question in front of you (D-104).
   ---------------------------------------------------------------------- */

export const TIERS = ["easy", "medium", "hard"];

export const TIER_LABEL = { easy: "Easy", medium: "Medium", hard: "Hard" };

// Shown under the tier chips, for the selected one. A chip cannot carry this
// and a difficulty name does not explain itself.
export const TIER_DESC = {
  easy: "One attacking type against one defending type — a single row of the chart.",
  medium:
    "A dual type. Two rows of the chart, multiplied — where 4× and ¼× live.",
  hard: "A Pokémon. Its typing is yours to remember, and its ability is on the card.",
};

// Only Hard draws from the dex, so only Hard has a pool to narrow. In the other
// two tiers a generation filter and a forms toggle are controls that do
// nothing, and the URL should not carry them either.
export const usesPool = (tier) => tier === "hard";

export const DEFAULT_SETTINGS = {
  tier: "easy",
  types: [],
  gens: [],
  includeForms: false,
  asof: null,
};

/**
 * The three ways in (D-108) — which here are just the tiers, since the tier IS
 * the difficulty. Presets are settings rather than modes, so each is a state
 * the setup panel could also reach by hand.
 */
export const EFFECTIVE_PRESETS = TIERS.map((tier) => ({
  id: tier,
  label: TIER_LABEL[tier],
  blurb: TIER_DESC[tier],
  settings: { ...DEFAULT_SETTINGS, tier },
}));

/* -------------------------------------------------------------------------
   The question space.

   Everything below derives from ONE enumeration: the defenders a settings
   object admits, and the attackers that existed at its generation. The answer
   buttons and the generator both read it, which is the point — a button can
   never offer an answer the generator cannot produce, because both are the
   same list.
   ---------------------------------------------------------------------- */

/**
 * Every defender this settings object can ask about, as
 * `{ types, pokemon, ability }`.
 *
 * `types` filters the DEFENDER in all three tiers, on the dex's own rule — the
 * typing must contain at least one selected type, OR within the group (D-040).
 * That makes one control mean one thing across tiers: in Easy it picks the
 * defending type, in Medium it requires a pairing to include it, and in Hard it
 * is `filterRows`' own type filter, unchanged.
 */
export function defendersFor({
  tier = "easy",
  types = [],
  gens = [],
  includeForms = false,
  asof = null,
} = {}) {
  const pool = typesIn(asof);
  const wanted = (t) => types.length === 0 || types.includes(t);

  if (tier === "easy") {
    return pool.filter(wanted).map((t) => ({
      types: [t],
      pokemon: null,
      ability: null,
    }));
  }

  if (tier === "medium") {
    const out = [];
    for (let i = 0; i < pool.length; i++) {
      for (let j = i + 1; j < pool.length; j++) {
        // Unordered pairs: Water/Flying and Flying/Water are one defender, the
        // same canonicalisation `parseTypes` applies on /types.
        if (!wanted(pool[i]) && !wanted(pool[j])) continue;
        out.push({ types: [pool[i], pool[j]], pokemon: null, ability: null });
      }
    }
    return out;
  }

  // Hard. One entry per (Pokémon, ability), because the ability is part of the
  // question — Fire into Chandelure is 0× with Flash Fire and ½× with Flame
  // Body, and which one you are shown is drawn at random (D-104).
  const out = [];
  for (const p of filterRows(ALL_POKEMON, {
    types,
    gens,
    includeForms,
    asof,
  })) {
    const view = eraView(p, asof);
    const roster = abilitiesAsOf(p, asof);
    // Below Gen III nobody had abilities, and fourteen entries carry none —
    // both are states to render rather than assume away (D-073).
    if (roster.length === 0) {
      out.push({ types: view.types, pokemon: p, ability: null });
    } else {
      for (const a of roster) {
        out.push({ types: view.types, pokemon: p, ability: a.slug });
      }
    }
  }
  return out;
}

export const multOf = (attack, defender, asof = null) =>
  effectiveness(attack, defender.types, asof, defender.ability);

// A multiplier is offered as an answer only if this share of the tier's
// question space produces it.
//
// **This is a rule about diversity, not a tuning constant**, and it excludes
// exactly one thing. `⅛×` is reachable from **four Pokémon in the entire dex**
// — Dewgong, Spheal, Sealeo and Walrein, Water/Ice with Thick Fat, the D-084
// case — which is 0.009% of Hard's space. Offering it as an answer and sampling
// answers evenly would put that one family in one round in seven. The rarest
// bucket the floor KEEPS is Hard's 4× at 1.21%, clearing it by 12×, and the one
// it drops misses by 130×. Nothing sits near the line.
//
// /types still answers ⅛× (D-084 exists so that it can); the game just does not
// quiz a question with four instances.
export const ANSWER_FLOOR = 0.001;

// Built per settings and memoised, because Hard enumerates every (Pokémon,
// ability) pair against every attacker and that is not work to repeat on each
// render. Keyed by the canonical settings string, so two ways of reaching the
// same game share the entry.
const spaceCache = new Map();

function buildSpace(settings) {
  const attackers = typesIn(settings.asof);
  const defenders = defendersFor(settings);

  // Counted over a COLLAPSED key rather than over every defender, which turns
  // Hard's ~43,000 effectiveness calls into a few thousand. The collapse is
  // exact rather than approximate: `abilityMultiplier` returns the chart's
  // answer untouched for any ability with no effectiveness clause, so every
  // such ability is the same defender as no ability at all. The counts are
  // still per-defender — the weight of each collapsed group is how many
  // defenders map onto it — so the shares below remain the real draw
  // probabilities.
  const groups = new Map();
  for (const d of defenders) {
    const ability = affectsTypes(d.ability, settings.asof) ? d.ability : null;
    const key = `${d.types.join("/")}|${ability ?? ""}`;
    const seen = groups.get(key);
    if (seen) seen.weight++;
    else groups.set(key, { types: d.types, ability, weight: 1 });
  }

  const counts = new Map();
  let total = 0;
  for (const g of groups.values()) {
    for (const a of attackers) {
      const m = effectiveness(a, g.types, settings.asof, g.ability);
      counts.set(m, (counts.get(m) ?? 0) + g.weight);
      total += g.weight;
    }
  }

  const answers = MULT_ORDER.filter(
    (m) => total > 0 && (counts.get(m) ?? 0) / total >= ANSWER_FLOOR,
  );
  return { attackers, defenders, answers, counts, total };
}

export function questionSpace(settings = DEFAULT_SETTINGS) {
  const key = settingsKey(settings);
  if (!spaceCache.has(key)) spaceCache.set(key, buildSpace(settings));
  return spaceCache.get(key);
}

/**
 * The answers this settings object offers, highest first — the buttons.
 *
 * Fewer than two and there is no game to play: one button is not a question.
 * The setup panel reads this to refuse Play, the way the stat game refuses a
 * pool too small to seat a round.
 */
export const answersFor = (settings) => questionSpace(settings).answers;

export const canPlay = (settings) => answersFor(settings).length >= 2;

/* -------------------------------------------------------------------------
   Drawing a round.
   ---------------------------------------------------------------------- */

const pick = (list, rng) => list[Math.floor(rng() * list.length)];

// Bounded, like `higherQuestion`'s: at these hit rates the first or second
// defender almost always works, and this only exists so a narrow filter cannot
// spin forever.
const MAX_DRAWS = 200;

/**
 * One round: `{ tier, attack, defender, mult, baseMult, via }`.
 *
 * **The answer is picked first.** Uniform sampling is a broken quiz — 63% of
 * single-type matchups and 47% of dual ones are 1×, so "always guess 1×" beats
 * a real player. So a target multiplier is drawn from the offered set, and then
 * a question is found for it.
 *
 * The search is cheap because a defender answers eighteen questions at once:
 * draw one, score every attacker against it, and keep an attacker that lands on
 * the target. That is up to eighteen candidates per draw rather than one, which
 * is what makes this converge instead of rejection-sampling blind.
 *
 * `via` is the ability slug ONLY when it actually changed the answer, and null
 * otherwise — the same contract `stabMatchup` uses, so the verdict can render
 * the correction without recomputing anything.
 */
export function effectiveQuestion(
  settings = DEFAULT_SETTINGS,
  rng = Math.random,
) {
  const { attackers, defenders, answers } = questionSpace(settings);
  if (answers.length < 2 || defenders.length === 0) return null;

  const target = pick(answers, rng);

  for (let draw = 0; draw < MAX_DRAWS; draw++) {
    const defender = pick(defenders, rng);
    const matches = attackers.filter(
      (a) => multOf(a, defender, settings.asof) === target,
    );
    if (!matches.length) continue;

    const attack = pick(matches, rng);
    // The chart's own answer, before the defender's ability had its say. Equal
    // to `mult` in Easy and Medium, where there is no ability to have one.
    const baseMult = effectiveness(attack, defender.types, settings.asof);
    return {
      tier: settings.tier,
      asof: settings.asof,
      attack,
      defender,
      mult: target,
      baseMult,
      via: target === baseMult ? null : defender.ability,
    };
  }
  return null;
}

/* -------------------------------------------------------------------------
   URL <-> settings. The SETTINGS are the view and live in the URL (D-022);
   the round and the score do not (D-092).
   ---------------------------------------------------------------------- */

/**
 * The settings named by the URL, fully resolved. Anything unrecognised, or
 * impossible at the generation being read, degrades to its default rather than
 * throwing — the forgiving parse every reader on this site follows.
 *
 * The pool parameters are read **only in Hard**, because only Hard has a pool.
 * That is what keeps one canonical URL per game: `?tier=easy&gen=1` cannot mean
 * anything, so it is not a state you can be in.
 */
export function parseEffective(searchParams) {
  const rawAsOf = Number(searchParams.get("asof"));
  const asof =
    Number.isInteger(rawAsOf) && rawAsOf >= 1 && rawAsOf < CURRENT_GEN
      ? rawAsOf
      : null;

  const rawTier = searchParams.get("tier");
  const tier = TIERS.includes(rawTier) ? rawTier : DEFAULT_SETTINGS.tier;
  const pooled = usesPool(tier);

  return {
    tier,
    types: parseList(searchParams.get("type"), typesFor(asof)),
    gens: pooled
      ? parseList(searchParams.get("gen"), generationsFor(asof))
      : [],
    includeForms: pooled && searchParams.get("forms") === "1",
    asof,
  };
}

export function settingsKey({
  tier = "easy",
  types = [],
  gens = [],
  includeForms = false,
  asof = null,
} = {}) {
  const params = new URLSearchParams();
  if (tier !== DEFAULT_SETTINGS.tier) params.set("tier", tier);
  if (types.length) params.set("type", types.join(","));
  if (usesPool(tier)) {
    if (gens.length) params.set("gen", gens.join(","));
    if (includeForms) params.set("forms", "1");
  }
  if (asof != null) params.set("asof", String(asof));
  return params.toString();
}

export function effectiveUrl(settings = DEFAULT_SETTINGS) {
  const qs = settingsKey(settings);
  return qs ? `/games/effective?${qs}` : "/games/effective";
}

/* -------------------------------------------------------------------------
   Settings mutations. Each returns a whole new settings object through
   `normalise`, so a control can never emit a state its own page would discard
   on arrival (the D-078 rule).
   ---------------------------------------------------------------------- */

/**
 * The one definition of a valid settings object, and every mutator below
 * returns through it.
 *
 * Three separate bugs turned out to be the same bug: `setAsOf` filtered its
 * lists in place (keeping whatever order it was handed), `setTier` passed the
 * type list through untouched, and both could therefore emit a settings object
 * whose URL parsed back into a *different* object — a control writing a state
 * its own page would discard, which is the D-078 fault. Fixing them one at a
 * time was fixing the same thing three times.
 *
 * So: lists are re-derived from their canonical order rather than filtered,
 * anything the lens cannot hold is dropped, and the pool settings exist only
 * for the tier that has a pool. `parseEffective` produces exactly this shape,
 * which is what makes "the URL round-trips" a structural property rather than
 * something each mutator has to remember.
 */
function normalise({ tier, types, gens, includeForms, asof }) {
  const pooled = usesPool(tier);
  return {
    tier,
    asof,
    types: typesFor(asof).filter((t) => types.includes(t)),
    gens: pooled ? generationsFor(asof).filter((g) => gens.includes(g)) : [],
    includeForms: pooled && includeForms,
  };
}

export const setTier = (settings, tier) => normalise({ ...settings, tier });

export const setAsOf = (settings, asof) => normalise({ ...settings, asof });

const toggled = (list, value) => {
  const next = new Set(list);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return [...next];
};

// The canonical ordering is `normalise`'s job, so these only have to say what
// changed — the reason that rule lives in one place.
export const toggleType = (settings, type) =>
  normalise({ ...settings, types: toggled(settings.types, type) });

export const toggleGen = (settings, gen) =>
  normalise({ ...settings, gens: toggled(settings.gens, gen) });
