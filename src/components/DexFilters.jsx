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

// The dex's controls. Holds no view state of its own: it renders the view
// parsed from the URL and reports the next one up, which the page writes back to
// the URL (D-022). The only local state is whether the panel is expanded on a
// phone, which is ephemeral UI, not something worth a link.
//
// The generation lens leads, above a divider, because it is not a peer of the
// filters — it decides which Pokémon exist here at all, and therefore which
// types and generations the filters below it can even offer (D-049). Reading top
// to bottom is the actual relationship: choose the dex, then narrow it. It lives
// inside this panel but OUTSIDE the collapsible region, like the name box, so it
// stays on screen when the chip groups fold away on a phone. (D-050)
//
// Three labelled groups — Types, Introduced in, Options. The labels are what
// stop the lone "Alternate forms" toggle reading as a stray control: it is a
// peer group rather than an orphan in a bar of controls. (D-040)
//
// "Introduced in" rather than "Generations", because two generation controls now
// share this panel and one bare label cannot serve both: the strip above chooses
// *which dex you are looking at*, this chooses *where a Pokémon came from*.
// Naming the second for what it actually filters keeps them apart. (D-050)

// The field look is shared with SearchBar (fieldStyles.jsx, D-135), and so is
// the reasoning behind its two numbers:
//
//   · **16px type, not 14** (D-065). iOS Safari force-zooms the page when a
//     control smaller than 16px takes focus, and never zooms back. A responsive
//     variant is not an option, because the named text styles are hand-written
//     `@layer components` classes and `md:text-body-sm` generates no CSS.
//   · **Height at the call site.** Appending `h-9` to a string carrying `h-11`
//     does not override it — Tailwind resolves that by stylesheet order — and
//     the select once rendered 44px beside its 36px neighbours (D-042).

export default function DexFilters({ view, onChange }) {
  const [open, setOpen] = useState(false);
  // Two counts on purpose. The disclosure badge reports only what is inside the
  // panel it opens — counting the always-visible name box would show "(1)" for
  // a panel with nothing active in it. "Clear all" uses the true total, since
  // clearing does include the name box.
  const panelCount = panelFilterCount(view);
  const totalCount = activeFilterCount(view);
  // Both lists narrow with the lens: no Fairy chip in a Gen 5 dex, no Gen 7
  // origin chip in a Gen 3 one. A control that offers a value the view cannot
  // hold would just produce an empty table (D-049).
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

      {/* Phone-only row. Sorting lives here because the six stat column headers
          are hidden below md, and it sits OUTSIDE the collapsible region — you
          should not have to open the filters to change the sort. */}
      <div className="flex items-center gap-2 md:hidden">
        <label className="sr-only" htmlFor="dex-sort">
          Sort by
        </label>
        <select
          id="dex-sort"
          value={view.sort}
          onChange={(e) => onChange({ ...view, sort: e.target.value })}
          // min-w-0 because a flex item will not shrink below its content's
          // intrinsic width by default, and this select's longest option is
          // "Sort: Base stat total" — without it the row pushed the Filters
          // button off the side of a 320px screen. (D-055)
          className={`h-9 min-w-0 flex-1 ${FIELD_LOOK}`}
        >
          {sortKeysFor(view.asof).map((key) => (
            <option key={key} value={key}>
              Sort: {SORT_LONG_LABEL[key]}
            </option>
          ))}
        </select>
        {/* The outline icon button: it stands in a row of bordered controls,
            where a borderless one would read as a gap (IconButton). */}
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

      {/* 27 chips is a lot of vertical space above the thing people came for, so
          on a phone they collapse behind the button above; at md and up there is
          room and they stay open. */}
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
          {/* Hidden when the lens leaves it only one option: filtering the Gen 1
              dex down to "introduced in Gen 1" is every row it already has, so
              the control could only ever be a no-op sitting under a strip that
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

        {/* A ghost Button (D-135): the quiet action, at the compact control
            height. It was bare caption text about 15px tall, where the other
            quiet action on the site, "Clear record", was a 36px pill. */}
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
