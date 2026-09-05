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
import FilterChip from "./FilterChip";

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

// Height is deliberately NOT part of this: the mobile sort row wants a compact
// control, and appending "h-9" to a string already carrying "h-11" does not
// override it — Tailwind resolves that conflict by stylesheet order, not by the
// order the classes are written, so the select silently rendered 44px next to
// its 36px neighbours. Each call site sets its own height instead.
// `text-body` (16px), not `text-body-sm`. Two reasons, and the first is a real
// bug: **iOS Safari force-zooms the page when a control smaller than 16px takes
// focus**, and never zooms back — so tapping this filter or the sort select on
// an iPhone left the site zoomed in. `SearchBar` was already 16px and safe,
// which also made these the site's two search inputs at two different sizes.
// A responsive variant is not an option here: the named text styles are
// hand-written `@layer components` classes, so `md:text-body-sm` generates no
// CSS (06_style_guide §13). (D-065)
const FIELD_LOOK =
  "rounded-sm border border-border-subtle bg-elevated px-3 text-body text-primary transition-colors focus-within:border-border-strong";
const FIELD = `h-11 ${FIELD_LOOK}`;

function Group({ label, children }) {
  return (
    <div role="group" aria-label={label}>
      <div className="text-overline text-tertiary mb-2">{label}</div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

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
    <div className="rounded-lg border border-border-subtle bg-surface p-4">
      <div className="mb-4 border-b border-border-subtle pb-4">
        <GenerationStrip
          label="Dex as of"
          options={allGenerations()}
          asof={view.asof}
          onSelect={(asof) => onChange(setAsOf(view, asof))}
        />
      </div>

      <div className={`flex items-center gap-2 ${FIELD}`}>
        <LuSearch aria-hidden className="shrink-0 text-tertiary" />
        <input
          type="search"
          aria-label="Filter by name"
          placeholder="Filter by name"
          value={view.q}
          onChange={(e) => onChange({ ...view, q: e.target.value })}
          className="w-full bg-transparent text-body text-primary outline-none placeholder:text-tertiary"
        />
      </div>

      {/* Phone-only row. Sorting lives here because the six stat column headers
          are hidden below md, and it sits OUTSIDE the collapsible region — you
          should not have to open the filters to change the sort. */}
      <div className="mt-3 flex items-center gap-2 md:hidden">
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
        <button
          type="button"
          onClick={() =>
            onChange({ ...view, dir: view.dir === "asc" ? "desc" : "asc" })
          }
          aria-label={`Sorted ${view.dir === "asc" ? "ascending" : "descending"}; reverse the order`}
          className={`flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors ${CHIP_OFF}`}
        >
          {view.dir === "asc" ? (
            <FaCaretUp aria-hidden />
          ) : (
            <FaCaretDown aria-hidden />
          )}
        </button>
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
        className={`${open ? "" : "hidden"} mt-4 flex flex-col gap-4 md:mt-3 md:flex`}
      >
        <Group label="Types">
          {types.map((t) => (
            <FilterChip
              key={t}
              active={view.types.includes(t)}
              onClick={() => onChange(toggleType(view, t))}
              label={capitalize(t)}
              color={t}
            />
          ))}
        </Group>

        <div className="flex flex-col gap-4 md:flex-row md:gap-10">
          {/* Hidden when the lens leaves it only one option: filtering the Gen 1
              dex down to "introduced in Gen 1" is every row it already has, so
              the control could only ever be a no-op sitting under a strip that
              looks just like it. */}
          {generations.length > 1 && (
            <Group label="Introduced in">
              {generations.map((g) => (
                <FilterChip
                  key={g}
                  active={view.gens.includes(g)}
                  onClick={() => onChange(toggleGen(view, g))}
                  label={`Gen ${g}`}
                />
              ))}
            </Group>
          )}

          <Group label="Options">
            <FilterChip
              active={!view.includeForms}
              onClick={() =>
                onChange({ ...view, includeForms: !view.includeForms })
              }
              label="Hide alternate forms"
            />
          </Group>
        </div>

        {totalCount > 0 && (
          <div>
            <button
              type="button"
              onClick={() => onChange(clearFilters(view))}
              className="flex items-center gap-1 text-caption text-tertiary transition-colors hover:text-primary"
            >
              <LuX aria-hidden />
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
