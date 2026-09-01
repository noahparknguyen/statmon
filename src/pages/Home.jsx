import { Link } from "react-router";
import { LuArrowRight } from "react-icons/lu";
import Button from "../components/Button";
import FeaturedComparison from "../components/FeaturedComparison";
import FeaturePreview from "../components/FeaturePreview";
import FeaturedDex from "../components/FeaturedDex";
import { getBySlug, artworkFor } from "../lib/pokemon";

// Home (D-023): product-as-hero. The header frames the whole site (a small suite
// of Pokémon tools); the live board below demonstrates the flagship comparison
// tool with the site's pseudo-mascots, Volcarona vs Chandelure — their pixel
// sprites sit inside the cards while their illustrations peek out from behind
// the board for a nostalgic feel. Copy is blunt — it states what the site is.
const V = getBySlug("volcarona");
const C = getBySlug("chandelure");

// The two that exist link to themselves — a row advertising live tools that
// cannot be clicked is a dead end, and there are two of them now.
const TOOLS = [
  { label: "Comparison", to: "/compare" },
  { label: "Dex table", to: "/dex" },
  { label: "Type chart · soon" },
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
    <div className="max-w-content mx-auto px-4 pt-16 pb-20 overflow-hidden">
      <header className="text-center">
        <h1 className="text-display-hero">
          Statmon<span className="text-accent">.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-body-lg text-secondary">
          A simple set of Pokémon tools.
        </p>
      </header>

      {V && C && (
        <div className="relative mt-14 max-w-2xl mx-auto">
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

      <div className="mt-8 flex justify-center">
        <Button to="/compare">
          Try it out
          <LuArrowRight aria-hidden />
        </Button>
      </div>

      {/* Every feature the site ships gets a live preview here (D-043). The
          comparison board above is the hero and keeps its own treatment; this is
          the repeatable section each later tool adds. */}
      <FeaturePreview
        title="Dex"
        description="Every Pokémon, sorted by any stat."
        to="/dex"
        cta="Open the dex"
      >
        <FeaturedDex />
      </FeaturePreview>

      {/* Labelled so a screen reader announces what the list is; without it
          this is four bare items with no context. */}
      <ul
        aria-label="Statmon tools"
        className="mt-20 flex flex-wrap justify-center gap-2"
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
  );
}
