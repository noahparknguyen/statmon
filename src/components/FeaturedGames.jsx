import ContenderPanel from "./ContenderPanel";
import { artworkFor, getBySlug } from "../lib/pokemon";
import { DEFAULT_SETTINGS, higherQuestion, statName } from "../lib/games";

// Home's games preview (D-043, framed by D-067 and D-068), built from the
// game's own `ContenderPanel` against a real generated round — not a mockup, the
// same rule that keeps `FeaturedDex` on `DexRow` and `FeaturedTypes` on
// `MatchupSummary`.
//
// **Mienshao, finally.** D-068 allocated the Black & White team one Pokémon per
// job and reserved the last unallocated member for this section, sight unseen,
// two sessions before the section existed. This is that reservation being
// spent.
//
// **The round is drawn once at module scope, not per render.** A preview that
// reshuffled on every re-render would be a different page each time you scrolled
// past it, and Home is the one route that is not code-split (D-060) — this runs
// on every visit to the site. Drawn with the real generator, so the preview
// cannot show a round the game itself could not produce: no tie, and a margin
// that clears the floor.
//
// **Resolved, not open.** An unanswered round previews a question; a resolved
// one previews the whole loop — the answer, the values, and the accent marking
// the winner, which is the part that says what the game gives you. The panels
// are `disabled` in that state anyway, so Home is not offering a control that
// does nothing (the D-078 rule its ability pills follow).
const ROUND = higherQuestion({ ...DEFAULT_SETTINGS, stats: ["speed"] });
const MON = getBySlug("mienshao");

export default function FeaturedGames() {
  if (!ROUND) return null;

  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center lg:flex-row lg:justify-center lg:gap-10">
      <div className="w-full max-w-md">
        {/* One rung under the section's own <h2>, and the same sentence the
            game asks — the prompt IS the preview's heading, because a pair of
            cards means nothing without the question they answer. */}
        <h3 className="mb-4 text-center text-h4 text-secondary">
          Which has the higher {statName(ROUND.stat)}?
        </h3>
        {/* The arena's own panels at the arena's own size, on a `gap-px`
            divider — the real board, not a picture of one (D-043). Home is the
            shop window, so the preview has to be the thing it advertises. */}
        <div className="grid h-64 grid-cols-2 gap-px overflow-hidden rounded-lg border border-border-subtle bg-base">
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
            />
          ))}
        </div>
      </div>

      {/* Decorative and desktop-only, like the type preview's Krookodile: below
          lg the cards need the whole column, and art that overflows scrolls the
          whole page sideways. Facing inward at the thing it flanks (D-072) —
          Mienshao's artwork faces left, so it sits on the right unmirrored.
          Lazy, since Home is not code-split and this is below the fold. */}
      {MON && (
        <img
          src={artworkFor(MON)}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          className="hidden lg:block pointer-events-none w-64 shrink-0 -rotate-3 drop-shadow-art"
        />
      )}
    </div>
  );
}
