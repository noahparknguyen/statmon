import { useState } from "react";
import { LuSearch, LuSlidersHorizontal, LuX } from "react-icons/lu";
import Button from "./Button";
import ChipGroup from "./ChipGroup";
import DexFilterGroups from "./DexFilterGroups";
import Dialog from "./Dialog";
import FilterChip from "./FilterChip";
import GenerationStrip from "./GenerationStrip";
import { CHIP, CHIP_FILTER_GEOMETRY, CHIP_OFF, CHIP_ON } from "./chipStyles";
import { FIELD, FIELD_INPUT } from "./fieldStyles";
import { RULE_BELOW } from "./pageChrome";
import { allGenerations } from "../lib/eras";
import {
  SORT_LONG_LABEL,
  clearFilters,
  defaultDir,
  panelFilterCount,
  setAsOf,
  sortKeysFor,
} from "../lib/dexTable";

// The dex's controls on a phone, below `md`: the name field and one button,
// pinned under the site header, so they're in reach at any depth of a list
// that runs to 50,000px. The desktop's panel (DexFilters) is the same controls
// laid out for the width.
//
// Everything but the name opens in one sheet: the dex's generation, the sort
// and its order, and the filters. Each choice applies as it's made, so the
// list behind the sheet is already the answer, and the sheet's own button says
// how long that list is ("Show 151 Pokémon").
//
// The sort is chips rather than a <select>, like every other choice on the
// site, and the table's column headers still sort too, as on a desktop.
//
// 56px tall, as every bar is, with the field at its usual 44px. On the
// `--z-raised` layer, as the game bar is: over the rows scrolling under it,
// under the site header. The table's own column headers pin directly beneath
// it (DexTable).
export default function DexToolbar({ view, onChange, count }) {
  const [open, setOpen] = useState(false);
  // Only what the sheet holds, so the badge can't count the name, which is on
  // screen beside it.
  const panelCount = panelFilterCount(view);

  return (
    <div
      data-pinned="bar"
      className="sticky top-14 -mx-4 flex items-center gap-2 bg-base/85 px-4 py-1.5 backdrop-blur md:hidden"
      style={{ zIndex: "var(--z-raised)" }}
    >
      <div className={`${FIELD} min-w-0 flex-1`}>
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
      {/* Lit when a filter is set, as the chips inside are, with how many. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${CHIP} ${CHIP_FILTER_GEOMETRY} h-11 shrink-0 ${
          panelCount > 0 ? CHIP_ON : CHIP_OFF
        }`}
      >
        <LuSlidersHorizontal aria-hidden />
        Sort &amp; filter{panelCount > 0 && ` (${panelCount})`}
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Sort and filter"
        closeLabel="Close sort and filter"
        placement="sheet"
        footer={
          <>
            {panelCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                // The name stays: it's in the toolbar, not in this sheet.
                onClick={() => onChange({ ...clearFilters(view), q: view.q })}
              >
                <LuX aria-hidden />
                Clear filters
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => setOpen(false)}
              className="ml-auto"
            >
              Show {count.toLocaleString()} Pokémon
            </Button>
          </>
        }
      >
        {/* The generation first, above a divider, as on the desktop panel: it
            decides which Pokémon, sorts and filters there are. */}
        <div className={RULE_BELOW}>
          <GenerationStrip
            label="Dex as of"
            options={allGenerations()}
            asof={view.asof}
            onSelect={(asof) => onChange(setAsOf(view, asof))}
          />
        </div>

        <SortGroups view={view} onChange={onChange} />

        <DexFilterGroups view={view} onChange={onChange} />
      </Dialog>
    </div>
  );
}

// The sort, as two single-choice groups. A new column takes its natural order,
// highest first for a stat, as clicking its header does. Single-choice chips
// carry no ×: one is always chosen, so there's nothing to dismiss.
function SortGroups({ view, onChange }) {
  const alphabetical = view.sort === "name";
  return (
    <>
      <ChipGroup label="Sort by">
        {sortKeysFor(view.asof).map((key) => (
          <FilterChip
            key={key}
            active={view.sort === key}
            onClick={() =>
              onChange({ ...view, sort: key, dir: defaultDir(key) })
            }
            label={SORT_LONG_LABEL[key]}
            removable={false}
          />
        ))}
      </ChipGroup>
      <ChipGroup label="Order">
        {["asc", "desc"].map((dir) => (
          <FilterChip
            key={dir}
            active={view.dir === dir}
            onClick={() => onChange({ ...view, dir })}
            label={
              dir === "asc"
                ? alphabetical
                  ? "A to Z"
                  : "Low to high"
                : alphabetical
                  ? "Z to A"
                  : "High to low"
            }
            removable={false}
          />
        ))}
      </ChipGroup>
    </>
  );
}
