import { LuEyeOff } from "react-icons/lu";
import {
  ABILITIES_FROM_GEN,
  abilityLabel,
  affectsTypes,
} from "../lib/abilities";
import { CHIP, CHIP_OFF, CHIP_ON, CHIP_STATIC } from "./chipStyles";

// The Pokémon's ability roster, one chip each, exactly one selected (D-073).
//
// `FormChips` is the model and the two are deliberately the same gesture: a
// row of compact chips in a fixed band on the card, where picking one changes
// what the board says. **There is no "none" state** — in the games a Pokémon
// always has exactly one ability in play, so the board reads with the first
// slot until you say otherwise, and that default is spelled as no URL
// parameter at all (D-074).
//
// Two markers, and neither is colour alone (04_design §9):
//
//   · **The dot** means this ability changes type matchups — it is why the
//     STAB block says 0× where the chart says 2×. Deliberately the same dot
//     `GenerationStrip` puts on a generation whose board differs, because it is
//     the same statement: *this option changes the answer.* Unlike that one it
//     is a static property of the ability, so it does not move as the selection
//     does.
//   · **The icon** marks the hidden ability. It never appears more than once —
//     the hidden ability is always slot 3 and there is never a second one,
//     asserted over the whole dex in abilities.test.js.
//
// Both are said out loud in `sr-only` text on the same control, rather than
// hung on a `title` no keyboard or touch user can reach (D-065).
//
// **The two empty states render rather than collapse** (D-050). Below Gen 3
// nobody had abilities, and fourteen entries carry none at all; a band that
// vanished in either case would shove the board around and leave the reason to
// be inferred from a missing control. The band keeps its height either way,
// which is also what holds the three cards equal (PokemonCard's spec).
//
// **Without an `onSelect` it renders pills rather than buttons.** Home previews
// the tools with their own components but is not a second copy of them
// (D-043), so its board reports the ability instead of offering to change it —
// and a button that does nothing when clicked is worse than a label, both for a
// pointer and for the keyboard that would have to tab through it.
const ABILITY_CHIP = `${CHIP} gap-1.5 px-2 py-1 transition-colors`;

export default function AbilityChips({
  abilities,
  selected,
  onSelect = null,
  gen,
  label = "Ability",
}) {
  if (!abilities.length) {
    return (
      <span className="text-caption text-secondary">
        {gen != null && gen < ABILITIES_FROM_GEN
          ? `Abilities arrived in Gen ${ABILITIES_FROM_GEN}`
          : "No abilities"}
      </span>
    );
  }

  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {abilities.map(({ slug, hidden }) => {
        const active = slug === selected;
        const Chip = onSelect ? "button" : "span";
        return (
          <Chip
            key={slug}
            {...(onSelect
              ? {
                  type: "button",
                  "aria-pressed": active,
                  onClick: () => onSelect(slug),
                }
              : {})}
            className={`${ABILITY_CHIP} ${
              active ? CHIP_ON : onSelect ? CHIP_OFF : CHIP_STATIC
            }`}
          >
            {/* A pill carries no `aria-pressed`, so without this the selected
                one is distinguished by its fill and nothing else — colour
                alone, which 04_design §9 rules out. The button variant says it
                through `aria-pressed` instead. */}
            {active && !onSelect && <span className="sr-only">In play: </span>}
            {affectsTypes(slug, gen) && (
              <>
                <span
                  aria-hidden
                  className={`size-1.5 shrink-0 rounded-full ${
                    active ? "bg-accent-contrast" : "bg-accent"
                  }`}
                />
                <span className="sr-only">Changes type matchups: </span>
              </>
            )}
            {abilityLabel(slug)}
            {hidden && (
              <>
                <LuEyeOff aria-hidden size={11} className="shrink-0" />
                <span className="sr-only">, hidden ability</span>
              </>
            )}
          </Chip>
        );
      })}
    </div>
  );
}
