// Abilities: the list a Pokémon can have, and the few that change what a type
// does to it.
//
// Only half of this comes from PokéAPI:
//
//   · The roster is data: `pokemon.abilities` and `pokemon.past_abilities`, in
//     the same `until` shape as the stat and type eras, so it's stored in the
//     dataset and resolved here.
//   · The effects are prose only. Levitate's entry says "Evades Ground moves.",
//     and no structured field says "immune to Ground". So the table below is
//     written by hand, like the type chart, but unlike the chart it can't be
//     checked against PokéAPI's damage relations. `npm run build:data` checks
//     that every key is a real ability some Pokémon has, and abilities.test.js
//     guards what each one does.
//
// The import below names its .js extension because scripts/build-data.mjs
// loads this module under plain Node. For the same reason this file imports no
// dataset: everything here takes its Pokémon as an argument.
import { titleCase } from "./pokemonCodec.js";

// Abilities arrived in Gen 3. PokéAPI doesn't say so: it gives Pikachu's Static
// no past record at all, which would read as Pikachu having Static in Red and
// Blue. So it's stated here, and it's what makes a Gen 1 or 2 board show no
// abilities.
export const ABILITIES_FROM_GEN = 3;

// Hidden abilities arrived in Gen 5. PokéAPI usually records a hidden slot as
// empty before then, but not when the hidden ability was later replaced: Zapdos
// is stored as one record, `{until: 5, slots: {3: "lightning-rod"}}`. Read
// literally, that gives Zapdos a hidden ability in Gen 3, and makes a Gen 3
// Suicune immune to Water. So this is stated here too.
export const HIDDEN_FROM_GEN = 5;

/* -------------------------------------------------------------------------
   The effect table.

   An ability is in it when its effect can be written as attacking type →
   multiplier, using the chart's own values (0, ¼, ½, 1, 2, 4). Anything else
   needs a damage calculator, a much bigger feature. Three things that look
   like omissions follow from that rule:

     · Move properties aren't types. Wind Rider makes its holder immune to
       wind moves like Tailwind, not to Flying-type ones, and Fluffy halves
       contact moves. Like Bulletproof, Soundproof, and Queenly Majesty, those
       are out. Fluffy is in for its other clause: it doubles Fire, which is a
       type relation.
     · Multipliers off the chart's scale are out. Dry Skin's Fire ×1.25, and
       the ×0.75 of Filter, Solid Rock, and Prism Armor, would make tiers like
       2.5× that have no row and no label. Dry Skin's Water immunity is in, and
       only its Fire clause is dropped.
     · Wonder Guard is the one exception, a rule over the final multiplier
       rather than a per-type map: see `all` below.
   ---------------------------------------------------------------------- */

// `types` multiplies whatever the chart already gives, per attacking type: 0
// cancels it, ½ halves it, and 2 doubles it. Multiplying rather than replacing
// is what makes Thick Fat right: Fire into a Grass type is already 2×, and
// Thick Fat takes it to 1×, not ½×.
//
// `since` is the first generation the effect worked this way, defaulting to
// Gen 3. The era roster doesn't cover it: Rhyhorn and Electrike have had
// Lightning Rod since Gen 3, and Gastrodon Storm Drain since Gen 4, but both
// abilities only redirected attacks until Gen 5. Without it, a Gen 3 board
// would claim an immunity that generation didn't have.
const eff = (types, since = ABILITIES_FROM_GEN) => ({ types, since });

export const ABILITY_EFFECTS = {
  /* Immunities. */
  levitate: eff({ ground: 0 }),
  "flash-fire": eff({ fire: 0 }),
  "water-absorb": eff({ water: 0 }),
  "volt-absorb": eff({ electric: 0 }),
  "sap-sipper": eff({ grass: 0 }),
  "earth-eater": eff({ ground: 0 }),
  "well-baked-body": eff({ fire: 0 }),
  "motor-drive": eff({ electric: 0 }),
  // Dry Skin also takes 1.25× from Fire, which the chart has no room for.
  "dry-skin": eff({ water: 0 }),
  // Both only redirected attacks until Gen 5, when they became immunities.
  "lightning-rod": eff({ electric: 0 }, 5),
  "storm-drain": eff({ water: 0 }, 5),

  /* Resistances, and one weakness. */
  "thick-fat": eff({ fire: 0.5, ice: 0.5 }),
  heatproof: eff({ fire: 0.5 }),
  "water-bubble": eff({ fire: 0.5 }),
  "purifying-salt": eff({ ghost: 0.5 }),
  // The only entry that makes its holder worse off: this table isn't a list of
  // advantages.
  fluffy: eff({ fire: 2 }),

  /* Weather abilities. Each fits the rule and belongs to one Pokémon with one
     ability. Delta Stream cancels the Flying type's three weaknesses, and these
     halves are only right because it exists on nothing but a Flying type,
     Mega Rayquaza. */
  "delta-stream": eff({ electric: 0.5, ice: 0.5, rock: 0.5 }, 6),
  "primordial-sea": eff({ fire: 0 }, 6),
  "desolate-land": eff({ water: 0 }, 6),

  /* The exception: a rule over the final multiplier rather than a map. Any
     attack that isn't super effective does nothing. */
  "wonder-guard": { all: (mult) => (mult > 1 ? mult : 0), since: 3 },
};

// Whether an ability changes type effectiveness at `gen`, which the ability
// chip's marker announces. The generation matters: Storm Drain only redirected
// until Gen 5, so on a Gen 4 board the marker would promise a change the board
// doesn't make. It depends on the ability and the generation, not on what's
// selected, so the marker doesn't flicker as chips are clicked.
export const affectsTypes = (slug, gen = null) => {
  const entry = slug == null ? null : ABILITY_EFFECTS[slug];
  return Boolean(entry) && (gen == null || gen >= entry.since);
};

/**
 * One attacking type's multiplier after the defender's ability has had its
 * say. `base` is what the era's chart already gave.
 *
 * Returns `base` unchanged for no ability, an ability with no entry, or one
 * whose effect didn't exist yet at `gen`, so every caller can pass through this
 * without checking first.
 */
export function abilityMultiplier(base, attackType, slug, gen = null) {
  const entry = ABILITY_EFFECTS[slug];
  if (!entry) return base;
  // `gen == null` is the current generation, where every effect is in force.
  if (gen != null && gen < entry.since) return base;
  if (entry.all) return entry.all(base);
  return base * (entry.types[attackType] ?? 1);
}

/* -------------------------------------------------------------------------
   The roster, as it was.
   ---------------------------------------------------------------------- */

// PokéAPI's own display names, for the slugs `titleCase` gets wrong: lowercase
// prepositions, apostrophes, an acronym, a hyphen, and As One, stored twice
// because PokéAPI splits it by its horse. Thirteen exceptions are a list, not a
// pattern, so they're written out.
//
// The guard test only catches a raw slug leaking through. It can't see a casing
// mistake like "Good As Gold", so each of these is also tested by name.
const ABILITY_NAMES = {
  "as-one-glastrier": "As One",
  "as-one-spectrier": "As One",
  "beads-of-ruin": "Beads of Ruin",
  "good-as-gold": "Good as Gold",
  "dragons-maw": "Dragon's Maw",
  "minds-eye": "Mind's Eye",
  "power-of-alchemy": "Power of Alchemy",
  "rks-system": "RKS System",
  "sword-of-ruin": "Sword of Ruin",
  "tablets-of-ruin": "Tablets of Ruin",
  "vessel-of-ruin": "Vessel of Ruin",
  "well-baked-body": "Well-Baked Body",
  "zero-to-hero": "Zero to Hero",
};

// `slug == null` is a real input: `defaultAbility` returns null for entries
// with no abilities, and a label rendered without checking would otherwise
// crash the page on `null.split`.
export const abilityLabel = (slug) =>
  slug == null ? "" : (ABILITY_NAMES[slug] ?? titleCase(slug));

/**
 * A Pokémon's abilities at `gen`, as `[{ slug, hidden }]` in slot order.
 *
 * Empty below Gen 3, and empty for the few entries with no abilities at all:
 * both are states the page has to render.
 *
 * The era records patch slots, with the usual `until` meaning (the last
 * generation the values held). This walks them oldest first against a slot map
 * that starts at today's, as `statAt` does for stats. A patched slot of `null`
 * means the slot was empty then, which is how PokéAPI records "no hidden
 * ability yet".
 */
export function abilitiesAsOf(pokemon, gen = null) {
  if (!pokemon) return [];
  if (gen != null && gen < ABILITIES_FROM_GEN) return [];

  const slots = new Map();
  pokemon.abilities.forEach((a, i) => slots.set(a.hidden ? 3 : i + 1, a.slug));
  if (gen != null && gen < HIDDEN_FROM_GEN) slots.set(3, null);

  if (gen != null) {
    // Oldest first, and the first record still in force wins, as in statAt.
    // Slot 3 is skipped below HIDDEN_FROM_GEN: a record can say which hidden
    // ability was held, never that one could be held at all.
    for (const slot of [1, 2, 3]) {
      if (slot === 3 && gen < HIDDEN_FROM_GEN) continue;
      const era = pokemon.abilityEras.find(
        (e) => e.until >= gen && slot in e.slots,
      );
      if (era) slots.set(slot, era.slots[slot]);
    }
  }

  return [1, 2, 3]
    .filter((slot) => slots.get(slot) != null)
    .map((slot) => ({ slug: slots.get(slot), hidden: slot === 3 }));
}

/**
 * The ability a board uses when the URL names none: the first in the era's
 * list. A Pokémon always has exactly one ability in play, so there's no "none"
 * state. A selection equal to this is written as no parameter at all, as
 * today's generation is.
 */
export function defaultAbility(pokemon, gen = null) {
  return abilitiesAsOf(pokemon, gen)[0]?.slug ?? null;
}

/**
 * The ability the URL names, checked against the list the board is reading.
 *
 * One this Pokémon doesn't have in this generation falls back to the default
 * rather than throwing or showing an ability it never had. That covers a stale
 * or hand-edited link, and switching to a generation before the ability
 * arrived. The other URL parsers are just as forgiving.
 */
export function resolveAbility(pokemon, gen, wanted) {
  if (!pokemon) return null;
  const roster = abilitiesAsOf(pokemon, gen);
  return roster.some((a) => a.slug === wanted)
    ? wanted
    : (roster[0]?.slug ?? null);
}

/**
 * The ability slug a URL should carry: the resolved one, or `null` when it's
 * the default and says nothing.
 *
 * Resolve first, then compare. Comparing the wanted slug with the new
 * generation's default without resolving it would write a parameter the page
 * then drops: a Gengar board switched to Gen 6 would carry Cursed Body in its
 * URL while showing Levitate. Both tools build their URLs through this.
 */
export function abilityParam(pokemon, gen, wanted) {
  const resolved = resolveAbility(pokemon, gen, wanted);
  return resolved === defaultAbility(pokemon, gen) ? null : resolved;
}
