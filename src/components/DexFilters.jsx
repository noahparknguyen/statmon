import { useState } from "react";
import { LuSearch, LuX, LuSlidersHorizontal } from "react-icons/lu";
import { FaCaretDown, FaCaretUp } from "react-icons/fa6";
import GenerationStrip from "./GenerationStrip";
import { allGenerations } from "../lib/eras";
import {
  SORT_LONG_LABEL,
  setAsOf,
  activeFilterCount,
  clearFilters,
  generationsFor,
  panelFilterCount,
  sortKeysFor,
  toggleGen,
  toggleType,
  typesFor,
} from "../lib/dexTable";
import { capitalize } from "../lib/types";
import { CHIP, CHIP_FILTER_GEOMETRY, CHIP_OFF, CHIP_ON } from "./chipStyles";
import { FIELD, FIELD_INPUT, FIELD_LOOK } from "./fieldStyles";
import { PANEL, RULE_BELOW } from "./pageChrome";
import Button from "./Button";
import FilterChip from "./FilterChip";
import ChipGroup from "./ChipGroup";
import IconButton from "./IconButton";

// The dex's controls. They hold no view state of their own: they render the
// view read from the URL and report the next one, which the page writes back to
// the URL. The only local state is whether the panel is open on a phone, which
// isn't worth a link.
//
// The generation strip comes first, above a divider, because it isn't one of
// the filters: it decides which Pokémon exist here at all, and so which types
// and generations the filters below can offer. Top to bottom is the order of
// that relationship: choose the dex, then narrow it. It sits inside this panel
// but outside the collapsible part, like the name box, so it stays on screen
// when the chip groups fold away on a phone.
//
// Three labelled groups: Types, Introduced in, and Options. The labels keep the
// lone forms toggle from looking like a stray control: it's a group of its own.
//
// "Introduced in" rather than "Generations", because this panel has two
// generation controls: the strip above picks which dex you're looking at, and
// this picks where a Pokémon came from. Naming it for what it filters keeps the
// two apart.

// The field's look is shared with SearchBar (fieldStyles.jsx), with the same
// reasons for its two numbers:
//
//   · 16px text, not 14. iOS Safari zooms the page in when a control smaller
//     than 16px takes focus, and never zooms back out. A responsive variant
//     isn't an option, because the named text styles are hand-written classes
//     and `md:text-body-sm` produces no CSS.
//   · The height is set at each call site. Adding `h-9` to a string that
//     already has `h-11` doesn't override it, because Tailwind resolves the
//     clash by stylesheet order.

export default function DexFilters({ view, onChange }) {
  const [open, setOpen] = useState(false);
  // Two counts, on purpose. The disclosure's badge counts only what's inside
  // the panel it opens: counting the always-visible name box would show "(1)"
  // on a panel with nothing set. "Clear all" uses the full count, because
  // clearing includes the name box.
  const panelCount = panelFilterCount(view);
  const totalCount = activeFilterCount(view);
  // Both lists narrow with the dex's generation: no Fairy chip in a Gen 5 dex,
  // and no Gen 7 origin chip in a Gen 3 one. A control offering a value the
  // view can't hold would only produce an empty table.
  const types = typesFor(view.asof);
  const generations = generationsFor(view.asof);

  return (
    <div className={PANEL}>
      <div className={RULE_BELOW}>
        <GenerationStrip
          label="Dex as of"
          options={allGenerations()}
          asof={view.asof}
          onSelect={(asof) => onChange(setAsOf(view, asof))}
        />
      </div>

      <div className={FIELD}>
        <LuSearch aria-hidden className="shrink-0 text-tertiary" />
        <input
          type="search"
          aria-label="Filter by name"
          placeholder="Filter by name"
          value={view.q}
          onChange={(e) => onChange({ ...view, q: e.target.value })}
          className={FIELD_INPUT}
        />
      </div>

      {/* A phone-only row. Sorting lives here because the stat column headers
          are hidden below md, and it sits outside the collapsible part, since
          you shouldn't have to open the filters to change the sort. */}
      <div className="flex items-center gap-2 md:hidden">
        <label className="sr-only" htmlFor="dex-sort">
          Sort by
        </label>
        <select
          id="dex-sort"
          value={view.sort}
          onChange={(e) => onChange({ ...view, sort: e.target.value })}
          // min-w-0 because a flex item won't shrink below its content's width
          // by default, and this select's longest option is "Sort: Base stat
          // total". Without it, the row would push the Filters button off a
          // 320px screen.
          className={`h-9 min-w-0 flex-1 ${FIELD_LOOK}`}
        >
          {sortKeysFor(view.asof).map((key) => (
            <option key={key} value={key}>
              Sort: {SORT_LONG_LABEL[key]}
            </option>
          ))}
        </select>
        {/* The outline icon button, because it stands in a row of bordered
            controls, where a borderless one would look like a gap. */}
        <IconButton
          variant="outline"
          label={`Sorted ${view.dir === "asc" ? "ascending" : "descending"}; reverse the order`}
          onClick={() =>
            onChange({ ...view, dir: view.dir === "asc" ? "desc" : "asc" })
          }
        >
          {view.dir === "asc" ? (
            <FaCaretUp aria-hidden />
          ) : (
            <FaCaretDown aria-hidden />
          )}
        </IconButton>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="dex-filter-groups"
          onClick={() => setOpen((o) => !o)}
          className={`${CHIP} ${CHIP_FILTER_GEOMETRY} h-9 shrink-0 ${
            panelCount > 0 ? CHIP_ON : CHIP_OFF
          }`}
        >
          <LuSlidersHorizontal aria-hidden />
          Filters{panelCount > 0 && ` (${panelCount})`}
        </button>
      </div>

      {/* 28 chips take a lot of space above what people came for, so on a
          phone they fold away behind the button above. From md up there's
          room, and they stay open. */}
      <div
        id="dex-filter-groups"
        className={`${open ? "" : "hidden"} flex flex-col gap-4 md:flex`}
      >
        <ChipGroup label="Types">
          {types.map((t) => (
            <FilterChip
              key={t}
              active={view.types.includes(t)}
              onClick={() => onChange(toggleType(view, t))}
              label={capitalize(t)}
              color={t}
            />
          ))}
        </ChipGroup>

        <div className="flex flex-col gap-4 md:flex-row md:gap-10">
          {/* Hidden when the dex's generation leaves it one option: filtering
              the Gen 1 dex to "introduced in Gen 1" is every row it already
              has, so the control could only do nothing, under a strip that
              looks just like it. */}
          {generations.length > 1 && (
            <ChipGroup label="Introduced in">
              {generations.map((g) => (
                <FilterChip
                  key={g}
                  active={view.gens.includes(g)}
                  onClick={() => onChange(toggleGen(view, g))}
                  label={`Gen ${g}`}
                />
              ))}
            </ChipGroup>
          )}

          <ChipGroup label="Options">
            <FilterChip
              active={!view.includeForms}
              onClick={() =>
                onChange({ ...view, includeForms: !view.includeForms })
              }
              label="Hide alternate forms"
            />
          </ChipGroup>
        </div>

        {/* A ghost Button, the site's quiet action, at the compact control
            height, like "Clear record" in the games. */}
        {totalCount > 0 && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange(clearFilters(view))}
            >
              <LuX aria-hidden />
              Clear all filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
