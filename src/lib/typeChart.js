// Type effectiveness (Gen 6+ / current, includes Fairy). Attacking type → the
// defending types it deviates from 1× against. Anything unlisted is 1× — a
// shape the grid on /types renders literally, leaving 1× cells empty so the
// deviations are the thing you see (D-051).
// This is canonical, static data — safe to hardcode.
//
// Exported so a test can assert its keys match TYPES in lib/types.js exactly.
// Two hand-maintained lists of the 18 types is precisely the pair that drifts.
//
// Explicit .js extension on the import below, like pokemonCodec: scripts/*.mjs
// load this module under plain Node ESM to verify it against PokéAPI.
import { abilityMultiplier } from "./abilities.js";
import { TYPES } from "./types.js";

export const CHART = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    ice: 2,
    bug: 2,
    rock: 0.5,
    dragon: 0.5,
    steel: 2,
  },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: {
    water: 2,
    electric: 0.5,
    grass: 0.5,
    ground: 0,
    flying: 2,
    dragon: 0.5,
  },
  grass: {
    fire: 0.5,
    water: 2,
    grass: 0.5,
    poison: 0.5,
    ground: 2,
    flying: 0.5,
    bug: 0.5,
    rock: 2,
    dragon: 0.5,
    steel: 0.5,
  },
  ice: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    ice: 0.5,
    ground: 2,
    flying: 2,
    dragon: 2,
    steel: 0.5,
  },
  fighting: {
    normal: 2,
    ice: 2,
    poison: 0.5,
    flying: 0.5,
    psychic: 0.5,
    bug: 0.5,
    rock: 2,
    ghost: 0,
    dark: 2,
    steel: 2,
    fairy: 0.5,
  },
  poison: {
    grass: 2,
    poison: 0.5,
    ground: 0.5,
    rock: 0.5,
    ghost: 0.5,
    steel: 0,
    fairy: 2,
  },
  ground: {
    fire: 2,
    electric: 2,
    grass: 0.5,
    poison: 2,
    flying: 0,
    bug: 0.5,
    rock: 2,
    steel: 2,
  },
  flying: {
    electric: 0.5,
    grass: 2,
    fighting: 2,
    bug: 2,
    rock: 0.5,
    steel: 0.5,
  },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: {
    fire: 0.5,
    grass: 2,
    fighting: 0.5,
    poison: 0.5,
    flying: 0.5,
    psychic: 2,
    ghost: 0.5,
    dark: 2,
    steel: 0.5,
    fairy: 0.5,
  },
  rock: {
    fire: 2,
    ice: 2,
    fighting: 0.5,
    ground: 0.5,
    flying: 2,
    bug: 2,
    steel: 0.5,
  },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: {
    fire: 0.5,
    water: 0.5,
    electric: 0.5,
    ice: 2,
    rock: 2,
    steel: 0.5,
    fairy: 2,
  },
  fairy: {
    fire: 0.5,
    fighting: 2,
    poison: 0.5,
    dragon: 2,
    dark: 2,
    steel: 0.5,
  },
};

/* -------------------------------------------------------------------------
   The chart as it was (D-045). Reading a Pokémon at an earlier generation and
   scoring its matchup on today's chart would be a board that mixes Gen 1
   typings with Gen 9 maths, so the chart moves with the era.

   Only three charts have ever existed, and the differences are small:
   Generation 1, Generations 2–5, and Generation 6 onward (`CHART` above).
   Same `until` semantics as the dataset's stat and type eras: the last
   generation those relations applied in.
   ---------------------------------------------------------------------- */

// Dark and Steel arrived in Gen 2, Fairy in Gen 6; the other fifteen have
// always been here. A type that does not exist yet is simply not part of a
// matchup, which is what lets most rows below be inherited unchanged — Fire's
// modern row mentions Steel, but in Gen 1 that entry can never be reached.
export const TYPE_INTRODUCED_IN = { dark: 2, steel: 2, fairy: 6 };

export const typeExistsIn = (type, gen) =>
  gen == null || (TYPE_INTRODUCED_IN[type] ?? 1) <= gen;

// The types that existed at `gen`, in canonical order — 15 in Gen 1, 17 through
// Gen 5, 18 since. This is what makes a Gen 1 chart a 15×15 grid rather than an
// 18×18 one with three empty rows and columns (D-051).
export const typesIn = (gen) => TYPES.filter((t) => typeExistsIn(t, gen));

// Only the attacking rows that genuinely differ once types that did not exist
// are excluded — four in Gen 1, two in Gen 2–5. Whole rows rather than cell
// patches, because a patch cannot express a relation that is simply absent
// (Gen 1 Ice is not resisted by Fire).
//
// Derived from PokéAPI's `past_damage_relations` rather than transcribed, and
// `npm run build:data` re-verifies both these and `CHART` against it — the
// hardcode-canonical-data call of D-018, with the claim actually checked.
export const CHART_ERAS = [
  {
    until: 1,
    chart: {
      // Fire did not yet resist Ice.
      ice: { water: 0.5, ice: 0.5, flying: 2, ground: 2, grass: 2, dragon: 2 },
      // Poison and Bug were super effective on each other.
      poison: {
        poison: 0.5,
        ground: 0.5,
        rock: 0.5,
        ghost: 0.5,
        grass: 2,
        bug: 2,
      },
      bug: {
        fighting: 0.5,
        flying: 0.5,
        ghost: 0.5,
        fire: 0.5,
        grass: 2,
        psychic: 2,
        poison: 2,
      },
      // Ghost did nothing to Psychic — the famous Gen 1 bug, and what the
      // games actually did.
      ghost: { normal: 0, psychic: 0, ghost: 2 },
    },
  },
  {
    until: 5,
    chart: {
      // Steel resisted Ghost and Dark until Gen 6.
      ghost: { normal: 0, dark: 0.5, steel: 0.5, ghost: 2, psychic: 2 },
      dark: { fighting: 0.5, dark: 0.5, steel: 0.5, ghost: 2, psychic: 2 },
    },
  },
];

// The chart in force at `gen`; `null` means today.
export function chartAsOf(gen = null) {
  if (gen == null) return CHART;
  const era = CHART_ERAS.find((e) => e.until >= gen);
  return era ? { ...CHART, ...era.chart } : CHART;
}

// Multiplier of a single attacking type vs a defender's full typing (product
// over each defending type → 0, ¼, ½, 1, 2, or 4), on the chart in force at
// `gen`.
//
// `ability` is the DEFENDER's, and applies on top of the chart — Ground into an
// Electric type is 2× and Levitate takes it to 0×. It is the last word rather
// than a special case in the reduce because that is what it is mechanically:
// the type product happens, then the ability edits the result (D-073). Passing
// none, or one with no effectiveness clause, returns the chart's own answer.
export function effectiveness(
  attackType,
  defenderTypes,
  gen = null,
  ability = null,
) {
  const chart = chartAsOf(gen);
  const base = defenderTypes
    .filter((def) => typeExistsIn(def, gen))
    .reduce((mult, def) => mult * (chart[attackType]?.[def] ?? 1), 1);
  return abilityMultiplier(base, attackType, ability, gen);
}

// For an attacker vs a defender: each of the attacker's types is a STAB move
// type. Returns [{ type, mult, baseMult, via }] for each. The first two
// arguments are anything with a `types` array — a dataset entry, or an era view
// of one (lib/eras.js); `ability` is the defender's.
//
// `via` is the ability slug ONLY when it actually changed the answer, and is
// null otherwise. That is the whole of what the chip needs to render the
// correction (2̶×̶ 0×, "via Levitate"), so no component recomputes the
// comparison to find out whether there was one.
export function stabMatchup(attacker, defender, gen = null, ability = null) {
  return attacker.types.map((type) => {
    const baseMult = effectiveness(type, defender.types, gen);
    const mult = effectiveness(type, defender.types, gen, ability);
    return { type, mult, baseMult, via: mult === baseMult ? null : ability };
  });
}

// ⅛× is reachable only with an ability in play: a defender that already resists
// twice, whose ability halves again. Four entries do it — Dewgong, Spheal,
// Sealeo and Walrein are Water/Ice with **Thick Fat in slot 1**, so Ice into
// them is ¼ × ½, and it is their DEFAULT reading rather than an opt-in one.
// Without a label here it printed a raw "0.125×"; without the matching entry in
// MULT_ORDER the tier list dropped Ice from /types altogether (D-084).
const MULT_LABEL = {
  0: "0×",
  0.125: "⅛×",
  0.25: "¼×",
  0.5: "½×",
  1: "1×",
  2: "2×",
  4: "4×",
};
export const formatMult = (m) => MULT_LABEL[m] ?? `${m}×`;
