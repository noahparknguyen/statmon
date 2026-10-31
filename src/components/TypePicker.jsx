import ChipGroup from "./ChipGroup";
import FilterChip from "./FilterChip";
import { capitalize } from "../lib/types";
import { typesIn } from "../lib/typeChart";
import { toggleType } from "../lib/typeView";

// The defending typing: one chip per type that existed in the generation being
// read, choose up to two.
//
// The chip is `FilterChip`, the same component the dex's type filters use,
// because it's the same gesture on the same data, and the two shouldn't drift
// into looking like different kinds of control. Only the cap below is local.
//
// Two layouts: `chips`, wrapped pills in the desktop's panel, and `tiles`, three
// even columns of 44px tiles in a phone's picker (DefenderBar), where choosing
// a type is the page's main action.
//
// The cap dims the rest once two are chosen, rather than silently dropping one
// of the pair when a third is clicked. Dimmed chips use `aria-disabled` rather
// than `disabled`, so they stay in the tab order: a keyboard user who tabs to
// one is told it's unavailable, where a disabled control would be skipped with
// no explanation.
export default function TypePicker({
  types,
  asof = null,
  onChange,
  layout = "chips",
}) {
  const full = types.length >= 2;
  const tiles = layout === "tiles";

  // The cap isn't spelled out on screen: the dimming says it at the moment it
  // matters. Screen reader users get it up front, in the group's name, rather
  // than only on reaching a dimmed chip.
  return (
    <ChipGroup
      label="Defending type"
      name="Defending type, pick up to two"
      tiles={tiles}
    >
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
            shape={tiles ? "tile" : "chip"}
          />
        );
      })}
    </ChipGroup>
  );
}
