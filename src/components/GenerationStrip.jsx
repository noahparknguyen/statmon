import { CURRENT_GEN } from "../lib/eras";
import ChipGroup from "./ChipGroup";
import { CHIP, CHIP_OFF, CHIP_ON } from "./chipStyles";

// The generation selector, used by every tool and both games' setup: one
// numbered chip per generation the caller offers, with the newest standing for
// today.
//
// Three things about it are decisions rather than defaults:
//
//   · It's always rendered. A control that arrives with the first selection
//     pushes the page around as it lands, and its absence explains nothing.
//   · `label` states its scope: "Stats as of" where only the numbers change,
//     "Chart as of" for the type chart, and "Dex as of" on /dex, where the
//     generation also decides which Pokémon are in the table at all. It's the
//     group's accessible name too.
//   · Numerals, not ranges. Nine chips reading "Gen 2–5" don't fit beside the
//     Swap button at any width, and a generation is a number people already
//     think in.
//
// The caller decides which generations are on offer, because that range is
// what stops you reading a Gen 1 board for a Pokémon that didn't exist yet, and
// only the caller knows it.
//
// `differs` marks a generation whose board isn't today's. Only the comparison
// sets it. The dex leaves it off: across 1,259 rows, almost every generation
// has something that changed, so every chip would be marked.

// Colour and pill shape come from the shared chip styles (chipStyles.jsx). Only
// the size is set here: 36px tall around a single numeral, and as wide as the
// fitted group allows, from 36px where there's room down to about 25px on a
// 320px phone, so all nine stay on one line (ChipGroup's `fit`). In a wrapping
// row, the ninth chip, the one selected by default, would sit alone on a second
// line at 390px.
const GEN_CHIP = `${CHIP} relative h-9 w-full min-w-0 justify-center transition-colors`;

export default function GenerationStrip({ label, options, asof, onSelect }) {
  const active = asof ?? CURRENT_GEN;

  return (
    <ChipGroup label={label} name={`${label} generation`} fit>
      {options.map(({ gen: option, differs }) => {
        const isActive = option === active;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={isActive}
            // The newest generation is the current view, which the URL writes
            // as no parameter at all, so it reports null rather than its own
            // number, and a shared link stays clean.
            onClick={() => onSelect(option === CURRENT_GEN ? null : option)}
            className={`${GEN_CHIP} ${isActive ? CHIP_ON : CHIP_OFF}`}
          >
            {/* The visible label is a bare numeral, so the accessible name is
                  built around it rather than replacing it: WCAG 2.5.3 needs
                  the visible text inside the accessible name, and "5" alone
                  tells a screen reader nothing. */}
            <span className="sr-only">Generation </span>
            {option}
            {differs && (
              <>
                <span
                  aria-hidden
                  className={`absolute bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full ${
                    isActive ? "bg-accent-contrast" : "bg-accent"
                  }`}
                />
                {/* The dot isn't the only cue: what it means is also said
                      here. Not "stats differ", because a changed ability marks
                      a generation too: Chandelure's Gen 5 board differs only
                      by its hidden ability. */}
                <span className="sr-only">, differs from today</span>
              </>
            )}
          </button>
        );
      })}
    </ChipGroup>
  );
}
