// Effective, the type game: an attacking type against a defender, and you name
// the multiplier.
//
// It asks the question /types answers, in the same units: the multiplier
// ladder, through `formatMult` and `MULT_ORDER`, so a player learns the terms
// the rest of the site uses.
//
// Pure functions over plain data, with no React and no DOM, so they're tested
// directly. Randomness is passed in, as in games.js, so a test can deal a known
// round.
import { abilitiesAsOf } from "./abilities";
import {
  filterRows,
  generationsFor,
  parseList,
  toggleIn,
  typesFor,
} from "./dexTable";
import { CURRENT_GEN, eraView } from "./eras";
import { ALL_POKEMON } from "./pokemon";
import { affectsTypes } from "./abilities";
import { effectiveness, typesIn } from "./typeChart";
import { MULT_ORDER } from "./typeView";
import { PLAY_PARAM } from "./games";

/* -------------------------------------------------------------------------
   The three tiers.

   One tier at a time, never a mix. That makes the answer buttons a property of
   the tier rather than of the round: they're worked out once from the
   settings and stay put all session, so they can never give away anything
   about the question in front of you.
   ---------------------------------------------------------------------- */

export const TIERS = ["easy", "medium", "hard"];

export const TIER_LABEL = { easy: "Easy", medium: "Medium", hard: "Hard" };

// Shown under the tier chips for the selected one, since a difficulty name
// doesn't explain itself.
export const TIER_DESC = {
  easy: "One attacking type against one defending type: a single row of the chart.",
  medium:
    "A dual type. Two rows of the chart, multiplied, which is where 4× and ¼× live.",
  hard: "A Pokémon. Its typing is yours to remember, and its ability is on the card.",
};

// Only Hard draws from the dex, so only Hard has a pool to narrow. In the other
// tiers a generation filter or a forms toggle would do nothing, so the URL
// doesn't carry them either.
export const usesPool = (tier) => tier === "hard";

export const DEFAULT_SETTINGS = {
  tier: "easy",
  types: [],
  gens: [],
  includeForms: false,
  asof: null,
};

/**
 * The three presets on the start screen, which here are just the tiers, since
 * the tier is the difficulty. Each is a state the setup panel can also reach.
 */
export const EFFECTIVE_PRESETS = TIERS.map((tier) => ({
  id: tier,
  label: TIER_LABEL[tier],
  blurb: TIER_DESC[tier],
  settings: { ...DEFAULT_SETTINGS, tier },
}));

/* -------------------------------------------------------------------------
   The question space.

   Everything below comes from one list: the defenders a settings object
   allows, and the attacking types that existed in its generation. The answer
   buttons and the generator both read it, so a button can never offer an
   answer the generator can't produce.
   ---------------------------------------------------------------------- */

/**
 * Every defender these settings can ask about, as `{ types, pokemon, ability }`.
 *
 * `types` filters the defender in all three tiers, by the dex's rule: the
 * typing must include at least one selected type. So one control means one
 * thing everywhere. In Easy it picks the defending type, in Medium it requires
 * a pairing to include it, and in Hard it's the dex's own type filter.
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
        // Unordered pairs: Water/Flying and Flying/Water are one defender, as
        // /types treats them.
        if (!wanted(pool[i]) && !wanted(pool[j])) continue;
        out.push({ types: [pool[i], pool[j]], pokemon: null, ability: null });
      }
    }
    return out;
  }

  // Hard has one entry per Pokémon and ability, because the ability is part of
  // the question: Fire into Chandelure is 0× with Flash Fire and ½× with Flame
  // Body, and which one you get is random.
  const out = [];
  for (const p of filterRows(ALL_POKEMON, {
    types,
    gens,
    includeForms,
    asof,
  })) {
    const view = eraView(p, asof);
    const roster = abilitiesAsOf(p, asof);
    // Below Gen 3 nobody had abilities, and 14 entries have none at all.
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

// An answer is offered only if at least this share of the tier's questions
// produce it.
//
// It's a rule about variety, not a tuning knob, and it drops exactly one
// answer. ⅛× comes from four Pokémon in the whole dex, Dewgong, Spheal, Sealeo,
// and Walrein (Water/Ice with Thick Fat), which is 0.009% of Hard's questions.
// Offering it, with answers drawn evenly, would put that one family in one
// round in seven. The rarest answer the floor keeps is Hard's 4× at 1.21%, 12
// times over the line, and ⅛× falls 11 times short of it, so nothing sits
// close.
//
// /types still shows ⅛×. The game just doesn't quiz something with four
// instances.
export const ANSWER_FLOOR = 0.001;

// Built per settings and cached, because Hard scores every Pokémon and ability
// against every attacking type, which is too much work to repeat on each
// render. Keyed by the canonical settings string, so two routes to the same
// game share it.
const spaceCache = new Map();

function buildSpace(settings) {
  const attackers = typesIn(settings.asof);
  const defenders = defendersFor(settings);

  // Counted over groups rather than every defender, which cuts Hard's 43,398
  // effectiveness calls to a fraction of that. Grouping is exact: an ability
  // with no type effect returns the chart's answer unchanged, so it's the same
  // defender as no ability at all. Each group's weight is how many defenders it
  // stands for, so the shares below are still the real odds.
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
 * The answers these settings offer, highest first: the buttons.
 *
 * Fewer than two means there's no game, since one button isn't a question. The
 * setup panel reads this to refuse Play, as the stat game refuses a pool too
 * small for a round.
 */
export const answersFor = (settings) => questionSpace(settings).answers;

export const canPlay = (settings) => answersFor(settings).length >= 2;

/* -------------------------------------------------------------------------
   Dealing a round.
   ---------------------------------------------------------------------- */

const pick = (list, rng) => list[Math.floor(rng() * list.length)];

// A bound, as in the stat game: at these hit rates the first or second
// defender almost always works, and this only stops a narrow filter from
// spinning forever.
const MAX_DRAWS = 200;

/**
 * One round: `{ tier, asof, attack, defender, mult, baseMult, via }`.
 *
 * The answer is picked first. Drawing questions evenly makes a broken quiz: 63%
 * of single-type matchups and 47% of dual-type ones are 1×, so always guessing
 * 1× would beat a real player. So a target multiplier is drawn from the
 * offered answers, then a question is found for it.
 *
 * The search is quick because one defender answers up to 18 questions at once:
 * draw a defender, score every attacking type against it, and keep one that
 * hits the target.
 *
 * `via` is the ability slug only when it changed the answer, and null
 * otherwise, as in `stabMatchup`, so the verdict can show the correction
 * without working anything out again.
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
    // The chart's answer before the ability had its say. The same as `mult` in
    // Easy and Medium, which have no abilities.
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
   The URL. The settings live in it, and the round and the score don't.
   ---------------------------------------------------------------------- */

/**
 * The settings a URL names, fully resolved. Anything unrecognised, or
 * impossible in the generation being read, falls back to its default rather
 * than throwing, like every other parser on the site.
 *
 * The pool parameters are read only in Hard, because only Hard has a pool.
 * That keeps one URL per game: `?tier=easy&gen=1` can't mean anything, so it
 * isn't a state you can be in.
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

// The `?play` marker is the stat game's. Both games have a preset that is the
// defaults, so both need it for a chosen game to survive a reload.
export function effectiveUrl(settings = DEFAULT_SETTINGS) {
  const qs = settingsKey(settings);
  return `/games/effective?${qs || PLAY_PARAM}`;
}

/* -------------------------------------------------------------------------
   Changing settings. Each change returns a whole new settings object through
   `normalise`, so no control can emit a state the page would drop on arrival.
   ---------------------------------------------------------------------- */

/**
 * The one definition of valid settings, which every change below returns
 * through. Lists are rebuilt in canonical order rather than filtered, anything
 * the generation can't hold is dropped, and pool settings are kept only for the
 * tier that has a pool.
 *
 * `parseEffective` produces exactly this shape, so every change survives a trip
 * through the URL by construction, rather than each function having to
 * remember to.
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

// The dex's toggleIn, then `normalise`, which also drops generations from a
// tier that has no pool.
export const toggleType = (settings, type) =>
  normalise({
    ...settings,
    types: toggleIn(typesFor(settings.asof), settings.types, type),
  });

export const toggleGen = (settings, gen) =>
  normalise({
    ...settings,
    gens: toggleIn(generationsFor(settings.asof), settings.gens, gen),
  });
