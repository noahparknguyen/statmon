// Historical stats and typings: reading a Pokémon as it was in an earlier
// generation (D-045).
//
// Two things changed over the series' history. Generation 1 had no Sp. Atk /
// Sp. Def — one **Special** stat covered both — and a number of Pokémon have
// had base stats or typings revised since (Butterfree's Sp. Atk was 80 through
// Gen 5, Aegislash was cut down in Gen 8). The dataset carries both as `until`
// records, where `until` is the last generation those values applied in.
//
// The comparison page offers **every generation its two Pokémon both existed
// in** and renders whichever one the URL names (D-046). Two rules the UI would
// otherwise need fall straight out of that:
//
//   · Gen 1's Special split is not a mode. Every Gen 1 species carries a record
//     at `until: 1`, so asking for Gen 1 returns the five-stat shape and asking
//     for anything later does not.
//   · "Only offer Gen 1 when both are Gen 1 Pokémon" is not a rule either. The
//     range starts at the latest debut among the selection, so if either side
//     arrived later the strip simply starts after Gen 1 — and the reason is
//     visible on screen rather than left to be inferred from a missing control.
//     This is what makes mixing a Gen 1 board with a modern one unreachable,
//     which it has to be: Gen 1 is a different *measurement*, not a different
//     value. Five stats against six has no honest layout, and a five-stat total
//     against a six-stat one is a category error, not a delta.
//
// Pure functions over plain data — no React, no DOM — so this is unit-tested
// directly (eras.test.js) and the page stays thin on top of it, the same split
// as lib/dexTable.js.
import { ALL_POKEMON } from "./pokemon";
import { GEN1_STAT_ORDER, STAT_ORDER } from "./stats";

// Read off the dataset rather than hardcoded, so a rebuilt dex that adds a
// generation extends the timeline on its own — the same reasoning as
// GENERATIONS in lib/dexTable.js.
export const CURRENT_GEN = Math.max(...ALL_POKEMON.map((p) => p.generation));

const sum = (values) => values.reduce((a, b) => a + b, 0);

/* -------------------------------------------------------------------------
   Resolving one Pokémon at one generation.
   ---------------------------------------------------------------------- */

// The stat keys a Pokémon is read with at `gen`: the modern six, or Gen 1's
// five with a single Special in place of the Sp. Atk / Sp. Def pair. Driven by
// the entry's own record rather than by `gen === 1`, so a form that has no Gen
// 1 record — an Alolan form of a Gen 1 species — never renders a stat it never
// had.
const hasGen1Special = (p) =>
  p.statEras.some((era) => era.until === 1 && "special" in era.stats);

const keysFor = (p, gen) =>
  gen === 1 && hasGen1Special(p) ? GEN1_STAT_ORDER : STAT_ORDER;

// The value of one stat at `gen`: the earliest record still in force there —
// records are stored oldest-first, so the first one whose `until` has not yet
// passed — falling back to today's value once none applies.
function statAt(p, key, gen) {
  const era = p.statEras.find((e) => e.until >= gen && key in e.stats);
  return era ? era.stats[key] : p.stats[key];
}

/**
 * One Pokémon as it was at `gen`, in the shape the comparison components read:
 * `{ gen, keys, stats, bst, types }`. Pass `gen: null` for today, which returns
 * the entry's own values untouched — so every caller handles one shape and the
 * current view costs nothing.
 *
 * The BST is summed over `keys`, which is what makes a Gen 1 total a five-stat
 * total: Alakazam reads 405 there, not 500. That is correct, not a rounding
 * error — Gen 1 had one fewer stat to add up.
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
  };
}

/* -------------------------------------------------------------------------
   Resolving a selection into the generations it can be read at.
   ---------------------------------------------------------------------- */

// Whether a Pokémon reads differently at `gen` than it does today — a changed
// stat, a changed typing, or Gen 1's five-stat shape. Drives the marker on the
// strip, so the control doubles as a map of where this matchup has history
// (D-046) instead of nine identical-looking buttons.
export function differsFromToday(pokemon, gen) {
  const view = eraView(pokemon, gen);
  return (
    view.keys !== STAT_ORDER ||
    STAT_ORDER.some((k) => view.stats[k] !== pokemon.stats[k]) ||
    view.types.length !== pokemon.types.length ||
    view.types.some((t, i) => t !== pokemon.types[i])
  );
}

/**
 * Every generation the given Pokémon (one or two — whatever is selected) both
 * existed in, oldest first: `[{ gen, differs }]`.
 *
 * The range starts at the **latest debut** among them, so it only ever offers
 * generations in which every card on the board was actually in the games. That
 * start is the whole answer to "what if one is a Gen 1 Pokémon and the other
 * isn't": the strip starts later, and the missing generations are visibly
 * missing rather than silently unavailable.
 *
 * Unlike the change-boundary model this replaced, EVERY generation in the range
 * is offered, including the ones where nothing changed — "as of Gen 3, Pikachu
 * had these stats" is a true and useful statement even when Gen 3 looks like
 * Gen 4. `differs` marks the ones that do not match today, so the extra options
 * cost nothing to scan.
 */
export function generationOptions(pokemon) {
  const mons = pokemon.filter(Boolean);
  // Nothing selected yet: the whole timeline is on offer. Returning an empty
  // list here instead made the control appear only once a Pokémon was picked,
  // which grew the row it lives in and shoved the board down the page — the
  // same appearing-and-vanishing that D-046 set out to remove, left behind on
  // the one screen where it also caused a layout shift. (D-050)
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
 * Every generation in the dataset, for the tools whose lens is not scoped to a
 * selection — the dex, which spans the whole thing, and the type chart, which
 * has existed in all nine.
 *
 * Deliberately without the `differs` flag `generationOptions` carries. Over a
 * whole dex or a whole chart nearly every generation contains *something* that
 * changed, so every chip would be marked and the mark would say nothing. It
 * earns its place on a two-Pokémon board and not here. (D-049)
 */
export const allGenerations = () =>
  Array.from({ length: CURRENT_GEN }, (_, i) => ({ gen: i + 1 }));

/**
 * The generation named by the URL's `?asof=`, or `null` for the current one.
 *
 * A generation this selection never shared degrades to `null` rather than
 * throwing or rendering an impossible view — a stale link, a hand-edited one,
 * or simply switching to a Mega while reading a Gen 1 board, which takes the
 * generation with it because that form did not exist yet. Same forgiving-parse
 * rule as parseView in dexTable.js.
 */
export function parseAsOf(searchParams, pokemon) {
  const raw = Number(searchParams.get("asof"));
  if (!Number.isInteger(raw)) return null;
  // The newest generation is the current view, which is spelled as no
  // parameter at all — so there is one state, not two that can disagree.
  if (raw >= CURRENT_GEN) return null;
  return generationOptions(pokemon).some((o) => o.gen === raw) ? raw : null;
}
