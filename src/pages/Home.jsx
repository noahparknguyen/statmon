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

// Home. The page opens on a full-bleed wall of sprites (D-070) with the wordmark
// on it, then runs hero -> one labelled section per shipped tool.
//
// It began as product-as-hero (D-023): the live Volcarona vs Chandelure board
// was the first thing on the page, on the argument that the comparison tool's
// own UI is the site's most specific asset. D-070 reversed that deliberately and
// on the record — the wall greets, the board crests the fold beneath it. The
// mascots stay: their pixel sprites sit inside the board's cards and their
// illustrations peek out from behind its edges.
//
// Every tool is named like every other one (D-067), the flagship included; it
// had been the only tool Home would not name, which left the site's tagline
// reading as the comparison's description.
const V = getBySlug("volcarona");
const C = getBySlug("chandelure");

// **No tools row** (D-139). A row of four outlined pills used to close the
// page: a chip style of its own, the fourth way to reach the tools on a page
// that already has the nav, a section with a button per tool, and the footer's
// Tools column, and it named two of them "Dex table" and "Type chart" where
// every other surface says Dex and Types — the three-names fault D-067 fixed
// once already. Each section's button is the way in.

export default function Home() {
  return (
    <>
      {/* Full-bleed, so it sits outside the content wrapper below rather than
          fighting its max-width. <main> imposes no width of its own (Layout),
          which is what makes that possible. */}
      <SpriteWall>
        <h1 className="text-display-hero">
          Statmon<span className="text-accent">.</span>
        </h1>
        {/* text-primary, not text-secondary: over a 65% scrim the secondary
            token sits at 2.78:1 and fails AA, while primary is 5.68:1. Making
            the tagline darker was the alternative and it costs the wall most of
            its visibility. The hero is the one place the tagline is the
            wordmark's partner rather than supporting text (D-070). */}
        {/* "A simple set of Pokémon tools." until D-138: the one line on the
            site that called the site something, which §14 rules out. This one
            says what is here. */}
        <p className="mx-auto mt-3 max-w-xl text-body-lg text-primary">
          Pokémon stats, matchups, and games.
        </p>
      </SpriteWall>

      <div className="max-w-content mx-auto px-4 pb-20 overflow-hidden">
        <section className="mt-16">
          <PageHeader
            as="h2"
            title="Compare"
            // /compare's own subtitle, verbatim — the dex and type sections
            // already reuse theirs, and routes.test.jsx asserts this one has not
            // drifted from the page it advertises.
            subtitle="See who's faster, hits harder, and is bulkier."
          />
          {V && C && (
            <div className="relative max-w-2xl mx-auto">
              {/* Illustrations peeking out from behind the board (mascots). */}
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

          {/* **"Open the comparison", not "Try it out".** D-023 gave the
            flagship its own CTA copy on the grounds that it is the first thing
            anyone is invited to do — but "Try it out" was the only string on
            the site written as a pitch rather than a description
            (06_style_guide §14.1 rule 4), and the other three sections all say
            "Open the …". What made the flagship distinct was never the verb: it
            is the mascots, the full-width board and its own section, and all of
            that survives the change.

            **It opens the board it is standing under**, rather than an empty
            tool. The type section has always done this — its CTA carries
            Krookodile's typing — and the inconsistency was the flagship's:
            clicking through from a live Volcarona-vs-Chandelure board landed on
            two empty slots and a "Pick two Pokémon to compare." The preview is
            the promise, so the link keeps it. */}
          {/* Guarded, because this button sits OUTSIDE the `V && C` block that
              renders the board: the two lookups are filtered rather than
              trusted everywhere else on this page, and reaching into `.slug`
              here would have been the one place a renamed slug crashed Home
              instead of quietly dropping a figure. Falls back to the empty
              tool, which is where this link went before. */}
          <div className="mt-8 flex justify-center">
            <Button to={V && C ? compareUrl(V.slug, C.slug) : "/compare"}>
              Open the comparison
              <LuArrowRight aria-hidden />
            </Button>
          </div>
        </section>

        {/* Every feature the site ships gets a live preview here (D-043). The
          board above is the flagship and keeps its own treatment — mascots, the
          full-width board, its own CTA — while sharing this section's heading
          block; this is the repeatable shell each later tool adds. */}
        {/* The preview is the Black & White team read by Speed, descending
            (D-044), so the CTA opens the dex under that same reading: Gen 5,
            sorted by Speed. It is the honest widening of what is on screen —
            the same question asked of the whole generation instead of seven
            rows — rather than a bare /dex that drops you on an unsorted
            National Dex and makes you redo the sort you were just shown. */}
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

        {/* The fourth section, and the one D-043 named as the limit: a stack of
            full previews stops working at about four, so a fifth tool should
            become a grid of compact ones rather than another 500px band. */}
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
