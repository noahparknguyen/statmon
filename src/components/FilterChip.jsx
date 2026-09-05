import { LuX } from "react-icons/lu";
import {
  CHIP,
  CHIP_FILTER_GEOMETRY,
  CHIP_OFF,
  CHIP_ON,
  CHIP_ON_FILLED,
} from "./chipStyles";
import { typeColorVar, typeTextVar } from "../lib/types";

// The toggle chip used by the dex's filters and the type chart's picker.
//
// These were two components until now, and they were the same one: the same
// `CHIP` base, a byte-identical geometry string, the same colour dot when off,
// the same type fill and trailing × when on. `chipStyles.jsx` had already pulled
// the *colours* into one place (D-048) and stopped one level short, leaving the
// markup itself duplicated in `DexFilters` and `TypePicker` — which is the exact
// drift that module exists to prevent, one rung up.
//
// The only genuine difference between the two call sites is the type chart's
// two-type cap, so that is the only prop that survives as behaviour:
// `unavailable` dims the chip and marks it `aria-disabled` while keeping it in
// the tab order, so a keyboard user who lands on one is told it is unavailable
// rather than having it silently skipped (D-051).
//
// **No `aria-label`, deliberately.** The visible text is the accessible name.
// Spelling the action out ("Filter by Generation 1") would replace the name with
// a string that does not contain the visible "Gen 1", failing WCAG 2.5.3 (Label
// in Name) and leaving speech control unable to act on the chip. The enclosing
// group's label and `aria-pressed` already supply the context.
export default function FilterChip({
  active,
  onClick,
  label,
  color,
  unavailable = false,
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-disabled={unavailable || undefined}
      onClick={() => !unavailable && onClick()}
      className={`${CHIP} ${CHIP_FILTER_GEOMETRY} ${
        active ? (color ? CHIP_ON_FILLED : CHIP_ON) : CHIP_OFF
      } ${unavailable ? "opacity-40" : ""}`}
      style={
        active && color
          ? { backgroundColor: typeColorVar(color), color: typeTextVar() }
          : undefined
      }
    >
      {/* An inactive chip still carries its colour, as a dot rather than a fill
          — decorative, since the type's name is right beside it. */}
      {!active && color && (
        <span
          aria-hidden
          className="size-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: typeColorVar(color) }}
        />
      )}
      {label}
      {active && <LuX aria-hidden />}
    </button>
  );
}
