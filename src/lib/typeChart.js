// Type effectiveness, as it's been since Gen 6 brought Fairy. Each attacking
// type lists only the defending types it doesn't hit for 1×, and anything
// unlisted is 1×. The grid on /types draws it the same way, leaving 1× cells
// empty, so the exceptions are what you see. It's fixed, canonical data, so
// it's written out by hand.
//
// Exported so a test can check its keys match TYPES in lib/types.js exactly:
// two hand-kept lists of the 18 types would drift apart.
//
// The import below names its .js extension, like pokemonCodec's, because
// scripts/*.mjs load this module under plain Node to check it against PokéAPI.
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
   The chart as it was. Reading a Pokémon at an earlier generation but scoring
   it on today's chart would mix Gen 1 typings with Gen 9 maths, so the chart
   follows the generation too.

   Only three charts have ever existed, and they differ little: Gen 1, Gens 2
   to 5, and Gen 6 on (`CHART` above). `until` means what it does in the
   dataset's stat and type eras: the last generation those values applied in.
   ---------------------------------------------------------------------- */

// Dark and Steel arrived in Gen 2, and Fairy in Gen 6. The other fifteen have
// always existed. A type that doesn't exist yet isn't part of any matchup, which
// is what lets most rows carry over unchanged: Fire's row today mentions Steel,
// but in Gen 1 that entry can never be reached.
export const TYPE_INTRODUCED_IN = { dark: 2, steel: 2, fairy: 6 };

export const typeExistsIn = (type, gen) =>
  gen == null || (TYPE_INTRODUCED_IN[type] ?? 1) <= gen;

// The types that existed at `gen`, in canonical order: 15 in Gen 1, 17 through
// Gen 5, and 18 since. So a Gen 1 chart is a 15×15 grid rather than an 18×18
// one with three empty rows and columns.
export const typesIn = (gen) => TYPES.filter((t) => typeExistsIn(t, gen));

// Only the attacking rows that really differ, once types that didn't exist yet
// are set aside: four in Gen 1, and two in Gens 2 to 5. Whole rows rather than
// cell patches, because a patch can't express a relation that's simply absent:
// in Gen 1, Fire doesn't resist Ice.
//
// Taken from PokéAPI's `past_damage_relations` rather than typed in, and
// `npm run build:data` checks both these rows and `CHART` against it.
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
      // Ghost did nothing to Psychic: the famous Gen 1 bug, and what the games
      // actually did.
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

// The multiplier of one attacking type against a defender's full typing, the
// product over each defending type (0, ¼, ½, 1, 2, or 4), on the chart in
// force at `gen`.
//
// `ability` is the defender's, and applies on top of the chart: Ground into an
// Electric type is 2×, and Levitate takes it to 0×. It comes last rather than
// being a special case in the product because that's how it works in the
// games: the types multiply, then the ability changes the result. No ability,
// or one with no type effect, leaves the chart's answer as it is.
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

// An attacker against a defender: each of the attacker's types is a move type
// that gets the same-type bonus. Returns [{ type, mult, baseMult, via }] for
// each. The first two arguments are anything with a `types` array, a dataset
// entry or an era view of one, and `ability` is the defender's.
//
// `via` is the ability slug only when it changed the answer, and null
// otherwise. That's everything the chip needs to show the correction (2̶×̶ 0×,
// "via Levitate"), so no component works it out again.
export function stabMatchup(attacker, defender, gen = null, ability = null) {
  return attacker.types.map((type) => {
    const baseMult = effectiveness(type, defender.types, gen);
    const mult = effectiveness(type, defender.types, gen, ability);
    return { type, mult, baseMult, via: mult === baseMult ? null : ability };
  });
}

// ⅛× needs an ability: a defender that already resists twice, whose ability
// halves again. Four entries reach it: Dewgong, Spheal, Sealeo, and Walrein are
// Water/Ice with Thick Fat as their first ability, so Ice into them is ¼ × ½,
// and that's their default reading. Without a label here it would print a raw
// "0.125×".
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
