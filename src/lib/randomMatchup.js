// The comparison tool's Random button.
//
// Pure, and takes its `rng`, as every generator on the site does: the two
// things worth testing here, that the pair is always two different Pokémon and
// that both existed in the generation being read, can only be checked against a
// known sequence.

import { filterRows } from "./dexTable";
import { ALL_POKEMON } from "./pokemon";

/**
 * Two different Pokémon that both existed at `asof`, or `null` if fewer than
 * two did.
 *
 * Drawn from that generation's pool, not the whole dex. Pressing Random on a
 * Gen 1 board should give two Pokémon Gen 1 had. Otherwise the board would drop
 * back to today's generation on arrival, since `parseAsOf` checks the
 * generation against the selection, and the button would quietly undo the one
 * you set. `filterRows` is the dex's own filter, so "what existed then" means
 * the same thing here, on /dex, and in the games.
 *
 * Alternate forms are out, as in the dex's default view and the games: a random
 * matchup should be two Pokémon, not Mega Charizard X against a Rotom
 * appliance.
 *
 * The second pick draws from a range one shorter and steps over the first,
 * rather than redrawing until the two differ. That takes constant time with no
 * loop to bound, and it can't hang on an `rng` that always returns the same
 * value, as a test's might.
 */
export function randomMatchup(asof = null, rng = Math.random) {
  const pool = filterRows(ALL_POKEMON, { asof, includeForms: false });
  if (pool.length < 2) return null;

  const i = Math.min(Math.floor(rng() * pool.length), pool.length - 1);
  const j = Math.min(Math.floor(rng() * (pool.length - 1)), pool.length - 2);
  return [pool[i], pool[j >= i ? j + 1 : j]];
}
