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

// The full-dex stats table — the second Statmon tool (05_roadmap Phase 6, D-023).
//
// Like the comparison page, this holds no state: the view is parsed out of the
// URL on every render and every control navigates to the URL for the next one
// (D-022), so a sorted, filtered dex is a link you can send someone. `replace`
// keeps typing in the search box out of the history stack.
export default function Dex() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const view = parseView(searchParams);

  // Recomputed on every render rather than memoised. This page only re-renders
  // when the URL changes — the per-scroll-frame re-renders happen inside
  // DexTable — and filtering plus sorting all 1,259 rows measures under 1ms, so
  // a useMemo here would buy nothing and fight the React Compiler's own
  // memoisation (react-hooks/preserve-manual-memoization).
  const rows = sortRows(
    filterRows(ALL_POKEMON, view),
    view.sort,
    view.dir,
    view.asof,
  );

  // The stat columns this lens shows — five in a Gen 1 dex, six otherwise.
  const keys = statKeysFor(view.asof);
  // The denominator for the count line. In a lens it is the size of that
  // generation's dex, not all 1,259: a Gen 1 view reads "151 Pokémon", because
  // 151 IS every Pokémon there was.
  // The denominator is everything that existed in this era, forms included,
  // stated explicitly rather than leaning on filterRows' own default — with
  // forms hidden by default the resting count reads "1,025 of 1,259", which is
  // how anyone learns the other 234 are one toggle away (D-056).
  const total = filterRows(ALL_POKEMON, {
    asof: view.asof,
    includeForms: true,
  }).length;

  const setView = (next) =>
    navigate(`/dex${viewToSearch(next)}`, { replace: true });

  // Below md the six stat columns are hidden, so the table shows the one column
  // being sorted by instead — sort by Speed on a phone and Speed is the number
  // you see. Sorting by name, dex or BST leaves it out rather than picking an
  // arbitrary stat to show.
  const mobileStat = keys.includes(view.sort) ? view.sort : null;

  return (
    <div className={PAGE_TOOL}>
      <PageHeader title="Dex" subtitle="Every Pokémon, sorted by any stat." />

      <DexFilters view={view} onChange={setView} />

      <p aria-live="polite" className="mt-4 mb-1 text-caption text-tertiary">
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
