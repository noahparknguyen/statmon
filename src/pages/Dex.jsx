import { useNavigate, useSearchParams } from "react-router";
import DexFilters from "../components/DexFilters";
import PageHeader from "../components/PageHeader";
import { PAGE_TOOL } from "../components/pageChrome";
import DexTable from "../components/DexTable";
import { ALL_POKEMON } from "../lib/pokemon";
import {
  filterRows,
  parseView,
  sortRows,
  statKeysFor,
  toggleSort,
  viewToSearch,
} from "../lib/dexTable";

// The dex: every Pokémon in one sortable, filterable table.
//
// Like the comparison page, it holds no state. The view is read from the URL on
// every render, and every control navigates to the URL for the next view, so a
// sorted, filtered dex is a link you can send someone. `replace` keeps typing
// in the search box out of the browser's history.
export default function Dex() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const view = parseView(searchParams);

  // Recomputed on every render rather than memoised. This page only re-renders
  // when the URL changes (the re-renders while scrolling happen inside
  // DexTable), and filtering and sorting all 1,259 rows takes about a
  // millisecond. A useMemo here would gain nothing and fight the React
  // Compiler's own memoisation (react-hooks/preserve-manual-memoization).
  const rows = sortRows(
    filterRows(ALL_POKEMON, view),
    view.sort,
    view.dir,
    view.asof,
  );

  // The stat columns this lens shows: five in a Gen 1 dex, six otherwise.
  const keys = statKeysFor(view.asof);
  // The count line's total: everything that existed in this generation, forms
  // included. Under a lens it's that generation's dex, not all 1,259, so a
  // Gen 1 view reads "151 Pokémon", because that's every Pokémon there was.
  // Forms are counted on purpose: with them hidden by default, the count reads
  // "1,025 of 1,259", which is how anyone learns the other 234 are one toggle
  // away.
  const total = filterRows(ALL_POKEMON, {
    asof: view.asof,
    includeForms: true,
  }).length;

  const setView = (next) =>
    navigate(`/dex${viewToSearch(next)}`, {
      replace: true,
      preventScrollReset: true,
    });

  // Below md the six stat columns are hidden, so the table shows the one being
  // sorted by instead: sort by Speed on a phone, and Speed is the number you
  // see. Sorting by name, dex number, or BST leaves it out rather than picking
  // an arbitrary stat to show.
  const mobileStat = keys.includes(view.sort) ? view.sort : null;

  return (
    <div className={PAGE_TOOL}>
      <PageHeader title="Dex" subtitle="Every Pokémon, sorted by any stat." />

      <DexFilters view={view} onChange={setView} />

      {/* 24px under the controls panel, the gap every tool page leaves
          between a panel and what it controls, and 8px over the table it
          counts, as a label over its group. */}
      <p aria-live="polite" className="mt-6 mb-2 text-caption text-tertiary">
        {rows.length === total
          ? `${total.toLocaleString()} Pokémon`
          : `${rows.length.toLocaleString()} of ${total.toLocaleString()} Pokémon`}
      </p>

      <DexTable
        rows={rows}
        view={view}
        keys={keys}
        onSort={(key) => setView(toggleSort(view, key))}
        mobileStat={mobileStat}
      />
    </div>
  );
}
