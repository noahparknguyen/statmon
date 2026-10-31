import { LuSearch, LuX } from "react-icons/lu";
import GenerationStrip from "./GenerationStrip";
import DexFilterGroups from "./DexFilterGroups";
import { allGenerations } from "../lib/eras";
import { setAsOf, activeFilterCount, clearFilters } from "../lib/dexTable";
import { FIELD, FIELD_INPUT } from "./fieldStyles";
import { PANEL, RULE_BELOW } from "./pageChrome";
import Button from "./Button";

// The dex's controls on a desktop, from `md` up. A phone gets DexToolbar
// instead: the name field pinned over the list, and everything else in a sheet.
//
// They hold no view state of their own: they render the view read from the URL
// and report the next one, which the page writes back to the URL.
//
// The generation strip comes first, above a divider, because it isn't one of
// the filters: it decides which Pokémon exist here at all, and so which types
// and generations the filters below can offer. Top to bottom is the order of
// that relationship: choose the dex, then narrow it.
//
// There's no sort control here, because the table's column headers are the
// sort, and from `md` every one of them is on screen.

// The field's look is shared with SearchBar (fieldStyles.jsx). Its text is
// 16px, not 14: iOS Safari zooms the page in when a control smaller than 16px
// takes focus, and never zooms back out.
export default function DexFilters({ view, onChange }) {
  // Everything narrowing the list, the name box included, which is what
  // "Clear all filters" clears.
  const totalCount = activeFilterCount(view);

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

      <DexFilterGroups view={view} onChange={onChange} />

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
  );
}
