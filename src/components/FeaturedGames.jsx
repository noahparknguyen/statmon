import ContenderPanel from "./ContenderPanel";
import { getBySlug } from "../lib/pokemon";
import { isPlayableRound, roundFor, statName } from "../lib/games";

// Home's games preview (D-043, framed by D-067 and D-068), built from the
// game's own `ContenderPanel` against a real round — not a mockup, the same
// rule that keeps `FeaturedDex` on `DexRow` and `FeaturedTypes` on
// `MatchupSummary`.
//
// **The contenders are named now, and that is the point.** This drew two random
// Pokémon, which made it the one preview on Home that was not a cameo: every
// other section shows a member of the Black & White team the project came out
// of (D-044). Mienshao was reserved for this section by D-068 and then spent on
// an illustration standing NEXT to the board rather than in it — so it read as
// decoration beside the game instead of as the game. Mienshao and Samurott are
// the round now.
//
// **Pinning them gives up a guarantee, so it is bought back with a test.** The
// old comment's defence of the random draw was real: a generated round cannot
// show a matchup the game itself would never deal. A hand-picked pair can. So
// the pair is held to the generator's own bar instead of being trusted —
// `isPlayableRound` is the predicate `higherQuestion` uses to decide whether to
// return a round or redraw it, and `games.test.js` asserts this lineup clears
// it. Mienshao's 105 Speed against Samurott's 70 is a 35-point margin against a
// floor of 3: no tie, and not a coin flip.
//
// **It is built by `roundFor`**, the generator's own round constructor, rather
// than by assembling the object here — so the preview cannot disagree with the
// game about which entry won.
//
// **There is no flanking artwork, and its absence is the fix rather than a
// gap.** Every other section on Home pairs sprites inside the preview with
// official art beside it, because a table and a stat board are not pictures of
// Pokémon. This one already is: `ContenderPanel` renders the artwork full-size
// as the subject. That is D-096's argument for the arena — in a game the
// Pokémon *are* the data — showing up one level down, on Home.
//
// **Resolved, not open.** An unanswered round previews a question; a resolved
// one previews the whole loop — the answer, the values, and the accent marking
// the winner, which is the part that says what the game gives you. The panels
// take no `onPick` in that state, so Home renders them as `<div>`s rather than
// offering a control that does nothing (D-078, D-111).
const CAMEO = ["mienshao", "samurott"];
const STAT = "speed";

// Filtered rather than trusted, the way `FeaturedDex` reads its team: a dataset
// rebuild that renamed a slug drops the section instead of rendering a hole.
const CONTENDERS = CAMEO.map(getBySlug).filter(Boolean);
const ROUND =
  CONTENDERS.length === CAMEO.length ? roundFor(CONTENDERS, STAT) : null;

export default function FeaturedGames() {
  // The playability check is the test's job, but a round that failed it would
  // be a broken preview rather than a styling bug, so it is also refused here.
  if (!ROUND || !isPlayableRound(ROUND)) return null;

  return (
    // `max-w-2xl` matches the flagship comparison board above, which is the
    // other preview that is a BOARD rather than a table. It was `max-w-md`
    // inside a wider flex row, a width chosen to leave room for the
    // illustration that used to sit beside it — with that gone, sizing to the
    // board it is a peer of says more than keeping a number whose reason left.
    //
    // **The height is the number that mattered, and widening alone was the
    // wrong lever.** `object-contain` in a panel this shape fits the artwork by
    // HEIGHT, so going from `max-w-md` to `max-w-2xl` bought 224px of panel
    // width and not one pixel of Pokémon — it just added dead space either
    // side. At `h-64` the panel spent ~148px on the name, badges, value band
    // and padding, leaving ~108px of artwork inside a 336px-wide box, which
    // read as a thin strip beside a 653px comparison board. `h-96` leaves
    // ~236px, and the section now carries the weight the other three do.
    <div className="mx-auto w-full max-w-2xl">
      {/* One rung under the section's own <h2>, and the same sentence the
          game asks — the prompt IS the preview's heading, because a pair of
          cards means nothing without the question they answer. */}
      <h3 className="mb-3 text-center text-h4 text-secondary">
        Which has the higher {statName(ROUND.stat)}?
      </h3>
      {/* The arena's own panels at the arena's own size, on a `gap-px`
          divider — the real board, not a picture of one (D-043). Home is the
          shop window, so the preview has to be the thing it advertises. */}
      <div className="grid h-96 grid-cols-2 gap-px overflow-hidden rounded-lg border border-border-subtle bg-base">
        {ROUND.contenders.map((p, i) => (
          <ContenderPanel
            key={p.slug}
            // The winner's ring is inset, so it traces the panel's own box —
            // it has to be given the card's curve or the card clips it square.
            className={i === 0 ? "rounded-l-lg" : "rounded-r-lg"}
            pokemon={p}
            stat={ROUND.stat}
            value={ROUND.values[i]}
            resolved
            won={p === ROUND.winner}
            // Below the fold, like the dex and type previews' art. Without it
            // React 19 preloads both 475px artworks on every visit to Home,
            // which is the one route that is not code-split (D-060).
            lazy
          />
        ))}
      </div>
    </div>
  );
}
