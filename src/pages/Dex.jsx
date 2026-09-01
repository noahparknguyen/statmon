import { useNavigate, useSearchParams } from "react-router";
import DexFilters from "../components/DexFilters";
import DexTable from "../components/DexTable";
import { ALL_POKEMON } from "../lib/pokemon";
import { STAT_ORDER } from "../lib/stats";
import {
  filterRows,
  parseView,
  sortRows,
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
  const rows = sortRows(filterRows(ALL_POKEMON, view), view.sort, view.dir);

  const setView = (next) =>
    navigate(`/dex${viewToSearch(next)}`, { replace: true });

  // Below md the six stat columns are hidden, so the table shows the one column
  // being sorted by instead — sort by Speed on a phone and Speed is the number
  // you see. Sorting by name, dex or BST leaves it out rather than picking an
  // arbitrary stat to show.
  const mobileStat = STAT_ORDER.includes(view.sort) ? view.sort : null;

  return (
    <div className="max-w-content mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-h1">
          Dex<span className="text-accent">.</span>
        </h1>
        <p className="mt-1 text-body-sm text-secondary">
          Every Pokémon, sorted by any stat.
        </p>
      </header>

      <DexFilters view={view} onChange={setView} />

      <p aria-live="polite" className="mt-4 mb-1 text-caption text-tertiary">
        {rows.length === ALL_POKEMON.length
          ? `${ALL_POKEMON.length.toLocaleString()} Pokémon`
          : `${rows.length.toLocaleString()} of ${ALL_POKEMON.length.toLocaleString()} Pokémon`}
      </p>

      <DexTable
        rows={rows}
        view={view}
        onSort={(key) => setView(toggleSort(view, key))}
        mobileStat={mobileStat}
      />
    </div>
  );
}
