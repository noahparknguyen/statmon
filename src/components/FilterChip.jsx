import { LuX } from "react-icons/lu";
import {
  CHIP,
  CHIP_FILTER_GEOMETRY,
  CHIP_OFF,
  CHIP_ON,
  CHIP_ON_FILLED,
} from "./chipStyles";
import { typeColorVar, typeTextVar } from "../lib/types";

// The toggle chip used by the dex's filters, the type chart's picker, and both
// games' setup: one component, so a chip looks and behaves the same everywhere.
//
// Only real differences in behaviour between callers are props, and there are
// two:
//
//   · `unavailable` dims the chip and marks it `aria-disabled` while keeping it
//     in the tab order, so a keyboard user who lands on one is told it's
//     unavailable rather than having it silently skipped. The type chart's
//     two-type cap uses it.
//   · `removable` is what the trailing × means, and it isn't decoration. In the
//     dex and the type picker, an active chip turns off when clicked, and the ×
//     says so. The games' single-select chips can't be turned off: clicking the
//     active one picks it again. A × there would promise a dismissal that never
//     happens, so it goes.
//
// No `aria-label`, on purpose. The visible text is the accessible name.
// Spelling out the action ("Filter by Generation 1") would replace it with a
// name that doesn't contain the visible "Gen 1", failing WCAG 2.5.3 (Label in
// Name), and leaving speech control unable to act on the chip. The group's
// label and `aria-pressed` already give the context.
//
// `shape` is the one difference in look. A `chip` is the pill every filter
// row uses. A `tile` fills a cell of a grid, 44px tall with 14px text, for a
// phone's type picker: choosing a type is that page's main action, and a
// phone's main action is 44px (style guide, Phones), where a pill is 36. Same
// colours, same states.
const SHAPE = {
  chip: `${CHIP} ${CHIP_FILTER_GEOMETRY}`,
  tile: "inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-md border px-2 text-body-sm transition-colors",
};

export default function FilterChip({
  active,
  onClick,
  label,
  color,
  unavailable = false,
  removable = true,
  shape = "chip",
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-disabled={unavailable || undefined}
      onClick={() => !unavailable && onClick()}
      className={`${SHAPE[shape]} ${
        active ? (color ? CHIP_ON_FILLED : CHIP_ON) : CHIP_OFF
      } ${unavailable ? "opacity-40" : ""}`}
      style={
        active && color
          ? { backgroundColor: typeColorVar(color), color: typeTextVar() }
          : undefined
      }
    >
      {/* An inactive chip still carries its colour, as a dot rather than a
          fill. Decorative, since the type's name is right beside it. */}
      {!active && color && (
        <span
          aria-hidden
          className="size-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: typeColorVar(color) }}
        />
      )}
      {label}
      {active && removable && <LuX aria-hidden />}
    </button>
  );
}
