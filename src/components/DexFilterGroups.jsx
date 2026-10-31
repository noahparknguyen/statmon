import ChipGroup from "./ChipGroup";
import FilterChip from "./FilterChip";
import { capitalize } from "../lib/types";
import {
  generationsFor,
  toggleGen,
  toggleType,
  typesFor,
} from "../lib/dexTable";

// The dex's three filter groups: Types, Introduced in, and Options. One
// component, because two places hold them: the desktop's controls panel
// (DexFilters) and a phone's sort and filter sheet (DexToolbar). The labels
// keep the lone forms toggle from looking like a stray control: it's a group of
// its own.
//
// "Introduced in" rather than "Generations", because the dex has two
// generation controls: the strip picks which dex you're looking at, and this
// picks where a Pokémon came from. Naming it for what it filters keeps the two
// apart.
//
// Both lists narrow with the dex's generation: no Fairy chip in a Gen 5 dex,
// and no Gen 7 origin chip in a Gen 3 one. A control offering a value the view
// can't hold would only produce an empty table.
//
// The last two groups sit side by side from `md`, where the desktop panel has
// the width, and stack in a phone's sheet.
export default function DexFilterGroups({ view, onChange }) {
  const types = typesFor(view.asof);
  const generations = generationsFor(view.asof);

  return (
    <>
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
            the Gen 1 dex to "introduced in Gen 1" is every row it already has,
            so the control could only do nothing, under a strip that looks just
            like it. */}
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
    </>
  );
}
