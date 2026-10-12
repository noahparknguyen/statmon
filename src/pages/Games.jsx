import { Link } from "react-router";
import { LuArrowRight } from "react-icons/lu";
import PageHeader from "../components/PageHeader";
import { PAGE_CONTENT } from "../components/pageChrome";
import { EffectiveThumb, HigherThumb } from "../components/gameThumbs";
import {
  GAME_CARD,
  GAME_CARD_ARROW,
  GAME_CARD_BODY,
  GAME_CARD_TITLE,
} from "../components/gameChrome";
import { DEFAULT_SETTINGS } from "../lib/games";
import { DEFAULT_SETTINGS as EFFECTIVE_DEFAULTS } from "../lib/effective";

// The games index, with a thumbnail of each game.
//
// A real index, rather than `/games` opening the default game: "Games" in the
// nav should show what there is, not drop you mid-round with a score already
// counting.
//
// Each thumbnail is the real board: the same `ContenderPanel`, the same divider,
// and a real generated round, just at the `sm` size. A drawing of a game could
// drift from the game, and this can't. Each round is drawn once and remembered,
// so scrolling past doesn't reshuffle it.
//
// Speed for the stat game, because it's the question the site was built for.
// The Medium tier for the type game, because it's the one with two types to
// multiply, where Easy would show a single row of the chart.
const HIGHER_PREVIEW = { ...DEFAULT_SETTINGS, stats: ["speed"] };
const EFFECTIVE_PREVIEW = { ...EFFECTIVE_DEFAULTS, tier: "medium" };

export default function Games() {
  return (
    <div className={PAGE_CONTENT}>
      <PageHeader
        title="Games"
        subtitle="The same data, asking you the questions."
      />

      <ul className="grid gap-4 sm:grid-cols-2">
        <li>
          <Link to="/games/higher" className={GAME_CARD}>
            <HigherThumb settings={HIGHER_PREVIEW} />
            <span className={GAME_CARD_BODY}>
              <span className={GAME_CARD_TITLE}>
                {/* The name and its dot are one flex child. As separate
                    children, the row's gap would fall between the word and the
                    dot, and render "Higher ." */}
                <span>
                  Higher<span className="text-accent">.</span>
                </span>
                <LuArrowRight aria-hidden className={GAME_CARD_ARROW} />
              </span>
              <span className="text-body-sm text-secondary">
                Two or four Pokémon, one stat. Pick the highest: any stat, any
                generation, filtered however you like.
              </span>
            </span>
          </Link>
        </li>

        <li>
          <Link to="/games/effective" className={GAME_CARD}>
            <EffectiveThumb settings={EFFECTIVE_PREVIEW} />
            <span className={GAME_CARD_BODY}>
              <span className={GAME_CARD_TITLE}>
                <span>
                  Effective<span className="text-accent">.</span>
                </span>
                <LuArrowRight aria-hidden className={GAME_CARD_ARROW} />
              </span>
              <span className="text-body-sm text-secondary">
                An attacking type and a defender. Name the multiplier, dual
                types and abilities included.
              </span>
            </span>
          </Link>
        </li>
      </ul>
    </div>
  );
}
