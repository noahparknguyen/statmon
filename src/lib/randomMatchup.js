// "Surprise me" for the comparison tool (00_brainstorm §2.2, D-123).
//
// Pure, with an INJECTED rng, for the reason every generator on this site takes
// one (lib/games.js): a random function that reaches for `Math.random` itself
// cannot be tested, and the two properties worth asserting here — the pair is
// always distinct, and it always exists at the generation being read — are only
// assertable against a seeded sequence.

import { filterRows } from "./dexTable";
import { ALL_POKEMON } from "./pokemon";

/**
 * Two different Pokémon that both existed at `asof`, or `null` if fewer than
 * two did.
 *
 * **Drawn from the era's own pool, not the whole dex.** Hitting Random while
 * reading a Gen 1 board should hand back two Pokémon that Gen 1 had — otherwise
 * the lens silently drops to the current generation on arrival (`parseAsOf`
 * validates the era against the selection) and the control quietly undoes the
 * one you set. `filterRows` is the dex's own filter, so "what existed then"
 * means the identical thing here, on `/dex`, and in the games.
 *
 * **Alternate forms are out**, matching the dex's resting state (D-056) and the
 * games' pool: a random matchup should be two Pokémon, not Mega Charizard X
 * against a Rotom appliance.
 *
 * The second pick draws from a range one shorter and steps over the first,
 * rather than redrawing until the two differ. That is O(1) with no loop to
 * bound, and it cannot hang on an rng that returns a constant — which a test
 * one written as a rejection loop would.
 */
export function randomMatchup(asof = null, rng = Math.random) {
  const pool = filterRows(ALL_POKEMON, { asof, includeForms: false });
  if (pool.length < 2) return null;

  const i = Math.min(Math.floor(rng() * pool.length), pool.length - 1);
  const j = Math.min(Math.floor(rng() * (pool.length - 1)), pool.length - 2);
  return [pool[i], pool[j >= i ? j + 1 : j]];
}
