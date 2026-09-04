import { LuX } from "react-icons/lu";
import { CHIP, CHIP_OFF, CHIP_ON_FILLED } from "./chipStyles";
import { capitalize, typeColorVar, typeTextVar } from "../lib/types";
import { typesIn } from "../lib/typeChart";
import { toggleType } from "../lib/typeView";

// The defending typing: one chip per type that existed in the generation being
// read, choose up to two (D-051).
//
// Same chip vocabulary as the dex's type filters — colour and shape from
// chipStyles, a colour dot when off and the type's own fill when on — because it
// is the same gesture on the same data, and the two should not drift into
// looking like different kinds of control.
//
// The cap is expressed by dimming the rest once two are chosen, rather than by
// silently evicting one of the pair when a third is clicked. Dimmed chips keep
// `aria-disabled` instead of the real `disabled` attribute, so they stay in the
// tab order: a keyboard user who tabs into one gets told it is unavailable,
// where a genuinely disabled control would just be skipped with no explanation.
const GEOMETRY = "min-h-9 gap-1.5 px-3 py-1.5 transition-colors";

export default function TypePicker({ types, asof = null, onChange }) {
  const full = types.length >= 2;

  return (
    <div role="group" aria-label="Defending type">
      {/* The cap is not spelled out on screen: no other control on the site
          captions itself, and the dimming says it at the moment it matters.
          Screen reader users get it up front, where dimming is harder to
          notice at a glance. (D-052) */}
      <div className="text-overline text-tertiary mb-1.5">
        Defending type
        <span className="sr-only"> — pick up to two</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {typesIn(asof).map((type) => {
          const active = types.includes(type);
          const unavailable = full && !active;
          return (
            <button
              key={type}
              type="button"
              aria-pressed={active}
              aria-disabled={unavailable || undefined}
              onClick={() => !unavailable && onChange(toggleType(types, type))}
              className={`${CHIP} ${GEOMETRY} ${
                active ? CHIP_ON_FILLED : CHIP_OFF
              } ${unavailable ? "opacity-40" : ""}`}
              style={
                active
                  ? {
                      backgroundColor: typeColorVar(type),
                      color: typeTextVar(),
                    }
                  : undefined
              }
            >
              {/* Off chips still carry their colour, as a dot rather than a
                  fill — decorative, since the name is right beside it. */}
              {!active && (
                <span
                  aria-hidden
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: typeColorVar(type) }}
                />
              )}
              {capitalize(type)}
              {active && <LuX aria-hidden />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
