import { LuArrowRight } from "react-icons/lu";
import Button from "../components/Button";
import FeaturedComparison from "../components/FeaturedComparison";
import FeaturePreview from "../components/FeaturePreview";
import FeaturedDex from "../components/FeaturedDex";
import FeaturedTypes from "../components/FeaturedTypes";
import FeaturedGames from "../components/FeaturedGames";
import SpriteWall from "../components/SpriteWall";
import PageHeader from "../components/PageHeader";
import { getBySlug, artworkFor } from "../lib/pokemon";
import { compareUrl } from "../lib/compareUrl";

// Home: a full-bleed wall of sprites behind the wordmark, then one section per
// tool, each with a live preview. The comparison's two Pokémon, Volcarona and
// Chandelure, appear as sprites inside its board and as illustrations peeking
// out from behind it.
const V = getBySlug("volcarona");
const C = getBySlug("chandelure");

export default function Home() {
  return (
    <>
      {/* Full-bleed, so it sits outside the content wrapper below rather than
          fighting its max-width. <main> sets no width of its own, which is what
          makes that possible. */}
      <SpriteWall>
        <h1 className="text-display-hero">
          Statmon<span className="text-accent">.</span>
        </h1>
        {/* text-primary, not text-secondary: over the wall's 65% scrim, the
            secondary colour is 2.78:1 and fails AA contrast, while primary is
            5.68:1. A darker scrim would hide most of the wall instead. */}
        <p className="mx-auto mt-3 max-w-xl text-body-lg text-primary">
          Pokémon stats, matchups, and games.
        </p>
      </SpriteWall>

      <div className="max-w-content mx-auto px-4 pb-20 overflow-hidden">
        <section className="mt-16">
          <PageHeader
            as="h2"
            title="Compare"
            // /compare's own subtitle, word for word, as the dex and type
            // sections reuse theirs. routes.test.jsx checks it hasn't drifted
            // from the page it advertises.
            subtitle="See who's faster, hits harder, and is bulkier."
          />
          {V && C && (
            <div className="relative max-w-2xl mx-auto">
              {/* Illustrations peeking out from behind the board. */}
              <img
                src={artworkFor(V)}
                alt=""
                aria-hidden
                decoding="async"
                className="hidden lg:block pointer-events-none absolute z-0 left-0 top-1/2 w-100 -translate-y-1/2 -translate-x-1/2 -rotate-10 drop-shadow-art"
              />
              <img
                src={artworkFor(C)}
                alt=""
                aria-hidden
                decoding="async"
                className="hidden lg:block pointer-events-none absolute z-0 right-0 top-1/2 w-90 -translate-y-1/2 translate-x-3/5 -scale-x-100 rotate-10 drop-shadow-art"
              />
              <div className="relative z-1">
                <FeaturedComparison p1={V} p2={C} />
              </div>
            </div>
          )}

          {/* It opens the board it sits under rather than an empty tool, as the
            type section's link does: the preview is a promise, and the link
            keeps it.

            Guarded, because this button sits outside the `V && C` block that
            renders the board. A renamed slug would otherwise crash Home here
            instead of just dropping the board, so it falls back to the empty
            tool. */}
          <div className="mt-8 flex justify-center">
            <Button to={V && C ? compareUrl(V.slug, C.slug) : "/compare"}>
              Open the comparison
              <LuArrowRight aria-hidden />
            </Button>
          </div>
        </section>

        {/* Every tool gets a live preview here. The comparison above keeps its
          own treatment (the illustrations, the full-width board, its own
          button) while sharing this heading style. This is the shell each
          other tool uses. */}
        {/* The preview is the Black and White team ranked by Speed, so the
            button opens the dex the same way: Gen 5, sorted by Speed. It's the
            same question asked of the whole generation, rather than a bare /dex
            that makes you redo the sort you were just shown. */}
        <FeaturePreview
          title="Dex"
          description="Every Pokémon, sorted by any stat."
          to="/dex?sort=speed&dir=desc&gen=5"
          cta="Open the dex"
        >
          <FeaturedDex />
        </FeaturePreview>

        <FeaturePreview
          title="Types"
          description="Every matchup, including dual types."
          to="/types/ground/dark"
          cta="Open the type chart"
        >
          <FeaturedTypes />
        </FeaturePreview>

        {/* The fourth section, and the limit: a stack of full previews stops
            working at about four, so a fifth tool should get a grid of compact
            ones rather than another 500px band. */}
        <FeaturePreview
          title="Games"
          description="The same data, asking you the questions."
          to="/games"
          cta="Open the games"
        >
          <FeaturedGames />
        </FeaturePreview>
      </div>
    </>
  );
}
