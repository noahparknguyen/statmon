import { Link } from "react-router";
import { LuArrowRight } from "react-icons/lu";
import ContenderPanel from "../components/ContenderPanel";
import PageHeader from "../components/PageHeader";
import { PAGE_CONTENT } from "../components/pageChrome";
import MatchupPanel from "../components/MatchupPanel";
import { DEFAULT_SETTINGS, higherQuestion } from "../lib/games";
import {
  DEFAULT_SETTINGS as EFFECTIVE_DEFAULTS,
  effectiveQuestion,
} from "../lib/effective";

// The games index (D-091), now with a thumbnail per game (D-096).
//
// **A real index rather than `/games` rendering the default game.** "Games" in
// the nav should show what exists, not drop you mid-round with a score already
// counting — and the backlog holds four more of these (05_roadmap Phase 6),
// which need somewhere to live that is not Home: D-043 states its own limit at
// about four preview sections, and Games is the fourth.
//
// **The thumbnail is the real board.** Same `ContenderPanel`, same `gap-px`
// divider, same generated round — just the `sm` size. That is D-043's rule
// applied one level down: a card that advertises a game with a drawing of a
// game can drift from it, and this cannot. It is drawn once at module scope
// rather than per render, so scrolling past does not reshuffle it.
const HIGHER_ROUND = higherQuestion({ ...DEFAULT_SETTINGS, stats: ["speed"] });
// Medium, so the thumbnail shows the thing that tier exists for: two types to
// multiply together. Easy would advertise a single row of the chart.
const EFFECTIVE_ROUND = effectiveQuestion({
  ...EFFECTIVE_DEFAULTS,
  tier: "medium",
});

const CARD =
  "flex h-full flex-col overflow-hidden rounded-lg border bg-surface transition-colors";
const BODY = "flex flex-1 flex-col gap-2 p-5";

// A fixed band at the top of each card, so a built game and an unbuilt one are
// the same shape and the grid does not go ragged.
const THUMB = "h-32 shrink-0 border-b border-border-subtle";

function EffectiveThumb() {
  if (!EFFECTIVE_ROUND) return null;
  const { attack, defender } = EFFECTIVE_ROUND;
  return (
    <div className={`${THUMB} grid grid-cols-2 gap-px bg-base`}>
      <MatchupPanel
        size="sm"
        role="Attacking"
        types={[attack]}
        className="rounded-tl-lg"
      />
      <MatchupPanel
        size="sm"
        role="Defending"
        types={defender.types}
        className="rounded-tr-lg"
      />
    </div>
  );
}

function HigherThumb() {
  if (!HIGHER_ROUND) return null;
  return (
    // `bg-base` for the divider, matching the real board (D-100), and a top
    // corner radius on each outer panel so the winner's inset ring follows the
    // card's curve instead of being sliced off by it.
    <div className={`${THUMB} grid grid-cols-2 gap-px bg-base`}>
      {HIGHER_ROUND.contenders.map((p, i) => (
        <ContenderPanel
          key={p.slug}
          size="sm"
          className={i === 0 ? "rounded-tl-lg" : "rounded-tr-lg"}
          pokemon={p}
          stat={HIGHER_ROUND.stat}
          value={HIGHER_ROUND.values[i]}
          resolved
          won={p === HIGHER_ROUND.winner}
        />
      ))}
    </div>
  );
}

export default function Games() {
  return (
    <div className={PAGE_CONTENT}>
      <PageHeader
        title="Games"
        subtitle="The same data, asking you the questions."
      />

      <ul className="grid gap-4 sm:grid-cols-2">
        <li>
          <Link
            to="/games/higher"
            className={`${CARD} group border-border-subtle hover:border-border-strong`}
          >
            <HigherThumb />
            <span className={BODY}>
              <span className="flex items-center gap-1.5 text-h4 text-primary">
                {/* The name and its dot are ONE flex child. As three children
                    the row's gap fell between the word and the dot, so the
                    `Word.` motif rendered as "Higher ." */}
                <span>
                  Higher<span className="text-accent">.</span>
                </span>
                <LuArrowRight
                  aria-hidden
                  className="text-tertiary transition-colors group-hover:text-secondary"
                />
              </span>
              <span className="text-body-sm text-secondary">
                Two or four Pokémon, one stat. Pick the highest — any stat, any
                generation, filtered however you like.
              </span>
            </span>
          </Link>
        </li>

        <li>
          <Link
            to="/games/effective"
            className={`${CARD} group border-border-subtle hover:border-border-strong`}
          >
            <EffectiveThumb />
            <span className={BODY}>
              <span className="flex items-center gap-1.5 text-h4 text-primary">
                <span>
                  Effective<span className="text-accent">.</span>
                </span>
                <LuArrowRight
                  aria-hidden
                  className="text-tertiary transition-colors group-hover:text-secondary"
                />
              </span>
              <span className="text-body-sm text-secondary">
                An attacking type and a defender. Name the multiplier — dual
                types and abilities included.
              </span>
            </span>
          </Link>
        </li>
      </ul>

      <p className="mt-8 text-caption text-tertiary">
        Every round ends with a link into the tool that would have answered it —
        the point is to stop needing to look it up.
      </p>
    </div>
  );
}
