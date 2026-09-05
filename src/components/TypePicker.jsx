import FilterChip from "./FilterChip";
import { capitalize } from "../lib/types";
import { typesIn } from "../lib/typeChart";
import { toggleType } from "../lib/typeView";

// The defending typing: one chip per type that existed in the generation being
// read, choose up to two (D-051).
//
// The chip itself is `FilterChip` — literally the same component the dex's type
// filters use, because it is the same gesture on the same data and the two must
// not drift into looking like different kinds of control. This file used to
// carry its own copy of that markup; only the cap below is genuinely local.
//
// **Why this does NOT collapse on a phone, where the dex's type chips do.**
// The two look like the same control at the same width, and only one of them
// folds away behind a disclosure — which reads as drift until you ask what each
// one is for. On /dex the type chips are one optional filter among several, and
// the payload (the table) is below them, so hiding them puts the answer higher
// on the screen. Here the picker IS the tool: collapsing it would put a tap in
// front of the only interaction the page has. So the deviation stays, and this
// is the reason. (D-058)
//
// The cap is expressed by dimming the rest once two are chosen, rather than by
// silently evicting one of the pair when a third is clicked. Dimmed chips keep
// `aria-disabled` instead of the real `disabled` attribute, so they stay in the
// tab order: a keyboard user who tabs into one gets told it is unavailable,
// where a genuinely disabled control would just be skipped with no explanation.
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
          return (
            <FilterChip
              key={type}
              active={active}
              unavailable={full && !active}
              onClick={() => onChange(toggleType(types, type))}
              label={capitalize(type)}
              color={type}
            />
          );
        })}
      </div>
    </div>
  );
}
