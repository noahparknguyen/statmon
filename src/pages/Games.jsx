import { Link } from "react-router";
import { LuArrowRight } from "react-icons/lu";
import PageHeader from "../components/PageHeader";
import { PAGE_CONTENT } from "../components/pageChrome";
import { EffectiveThumb, HigherThumb } from "../components/gameThumbs";
import { DEFAULT_SETTINGS } from "../lib/games";
import { DEFAULT_SETTINGS as EFFECTIVE_DEFAULTS } from "../lib/effective";

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
// game can drift from it, and this cannot.
//
// The two thumbnails used to be defined here. They moved to `gameThumbs.jsx`
// when the difficulty picker needed the same thing per preset (D-117) — the
// alternative was a second set of thumbnails describing the same games, which
// is exactly the drift this rule exists to prevent. Each round is still drawn
// once and remembered, so scrolling past does not reshuffle it.
//
// Speed for the stat game, because it is the question the site was built for;
// the MEDIUM tier for the type game, because that is the one with two types to
// multiply together where Easy would advertise a single row of the chart.
const HIGHER_PREVIEW = { ...DEFAULT_SETTINGS, stats: ["speed"] };
const EFFECTIVE_PREVIEW = { ...EFFECTIVE_DEFAULTS, tier: "medium" };

const CARD =
  "flex h-full flex-col overflow-hidden rounded-lg border bg-surface transition-colors";
const BODY = "flex flex-1 flex-col gap-2 p-5";

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
            <HigherThumb settings={HIGHER_PREVIEW} />
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
            <EffectiveThumb settings={EFFECTIVE_PREVIEW} />
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

      {/* A line used to sit here explaining that every round links back into
          the tool that would have answered it. It is true, it is the argument
          for a game living on a reference site at all — and it is the site
          telling the reader why its own idea is good (06_style_guide §14.1
          rule 4). The rounds do it; saying so is the part that was not needed.
          The reasoning lives in D-091, which is where it belongs. */}
    </div>
  );
}
