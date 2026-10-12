import MatchupSummary, { DefenderHeading } from "./MatchupSummary";
import { artworkFor, getBySlug } from "../lib/pokemon";
import { eraView } from "../lib/eras";
import { defaultAbility } from "../lib/abilities";
import { parseTypes } from "../lib/typeView";

// Home's type-chart preview, built from the tool's own MatchupSummary against
// the real chart rather than a mock-up, as FeaturedDex uses DexRow and
// FeaturedComparison uses CmpRow.
//
// It tells the defensive story: MatchupSummary answers "what does every
// attacking type do to this typing", so what's on screen is what beats
// Krookodile. That's the question people bring to a type chart.
//
// It has to be a dual type. The section promises every matchup, including dual
// types, which other charts only manage with a page per pairing, so a single
// type would advertise the one thing the tool isn't needed for. Ground/Dark
// also has a good shape: six attacking types at 2×, and two that do nothing at
// all, so the dropped empty tiers are visible rather than described.
// Krookodile is on the Black and White team too (see FeaturedDex).
//
// It's previewed as a Pokémon rather than a bare typing, because the tool
// searches by Pokémon: "what beats Krookodile" is something you can type, where
// "what beats Ground/Dark" needs you to know the typing first. Krookodile's
// abilities don't touch type effectiveness, so the tiers are the same either
// way. This preview shows off the search, and the comparison board above shows
// off abilities.
//
// The art sits beside the tiers rather than peeking from behind them, unlike
// the comparison board and the dex table: this content is a short list of thin
// rows, and art behind it would be sliced by every row edge instead of framed
// by one card.
const MON = getBySlug("krookodile");
const TYPES = MON ? parseTypes(MON.types) : [];
const ABILITY = MON ? defaultAbility(MON) : null;

export default function FeaturedTypes() {
  if (!MON) return null;
  const view = eraView(MON, null);

  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center lg:flex-row lg:justify-center lg:gap-10">
      <div className="w-full max-w-xl">
        {/* One level under the section's <h2>. The tier list is unreadable
            without it: "2× Water" means nothing until you know what's being
            attacked. Home previews the tool rather than copying it, so the
            chips report the ability rather than select it. */}
        <DefenderHeading
          as="h3"
          pokemon={MON}
          types={TYPES}
          abilities={view.abilities}
          ability={ABILITY}
        />
        {/* The ability is passed through, even though Krookodile's don't touch
            effectiveness and the tiers are the same either way. Tiers computed
            without the ability shown beside them would be a preview that
            disagrees with the tool, silently, until the featured Pokémon
            changed. */}
        <MatchupSummary types={TYPES} ability={ABILITY} />
      </div>

      {/* Decorative, and desktop-only, like the comparison board's mascots:
          below lg the tiers need the whole column, and art that overflows
          scrolls the whole page sideways (`npm run sweep:widths` catches it).
          Lazy, unlike the board's art: this one is below the fold, and Home is
          the only route that isn't code-split. */}
      <img
        src={artworkFor(MON)}
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        className="hidden lg:block pointer-events-none w-64 shrink-0 rotate-3 drop-shadow-art"
      />
    </div>
  );
}
