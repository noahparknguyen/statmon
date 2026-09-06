// Abilities: the roster a Pokémon can have, and the handful that change what a
// type does to it.
//
// Two halves, and only one of them comes from PokéAPI.
//
//   · **The roster** is real data — `pokemon.abilities` and `pokemon.past_abilities`
//     in the same `until` shape as the stat and type eras (02_research §13), so it
//     is stored in the dataset and resolved here.
//   · **The mechanical effect is prose only.** Levitate's entry reads "Evades
//     Ground moves." — there is no structured field anywhere on the resource
//     saying "immune to Ground". So the table below is hardcoded, the way
//     lib/typeChart.js is, and unlike the chart it cannot be re-derived from
//     `damage_relations`. `npm run build:data` verifies as much of it as is
//     verifiable (every key is a real ability slug that some Pokémon actually
//     has); the semantics are guarded by abilities.test.js instead. (D-073)
//
// Explicit .js extension on the import below, like typeChart and pokemonCodec:
// scripts/build-data.mjs loads this module under plain Node ESM. This file
// therefore imports NO dataset — everything here takes its Pokémon as an
// argument.
import { titleCase } from "./pokemonCodec.js";

// Abilities arrived in Generation III. PokéAPI does not say so — it reports
// Pikachu's Static with no `past_abilities` record at all, which would read as
// "Pikachu had Static in Red and Blue" — so this is ours to state. It is what
// makes a Gen 1 or Gen 2 board show no abilities without inventing anything.
export const ABILITIES_FROM_GEN = 3;

// Hidden abilities (the Dream World ones) arrived two generations later still.
// PokéAPI mostly says so — 540 of its 568 past records are a slot 3 that was
// empty then — but **not when the hidden slot was later replaced**: Zapdos is
// stored as one record, `{until: 5, slots: {3: "lightning-rod"}}`, and reading
// that literally hands it a hidden ability in Generation III. Twenty-one
// entries were affected and five of them bend a matchup, which is how a Gen 3
// Suicune ended up immune to Water. Same class of fact as the line above, and
// ours to state for the same reason.
export const HIDDEN_FROM_GEN = 5;

/* -------------------------------------------------------------------------
   The effect table.

   **The rule that decides membership**: an ability is in here when its effect
   is expressible as `defending type → multiplier` within the chart's own
   vocabulary (0, ¼, ½, 1, 2, 4). Everything else is a damage calculator, which
   is a different and much larger feature. Three consequences worth writing
   down, because each looks like an omission:

     · **Move properties are not types.** Wind Rider grants immunity to *wind*
       moves (Tailwind, Bleakwind Storm), not to Flying-type ones, and Fluffy
       halves *contact* moves. Same category as Bulletproof, Soundproof and
       Queenly Majesty: none of them are in. (02_research §13 listed Wind Rider
       as a candidate; it was wrong, and is corrected there.) Fluffy is in for
       its other clause only — it doubles Fire, which IS a type relation.
     · **Off-vocabulary multipliers are not in.** Dry Skin's Fire ×1.25 and
       Filter / Solid Rock / Prism Armor's ×0.75 would produce a 2.5× tier that
       has no row in MULT_ORDER and no label in formatMult. Dry Skin's Water
       immunity is in; only its Fire clause is dropped.
     · **Wonder Guard is the one exception**, and it is a rule over the final
       product rather than a per-type map — see `all` below.
   ---------------------------------------------------------------------- */

// `types` is the per-attacking-type multiplier, applied to whatever the chart
// already produced: 0 zeroes it, ½ halves it, 2 doubles it. Multiplying rather
// than overriding is what makes Thick Fat correct — Fire into a Grass type is
// already 2×, and Thick Fat takes it to 1×, not to ½×.
//
// `since` is the first generation the effect worked as described, and defaults
// to when abilities existed at all. It is not redundant with the era-resolved
// roster: Rhyhorn and Electrike have carried Lightning Rod in an ordinary slot
// since Gen 3, and Gastrodon has had Storm Drain since Gen 4, but neither
// ability became an immunity until Gen 5 — before that they merely redirected.
// Two abilities need it, and both would otherwise make a Gen 3 board claim an
// immunity that generation did not have.
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
  // Redirection only until Generation V, when both gained the immunity.
  "lightning-rod": eff({ electric: 0 }, 5),
  "storm-drain": eff({ water: 0 }, 5),

  /* Resistances, and one weakness. */
  "thick-fat": eff({ fire: 0.5, ice: 0.5 }),
  heatproof: eff({ fire: 0.5 }),
  "water-bubble": eff({ fire: 0.5 }),
  "purifying-salt": eff({ ghost: 0.5 }),
  // The only entry that makes its holder WORSE off, and a useful reminder that
  // this table is not a list of advantages.
  fluffy: eff({ fire: 2 }),

  /* Weather abilities. In because they fit the rule above with no exception —
     each is one Pokémon with one ability, so there is no selector ambiguity
     either. Delta Stream cancels the Flying type's three weaknesses, and the
     halves below are only the right answer because the ability exists on
     nothing but a Flying type (Mega Rayquaza). */
  "delta-stream": eff({ electric: 0.5, ice: 0.5, rock: 0.5 }, 6),
  "primordial-sea": eff({ fire: 0 }, 6),
  "desolate-land": eff({ water: 0 }, 6),

  /* The documented exception: a rule over the final product, not a map. Every
     attack that is not super effective does nothing at all. */
  "wonder-guard": { all: (mult) => (mult > 1 ? mult : 0), since: 3 },
};

// Whether an ability changes type effectiveness **at `gen`** — the thing the
// chip's marker says out loud.
//
// The generation is not optional detail. Storm Drain is in the table but only
// redirected until Gen 5, so on a Gen 4 board the marker would promise a change
// the STAB block then does not make — a control that says it matters where it
// does not is worse than no marker. Still a property of the ability rather than
// of the selection, so the marker does not flicker as chips are clicked.
export const affectsTypes = (slug, gen = null) => {
  const entry = slug == null ? null : ABILITY_EFFECTS[slug];
  return Boolean(entry) && (gen == null || gen >= entry.since);
};

/**
 * One attacking type's multiplier, after the defender's ability has had its
 * say. `base` is whatever the era's chart already produced.
 *
 * Returns `base` untouched for an ability with no entry, one whose effect had
 * not been written yet at `gen`, or no ability at all — so every caller can
 * pass this through unconditionally rather than branching first.
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

// PokéAPI's own display names, for the twelve slugs `titleCase` cannot reach.
// Seven lowercase a preposition, two want an apostrophe, one an acronym, one a
// hyphen, and As One is stored twice because PokéAPI splits it by the horse it
// came with. Written out rather than solved with a rule: a rule that lowercases
// "of" would also have to know not to touch an ability actually called "Of",
// and thirteen is a list, not a pattern.
//
// The guard test can only catch a raw slug leaking through (a lowercase letter
// after a hyphen); it is structurally blind to a CASING error, which is how
// "Good As Gold" survived a review. Each of these is therefore asserted by name.
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

// `slug == null` is a real input, not a defensive flourish: `defaultAbility`
// returns null for the fourteen entries that carry no abilities, and a caller
// that renders a label without checking first would otherwise take the whole
// page down on `null.split`.
export const abilityLabel = (slug) =>
  slug == null ? "" : (ABILITY_NAMES[slug] ?? titleCase(slug));

/**
 * A Pokémon's ability roster at `gen`, as `[{ slug, hidden }]` in slot order.
 *
 * Empty below Generation III, and empty for the handful of entries that carry
 * no abilities at all — both are states the UI has to render rather than
 * assume away.
 *
 * The era records are slot patches with the dataset's usual `until` semantics
 * (the last generation those values held), so this walks them oldest-first
 * against a slot map that starts at today's, exactly as `statAt` does for
 * stats. A patched slot of `null` means the slot was empty then — which is how
 * PokéAPI spells "this Pokémon had no hidden ability yet", and it is the
 * majority of the records.
 */
export function abilitiesAsOf(pokemon, gen = null) {
  if (!pokemon) return [];
  if (gen != null && gen < ABILITIES_FROM_GEN) return [];

  const slots = new Map();
  pokemon.abilities.forEach((a, i) => slots.set(a.hidden ? 3 : i + 1, a.slug));
  if (gen != null && gen < HIDDEN_FROM_GEN) slots.set(3, null);

  if (gen != null) {
    // Oldest-first, first record still in force wins — the same "earliest
    // record that has not yet expired" rule statAt applies per stat key.
    // Slot 3 is skipped below HIDDEN_FROM_GEN: a record can only tell us which
    // hidden ability was held, never that one could be held at all.
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
 * The ability a board reads with when the URL names none: the first slot of
 * the era's roster.
 *
 * A Pokémon always has exactly one ability in play, so there is no "none"
 * state to fall into and no neutral default to keep the board on. That is
 * also what keeps the URL clean — a selection equal to this is spelled as no
 * parameter at all, the same rule `?asof=` follows. (D-074)
 */
export function defaultAbility(pokemon, gen = null) {
  return abilitiesAsOf(pokemon, gen)[0]?.slug ?? null;
}

/**
 * The ability named by the URL, validated against the roster the board is
 * actually reading.
 *
 * A slug this Pokémon does not have at this generation degrades to the default
 * rather than throwing or rendering an ability it never had — a stale link, a
 * hand-edited one, or simply switching generation while reading a board whose
 * ability arrived later. Same forgiving-parse rule as `parseAsOf` and
 * `parseTypes`.
 */
export function resolveAbility(pokemon, gen, wanted) {
  if (!pokemon) return null;
  const roster = abilitiesAsOf(pokemon, gen);
  return roster.some((a) => a.slug === wanted)
    ? wanted
    : (roster[0]?.slug ?? null);
}

/**
 * The ability slug a URL should carry: the resolved one, or `null` when it is
 * simply the default and therefore says nothing.
 *
 * **Resolve first, then compare** — that order is the whole function. Comparing
 * a wanted slug against the new generation's default without resolving it
 * emitted parameters the page's own parser then discarded: switching a Gengar
 * board to Gen 6 wrote `ab=cursed-body` while rendering Levitate. Both tools
 * build their URLs through this rather than each keeping the rule.
 */
export function abilityParam(pokemon, gen, wanted) {
  const resolved = resolveAbility(pokemon, gen, wanted);
  return resolved === defaultAbility(pokemon, gen) ? null : resolved;
}
