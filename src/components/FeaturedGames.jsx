import ContenderPanel from "./ContenderPanel";
import { getBySlug } from "../lib/pokemon";
import { isPlayableRound, roundFor, statName } from "../lib/games";

// Home's games preview, built from the game's own `ContenderPanel` with a real
// round rather than a mock-up, as `FeaturedDex` uses `DexRow` and
// `FeaturedTypes` uses `MatchupSummary`.
//
// The two Pokémon are chosen, not drawn at random: every section on Home shows
// members of the Black and White team the site came out of, and Mienshao and
// Samurott are this section's.
//
// A hand-picked pair could be a round the game would never deal, so it's held
// to the game's own bar rather than trusted: `isPlayableRound` is the check
// `higherQuestion` uses to decide whether to deal a round or redraw it, and
// `games.test.js` checks this pair passes. Mienshao's 105 Speed against
// Samurott's 70 is a 35-point gap against a minimum of 3.
//
// It's built by `roundFor`, the game's own round builder, so the preview can't
// disagree with the game about who won.
//
// There's no artwork beside it. Every other section on Home pairs the preview
// with official art, because a table and a stat board aren't pictures of
// Pokémon. This one already is: `ContenderPanel` shows the artwork full size as
// the subject.
//
// Shown answered, not open. An open round previews a question; an answered one
// previews the whole loop, with the values and the accent marking the winner,
// which is what the game gives you. The panels get no `onPick` here, so they
// render as <div>s rather than controls that do nothing.
const CAMEO = ["mienshao", "samurott"];
const STAT = "speed";

// Filtered rather than trusted, as `FeaturedDex` reads its team: a rebuilt
// dataset that renamed a slug drops the section instead of leaving a hole.
const CONTENDERS = CAMEO.map(getBySlug).filter(Boolean);
const ROUND =
  CONTENDERS.length === CAMEO.length ? roundFor(CONTENDERS, STAT) : null;

export default function FeaturedGames() {
  // The test checks the round is playable, but one that failed would be a
  // broken preview rather than a styling bug, so it's refused here too.
  if (!ROUND || !isPlayableRound(ROUND)) return null;

  return (
    // `max-w-2xl` matches the comparison board above, the other preview that's
    // a board rather than a table.
    //
    // The height matters more than the width. `object-contain` fits the artwork
    // to the panel's height, so extra width only adds empty space either side.
    // At `h-96`, after the name, badges, value band, and padding, about 236px is
    // left for the artwork, enough for the section to carry the same weight as
    // the others.
    <div className="mx-auto w-full max-w-2xl">
      {/* One level under the section's own <h2>, and the question the game
          asks: two cards mean nothing without the question they answer. */}
      <h3 className="mb-3 text-center text-h4 text-secondary">
        Which has the higher {statName(ROUND.stat)}?
      </h3>
      {/* The game's own panels at the game's own size, on a `gap-px` divider:
          the real board, not a picture of one. */}
      <div className="grid h-96 grid-cols-2 gap-px overflow-hidden rounded-lg border border-border-subtle bg-base">
        {ROUND.contenders.map((p, i) => (
          <ContenderPanel
            key={p.slug}
            // The winner's ring is inset, so it traces the panel's own box. It
            // has to be given the card's curve, or the card clips it square.
            className={i === 0 ? "rounded-l-lg" : "rounded-r-lg"}
            pokemon={p}
            stat={ROUND.stat}
            value={ROUND.values[i]}
            resolved
            won={p === ROUND.winner}
            // Below the fold, like the other previews' art. Without it, React
            // 19 would preload both artworks on every visit to Home.
            lazy
          />
        ))}
      </div>
    </div>
  );
}
