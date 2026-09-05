import { Link } from "react-router";
import { LuArrowRight } from "react-icons/lu";
import Button from "../components/Button";
import FeaturedComparison from "../components/FeaturedComparison";
import FeaturePreview from "../components/FeaturePreview";
import FeaturedDex from "../components/FeaturedDex";
import FeaturedTypes from "../components/FeaturedTypes";
import SpriteWall from "../components/SpriteWall";
import PageHeader from "../components/PageHeader";
import { getBySlug, artworkFor } from "../lib/pokemon";

// Home. The page opens on a full-bleed wall of sprites (D-070) with the wordmark
// on it, then runs hero -> one labelled section per shipped tool -> tools row.
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

// The live ones link to themselves — a row advertising tools that cannot be
// clicked is a dead end. "Compare" rather than "Comparison": the nav, the
// section heading and the route all say Compare, and one tool with three names
// was three chances to look like three tools (D-067).
const TOOLS = [
  { label: "Compare", to: "/compare" },
  { label: "Dex table", to: "/dex" },
  { label: "Type chart", to: "/types" },
  { label: "Games · soon" },
];

const TOOL_CHIP =
  "text-caption inline-block rounded-full border px-3 py-1 transition-colors";
const TOOL_LIVE = "text-accent hover:text-accent-hover";
const LIVE_BORDER = {
  borderColor: "color-mix(in srgb, var(--color-accent) 45%, transparent)",
};

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
        <p className="mx-auto mt-3 max-w-xl text-body-lg text-primary">
          A simple set of Pokémon tools.
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
                className="hidden lg:block pointer-events-none absolute z-0 left-0 top-1/2 w-100 -translate-y-1/2 -translate-x-1/2 rotate-[-10deg] drop-shadow-art"
              />
              <img
                src={artworkFor(C)}
                alt=""
                aria-hidden
                decoding="async"
                className="hidden lg:block pointer-events-none absolute z-0 right-0 top-1/2 w-90 -translate-y-1/2 translate-x-[60%] -scale-x-100 rotate-10 drop-shadow-art"
              />
              <div className="relative z-10">
                <FeaturedComparison p1={V} p2={C} />
              </div>
            </div>
          )}

          {/* The flagship keeps its own CTA copy (D-023) where the sections below
            say "Open the …" — it is the first thing anyone is invited to do. */}
          <div className="mt-8 flex justify-center">
            <Button to="/compare">
              Try it out
              <LuArrowRight aria-hidden />
            </Button>
          </div>
        </section>

        {/* Every feature the site ships gets a live preview here (D-043). The
          board above is the flagship and keeps its own treatment — mascots, the
          full-width board, its own CTA — while sharing this section's heading
          block; this is the repeatable shell each later tool adds. */}
        <FeaturePreview
          title="Dex"
          description="Every Pokémon, sorted by any stat."
          to="/dex"
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

        {/* Labelled so a screen reader announces what the list is; without it
          this is four bare items with no context. */}
        <ul
          aria-label="Statmon tools"
          className="mt-28 flex flex-wrap justify-center gap-2"
        >
          {TOOLS.map((t) => (
            <li key={t.label}>
              {t.to ? (
                <Link
                  to={t.to}
                  className={`${TOOL_CHIP} ${TOOL_LIVE}`}
                  style={LIVE_BORDER}
                >
                  {t.label}
                </Link>
              ) : (
                <span
                  className={`${TOOL_CHIP} border-border-subtle text-tertiary`}
                >
                  {t.label}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
