import MatchupSummary, { DefenderHeading } from "./MatchupSummary";
import { artworkFor, getBySlug } from "../lib/pokemon";
import { eraView } from "../lib/eras";
import { defaultAbility } from "../lib/abilities";
import { parseTypes } from "../lib/typeView";

// Home's type-chart preview (D-043, framed by D-067 and D-068), built from the
// tool's own MatchupSummary against the real chart — not a mockup, the same rule
// that keeps FeaturedDex on DexRow and FeaturedComparison on CmpRow (D-032).
//
// It tells the **defensive** story: MatchupSummary answers "what does every
// attacking type do to this typing", so what is on screen is what beats
// Krookodile. That is the question people bring to a type chart.
//
// **Krookodile, and it has to be a dual type.** The section's own promise is
// "every matchup, including dual types" — the thing no other chart does without
// a page per pairing (D-051) — so previewing it with a single type would
// advertise the one capability the tool does not need to exist for. Ground/Dark
// also reads well as a shape: six attacking types at 2×, and two that do
// nothing at all, so the dropped-empty-tiers behaviour is visible rather than
// described. It is on the Black & White team too (D-044).
//
// **It is now previewed as a Pokémon rather than as a bare typing** (D-075).
// The tool grew a Pokémon search, and a preview that still asked the page's old
// question would advertise the version before it: "what beats Krookodile" is
// the thing you can now type, where "what beats Ground / Dark" is the thing you
// had to already know how to ask. Krookodile's abilities do not touch type
// effectiveness, so the tiers below are unchanged — this preview sells the
// search, and the flagship board above sells the ability (D-074).
//
// Side by side rather than the mascot peeking from behind, because unlike the
// flagship board and the dex table this content is a short list of thin rows: art
// behind it gets sliced by five row edges instead of framed by one card.
const MON = getBySlug("krookodile");
const TYPES = MON ? parseTypes(MON.types) : [];
const ABILITY = MON ? defaultAbility(MON) : null;

export default function FeaturedTypes() {
  if (!MON) return null;
  const view = eraView(MON, null);

  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center lg:flex-row lg:justify-center lg:gap-10">
      <div className="w-full max-w-xl">
        {/* One rung under the section's own <h2>. The tier list is unreadable
            without it: "2× Water" means nothing until you know what is being
            attacked. Non-interactive here — Home previews the tool, it is not a
            second copy of it — so the chips report rather than select. */}
        <DefenderHeading
          as="h3"
          pokemon={MON}
          types={TYPES}
          abilities={view.abilities}
          ability={ABILITY}
        />
        {/* The ability goes through, even though Krookodile's do not touch
            effectiveness and the tiers are identical either way. A preview that
            shows an ability beside tiers computed without it is the "preview
            disagrees with the tool" failure D-032/D-043 exist to prevent — it
            would just be silent until the featured Pokémon changed. */}
        <MatchupSummary types={TYPES} ability={ABILITY} />
      </div>

      {/* Decorative, and desktop-only for the reason the flagship's mascots are:
          below lg the tiers need the whole column, and art that overflows
          scrolls the whole page sideways (caught by npm run sweep:widths).
          Lazy where the flagship's art is not — this one is below the fold, and
          Home is the only route that is not code-split (D-060). */}
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
