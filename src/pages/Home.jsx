import { LuArrowRight } from "react-icons/lu";
import Button from "../components/Button";
import FeaturedComparison from "../components/FeaturedComparison";
import { getBySlug, artworkFor } from "../lib/pokemon";

// Home (D-023): product-as-hero. The header frames the whole site (a small suite
// of Pokémon tools); the live board below demonstrates the flagship comparison
// tool with the site's pseudo-mascots, Volcarona vs Chandelure — their pixel
// sprites sit inside the cards while their illustrations peek out from behind
// the board for a nostalgic feel. Copy is blunt — it states what the site is.
const V = getBySlug("volcarona");
const C = getBySlug("chandelure");

const TOOLS = [
  { label: "Comparison", live: true },
  { label: "Dex table · soon" },
  { label: "Type chart · soon" },
  { label: "Games · soon" },
];

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

      {/* Labelled so a screen reader announces what the list is; without it
          this is four bare items with no context. */}
      <ul
        aria-label="Statmon tools"
        className="mt-8 flex flex-wrap justify-center gap-2"
      >
        {TOOLS.map((t) => (
          <li
            key={t.label}
            className={`text-caption rounded-full border px-3 py-1 ${
              t.live ? "text-accent" : "text-tertiary border-border-subtle"
            }`}
            style={
              t.live
                ? {
                    borderColor:
                      "color-mix(in srgb, var(--color-accent) 45%, transparent)",
                  }
                : undefined
            }
          >
            {t.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
