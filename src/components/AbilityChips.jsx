import { LuEyeOff } from "react-icons/lu";
import {
  ABILITIES_FROM_GEN,
  abilityLabel,
  affectsTypes,
} from "../lib/abilities";
import { CHIP, CHIP_OFF, CHIP_ON, CHIP_STATIC } from "./chipStyles";

// A Pokémon's abilities, one chip each, with exactly one selected.
//
// The same gesture as `FormChips`, on purpose: a row of compact chips in a fixed
// band on the card, where picking one changes what the board says. There's no
// "none" state: in the games a Pokémon always has exactly one ability in play,
// so the board uses the first until you choose another, and that default is
// written as no URL parameter at all.
//
// Two markers, and neither is colour alone:
//
//   · The dot means this ability changes type matchups: it's why the type chips
//     say 0× where the chart says 2×. The same dot `GenerationStrip` puts on a
//     generation whose board differs, because it says the same thing: this
//     option changes the answer. Unlike that one, it belongs to the ability,
//     so it doesn't move as the selection does.
//   · The icon marks the hidden ability. It never appears more than once: the
//     hidden ability is always slot 3, and there's never a second one, which
//     abilities.test.js checks across the whole dex.
//
// Both are also said in screen-reader text on the same control, rather than in
// a `title` that no keyboard or touch user can reach.
//
// The two empty states render rather than collapse. Below Gen 3 nobody had
// abilities, and 14 entries have none at all. A band that vanished in either
// case would shove the board around, and leave the reason to be guessed from a
// missing control. The band keeps its height either way, which also keeps the
// three cards equal (see PokemonCard).
//
// Without an `onSelect`, it renders pills rather than buttons. Home previews the
// tools with their own components, but isn't a second copy of them, so its
// board reports the ability rather than offering to change it. A button that
// does nothing is worse than a label, for a pointer and for a keyboard that
// would have to tab through it.
const ABILITY_CHIP = `${CHIP} gap-1.5 px-2 py-1 transition-colors`;

// `markEffect` turns the accent dot off, for one caller. On /compare and /types
// the dot is information: this ability changes the matchup. In the type game
// it would be the answer, saying "this one counts" before you've worked out
// whether it does. Chandelure with Flame Body has to look exactly as important
// as Chandelure with Flash Fire until you decide.
export default function AbilityChips({
  abilities,
  selected,
  onSelect = null,
  gen,
  label = "Ability",
  markEffect = true,
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
            {/* A pill has no `aria-pressed`, so without this the selected one
                would be marked by its fill alone, which is colour alone. The
                button version says it through `aria-pressed` instead. */}
            {active && !onSelect && <span className="sr-only">In play: </span>}
            {markEffect && affectsTypes(slug, gen) && (
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
                <LuEyeOff aria-hidden className="shrink-0" />
                <span className="sr-only">, hidden ability</span>
              </>
            )}
          </Chip>
        );
      })}
    </div>
  );
}
