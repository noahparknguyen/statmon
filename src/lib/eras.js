// Reading a Pokémon as it was in an earlier generation: its stats, typing, and
// abilities.
//
// Two things changed over the series. Gen 1 had a single Special stat where
// later games have Sp. Atk and Sp. Def, and some Pokémon have had base stats or
// typings revised since: Butterfree's Sp. Atk was 80 through Gen 5, and
// Aegislash was cut down in Gen 8. The dataset stores both as `until` records,
// where `until` is the last generation the values applied in.
//
// The comparison page offers every generation both of its Pokémon existed in.
// Two rules follow from that without any code of their own:
//
//   · Gen 1's Special isn't a mode. Every Gen 1 species has a record at
//     `until: 1`, so asking for Gen 1 returns the five-stat shape and asking
//     for any later generation doesn't.
//   · The range starts at the later of the two debuts, so a Gen 1 board can
//     never be mixed with a modern one, and the reason is visible: the strip
//     starts later. It has to be impossible, because five stats against six
//     has no honest layout, and a five-stat total against a six-stat one isn't
//     a difference: it's two different measurements.
//
// Pure functions over plain data, with no React and no DOM, so they're tested
// directly in eras.test.js.
import { ABILITIES_FROM_GEN, abilitiesAsOf } from "./abilities";
import { ALL_POKEMON } from "./pokemon";
import { GEN1_STAT_ORDER, STAT_ORDER } from "./stats";

// Read from the dataset rather than hard-coded, so a rebuilt dataset with a new
// generation extends the timeline by itself.
export const CURRENT_GEN = Math.max(...ALL_POKEMON.map((p) => p.generation));

const sum = (values) => values.reduce((a, b) => a + b, 0);

/* -------------------------------------------------------------------------
   Resolving one Pokémon at one generation.
   ---------------------------------------------------------------------- */

// The stat keys a Pokémon is read with at `gen`: today's six, or Gen 1's five
// with Special in place of Sp. Atk and Sp. Def. It checks the entry's own
// records rather than `gen === 1`, so a form with no Gen 1 record, like an
// Alolan form of a Gen 1 species, never shows a stat it never had.
const hasGen1Special = (p) =>
  p.statEras.some((era) => era.until === 1 && "special" in era.stats);

const keysFor = (p, gen) =>
  gen === 1 && hasGen1Special(p) ? GEN1_STAT_ORDER : STAT_ORDER;

// One stat at `gen`: the first record still in force there, since records are
// stored oldest first, or today's value once none applies.
function statAt(p, key, gen) {
  const era = p.statEras.find((e) => e.until >= gen && key in e.stats);
  return era ? era.stats[key] : p.stats[key];
}

/**
 * One Pokémon as it was at `gen`, in the shape the comparison components read:
 * `{ gen, keys, stats, bst, types, abilities }`. A `gen` of null means today,
 * which returns the entry's own values, so every caller handles one shape and
 * the current view costs nothing.
 *
 * The BST is summed over `keys`, so a Gen 1 total is a five-stat total:
 * Alakazam reads 405 there, not 500, because Gen 1 had one fewer stat.
 *
 * Abilities are part of the same view, so one function decides which
 * generation is being read. In a Gen 1 or 2 view the list is empty, because
 * abilities arrived in Gen 3.
 */
export function eraView(pokemon, gen = null) {
  if (!pokemon) return null;
  if (gen == null || gen >= CURRENT_GEN) {
    return {
      gen: null,
      keys: STAT_ORDER,
      stats: pokemon.stats,
      bst: pokemon.bst,
      types: pokemon.types,
      abilities: pokemon.abilities,
    };
  }
  const keys = keysFor(pokemon, gen);
  const stats = Object.fromEntries(
    keys.map((k) => [k, statAt(pokemon, k, gen)]),
  );
  const typeEra = pokemon.typeEras.find((e) => e.until >= gen);
  return {
    gen,
    keys,
    stats,
    bst: sum(Object.values(stats)),
    types: typeEra ? typeEra.types : pokemon.types,
    abilities: abilitiesAsOf(pokemon, gen),
  };
}

/* -------------------------------------------------------------------------
   Which generations a selection can be read at.
   ---------------------------------------------------------------------- */

// Whether a Pokémon reads differently at `gen` than today: a changed stat,
// typing, or ability list, or Gen 1's five-stat shape. It drives the marker on
// the generation strip, so the strip also shows where a matchup has history.
//
// Abilities count because they can change the answer: Gengar had Levitate
// through Gen 6, so a Ground attack on it reads 0× there and 2× today.
//
// They don't count below Gen 3, where nobody had abilities. That absence is
// true of every Pokémon, so marking it would put a dot on Gen 2 for every
// entry and say nothing.
export function differsFromToday(pokemon, gen) {
  const view = eraView(pokemon, gen);
  const sameAbilities =
    gen < ABILITIES_FROM_GEN ||
    (view.abilities.length === pokemon.abilities.length &&
      view.abilities.every((a, i) => a.slug === pokemon.abilities[i].slug));
  return (
    view.keys !== STAT_ORDER ||
    STAT_ORDER.some((k) => view.stats[k] !== pokemon.stats[k]) ||
    view.types.length !== pokemon.types.length ||
    view.types.some((t, i) => t !== pokemon.types[i]) ||
    !sameAbilities
  );
}

/**
 * Every generation all the given Pokémon existed in, oldest first, as
 * `[{ gen, differs }]`. Pass whatever is selected: one Pokémon or two.
 *
 * The range starts at the latest debut among them, so it only offers
 * generations every Pokémon on the board was in the games for. Every
 * generation in that range is offered, including ones where nothing changed:
 * "as of Gen 3, Pikachu had these stats" is true and useful even when Gen 3
 * matches Gen 4. `differs` marks the ones that don't match today.
 */
export function generationOptions(pokemon) {
  const mons = pokemon.filter(Boolean);
  // Nothing selected yet: the whole timeline is on offer, so the strip is there
  // from the start rather than appearing once a Pokémon is picked and pushing
  // the board down the page.
  const start = mons.length ? Math.max(...mons.map((p) => p.introducedIn)) : 1;
  const options = [];
  for (let gen = start; gen <= CURRENT_GEN; gen++) {
    options.push({
      gen,
      differs: mons.some((p) => differsFromToday(p, gen)),
    });
  }
  return options;
}

/**
 * Every generation in the dataset, for the tools whose lens covers everything:
 * the dex and the type chart.
 *
 * No `differs` flag: across a whole dex or chart, nearly every generation has
 * something that changed, so every chip would be marked and the mark would
 * mean nothing.
 */
export const allGenerations = () =>
  Array.from({ length: CURRENT_GEN }, (_, i) => ({ gen: i + 1 }));

/**
 * The generation the URL's `?asof=` names, or `null` for today.
 *
 * A generation this selection never shared falls back to `null` rather than
 * throwing or showing an impossible view. That covers a stale or hand-edited
 * link, and switching to a Mega while reading a Gen 1 board, which drops the
 * generation because that form didn't exist yet. The dex's parser is just as
 * forgiving.
 */
export function parseAsOf(searchParams, pokemon) {
  const raw = Number(searchParams.get("asof"));
  if (!Number.isInteger(raw)) return null;
  // Today's generation is written as no parameter at all, so there's only one
  // way to write it.
  if (raw >= CURRENT_GEN) return null;
  return generationOptions(pokemon).some((o) => o.gen === raw) ? raw : null;
}
