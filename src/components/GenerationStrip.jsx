import { CURRENT_GEN } from "../lib/eras";
import { CHIP, CHIP_OFF, CHIP_ON } from "./chipStyles";

// The generation selector, shared by both tools: one numbered chip per
// generation the caller offers, with the newest standing for today.
//
// Three things about it are decisions rather than defaults:
//
//   · **It is always rendered** (D-050). A control that arrives with the first
//     selection also pushes the page around as it lands, and its absence taught
//     nobody why it was absent.
//   · **`label` states its scope** and is not decoration: "Stats as of" on
//     /compare, where only the numbers change, and "Dex as of" on /dex, where
//     the generation also decides which Pokémon are in the table at all. It
//     drives the group's accessible name too.
//   · **Numerals, not ranges.** Nine chips reading "Gen 2–5" do not fit beside
//     the Swap button at any width, and a generation is a number people already
//     think in.
//
// Which generations are on offer is the caller's to decide — that range is
// where "you cannot read a Gen 1 board against a Pokémon that did not exist
// yet" is enforced (D-045), and the caller is what knows it.
//
// `differs` marks a generation whose board is not today's. The comparison tool
// sets it; the dex leaves it off, because across 1,259 rows almost every
// generation contains something that changed and every chip would be marked
// (D-049).

// Colour and pill shape come from the shared chip vocabulary (chipStyles.jsx);
// only the geometry is local — near-square around a single numeral, so nine of
// them fit beside Swap.
const GEN_CHIP = `${CHIP} relative h-9 min-w-9 justify-center px-2 transition-colors`;

export default function GenerationStrip({ label, options, asof, onSelect }) {
  const active = asof ?? CURRENT_GEN;

  return (
    <div role="group" aria-label={`${label} generation`} className="min-w-0">
      <div className="text-overline text-tertiary mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1">
        {options.map(({ gen: option, differs }) => {
          const isActive = option === active;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={isActive}
              // The newest generation is the current view, which the URL spells
              // as no parameter at all — so it reports null rather than its own
              // number and a shared link stays clean.
              onClick={() => onSelect(option === CURRENT_GEN ? null : option)}
              className={`${GEN_CHIP} ${isActive ? CHIP_ON : CHIP_OFF}`}
            >
              {/* The visible label is a bare numeral, so the accessible name is
                  built around it rather than replacing it — WCAG 2.5.3 needs
                  the visible text inside the accessible name, and "5" alone
                  tells a screen reader nothing (D-042). */}
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
                  {/* The dot is a second cue, not the only one: the fact it
                      carries is also said out loud here (04_design §1 rule 4).
                      It used to say "stats differ from today", which stopped
                      being true when a changed ability roster started marking
                      a generation too (D-073) — Gengar's Gen 6 board differs
                      by its ability alone. A screen reader user was being told
                      something specific and wrong; the visible dot never made
                      that claim. */}
                  <span className="sr-only">, differs from today</span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
