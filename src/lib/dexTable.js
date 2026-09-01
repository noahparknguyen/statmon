// Pure logic for the dex table: what can be sorted, how rows are sorted and
// filtered, and how that whole view state maps to and from the URL.
//
// Everything here is a pure function over plain data, with no React and no DOM,
// so it is unit-tested directly (dexTable.test.js) rather than through the UI.
// The page component is left as thin as possible on top of it.
import { ALL_POKEMON, formsOf } from "./pokemon";
import { STAT_ORDER, STAT_LABEL } from "./stats";
import { TYPES } from "./types";

// Sortable columns, in display order. The six stats come from STAT_ORDER rather
// than being restated, so a change there flows through to the table.
export const SORT_KEYS = ["dex", "name", ...STAT_ORDER, "bst"];

export const SORT_LABEL = {
  dex: "#",
  name: "Name",
  ...STAT_LABEL,
  bst: "BST",
};

// Longer names for the mobile sort <select> and for screen readers, where "SpA"
// and "#" are not self-explanatory.
export const SORT_LONG_LABEL = {
  dex: "Dex number",
  name: "Name",
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  spAtk: "Sp. Attack",
  spDef: "Sp. Defense",
  speed: "Speed",
  bst: "Base stat total",
};

export const isStatKey = (key) => key === "bst" || STAT_ORDER.includes(key);

// The generations actually present in the dataset, so a new one appearing in a
// rebuilt dex shows up in the filter without a code change.
export const GENERATIONS = [
  ...new Set(ALL_POKEMON.map((p) => p.generation)),
].sort((a, b) => a - b);

// Alternate forms carry synthetic ids > 10000, so their National Dex number is
// the id of the default form in their group. This was inlined in PokemonCard;
// the table needs it for every row, so it lives here as the one copy.
export function dexNumberOf(pokemon) {
  if (pokemon.isDefault) return pokemon.id;
  return (formsOf(pokemon).find((f) => f.isDefault) ?? pokemon).id;
}

// Stats sort high-to-low on first click ("who is fastest" is the question being
// asked); identity columns sort low-to-high.
export const defaultDir = (key) => (isStatKey(key) ? "desc" : "asc");

const sortValue = (p, key) => {
  if (key === "name") return p.name;
  if (key === "dex") return dexNumberOf(p);
  if (key === "bst") return p.bst;
  return p.stats[key];
};

// Decorate-sort-undecorate: sortValue and dexNumberOf are computed once per row
// rather than once per comparison, and the tiebreak is explicit rather than
// relying on input order, so an equal-value run renders identically every time.
export function sortRows(rows, key, dir) {
  const sign = dir === "asc" ? 1 : -1;
  const byName = key === "name";
  const decorated = rows.map((p) => ({
    p,
    v: sortValue(p, key),
    dex: dexNumberOf(p),
  }));
  decorated.sort((a, b) => {
    const cmp = byName ? a.v.localeCompare(b.v) : a.v - b.v;
    if (cmp !== 0) return sign * cmp;
    // Ties: National Dex order, then id so a species sorts before its Megas.
    return a.dex - b.dex || a.p.id - b.p.id;
  });
  return decorated.map((d) => d.p);
}

// Same normalisation as the search bar, so "ho-oh", "Ho Oh" and "hooh" all match.
const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// Types and generations are multi-select, and they combine the way faceted
// filters normally do: **OR within a group, AND across groups**. Fire + Fighting
// in Gens 1, 3 and 5 means "(Fire or Fighting) and (Gen 1, 3 or 5)", so it
// returns Charmander, Machop, Torchic, Blaziken and Tepig alike. Generations
// have no other sensible reading — a Pokemon belongs to exactly one, so ANDing
// them would always match nothing — and types follow the same rule so the two
// groups behave alike. An empty group is not a constraint at all. (D-040)
export function filterRows(
  rows,
  { q = "", types = [], gens = [], includeForms = true } = {},
) {
  const nq = normalize(q);
  return rows.filter((p) => {
    if (!includeForms && !p.isDefault) return false;
    if (gens.length && !gens.includes(p.generation)) return false;
    if (types.length && !types.some((t) => p.types.includes(t))) return false;
    if (
      nq &&
      !normalize(p.name).includes(nq) &&
      !normalize(p.slug).includes(nq)
    )
      return false;
    return true;
  });
}

/* -------------------------------------------------------------------------
   URL <-> view state. The URL is the single source of truth (D-022), so the
   page holds no sort/filter state of its own: it reads these params and
   navigates to write them. Defaults are omitted from the URL so the common
   case stays a clean /dex.
   ---------------------------------------------------------------------- */

export const DEFAULT_VIEW = {
  sort: "dex",
  dir: "asc",
  q: "",
  types: [],
  gens: [],
  includeForms: true,
};

// Anything unrecognised falls back to its default rather than throwing, so a
// hand-edited or stale URL degrades to a sensible view instead of a blank page.
export function parseView(searchParams) {
  const get = (k) => searchParams.get(k);
  const sort = SORT_KEYS.includes(get("sort"))
    ? get("sort")
    : DEFAULT_VIEW.sort;
  const dir =
    get("dir") === "asc" || get("dir") === "desc"
      ? get("dir")
      : defaultDir(sort);
  return {
    sort,
    dir,
    q: get("q") ?? "",
    types: parseList(get("type"), TYPES),
    gens: parseList(get("gen"), GENERATIONS),
    includeForms: get("forms") !== "0",
  };
}

// Reads a comma-separated multi-select param. Driven by the canonical list
// rather than by the URL's order, which drops unknown values, removes
// duplicates and normalises the order in one step — so the same selection
// always produces the same URL however it was clicked, and a hand-edited URL
// cannot reach a state the controls themselves could not. A single value
// ("type=fire") parses as a one-item list, so older one-type links still work.
function parseList(raw, canonical) {
  if (!raw) return [];
  const picked = new Set(raw.split(",").map((v) => v.trim()));
  return canonical.filter((v) => picked.has(String(v)));
}

export function viewToSearch(view) {
  const params = new URLSearchParams();
  if (view.sort !== DEFAULT_VIEW.sort) params.set("sort", view.sort);
  if (view.dir !== defaultDir(view.sort)) params.set("dir", view.dir);
  if (view.q) params.set("q", view.q);
  if (view.types.length) params.set("type", view.types.join(","));
  if (view.gens.length) params.set("gen", view.gens.join(","));
  if (!view.includeForms) params.set("forms", "0");
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

// One place that answers "what does clicking this column header do?": a new
// column adopts its natural direction, the active column flips.
export const toggleSort = (view, key) =>
  view.sort === key
    ? { ...view, dir: view.dir === "asc" ? "desc" : "asc" }
    : { ...view, sort: key, dir: defaultDir(key) };

/* -------------------------------------------------------------------------
   Filter mutations. Each returns a whole new view for the page to navigate
   to; nothing is mutated in place.
   ---------------------------------------------------------------------- */

// Adds or removes one value, re-deriving the list from the canonical order so
// the resulting URL is identical whichever order the chips were clicked in.
const toggleIn = (canonical, list, value) => {
  const next = new Set(list);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return canonical.filter((v) => next.has(v));
};

export const toggleType = (view, type) => ({
  ...view,
  types: toggleIn(TYPES, view.types, type),
});

export const toggleGen = (view, gen) => ({
  ...view,
  gens: toggleIn(GENERATIONS, view.gens, gen),
});

// Clears the filters and deliberately leaves the sort alone — clearing what you
// filtered by should not also throw away the column you were reading.
export const clearFilters = (view) => ({
  ...view,
  q: DEFAULT_VIEW.q,
  types: DEFAULT_VIEW.types,
  gens: DEFAULT_VIEW.gens,
  includeForms: DEFAULT_VIEW.includeForms,
});

// Everything currently narrowing the list, including the name box. Drives the
// "Clear all filters" affordance, which clears all of it.
export const activeFilterCount = (view) =>
  (view.q ? 1 : 0) + panelFilterCount(view);

// Only the filters that live inside the collapsible panel. The mobile
// disclosure badge uses this: the name box sits outside the panel and is always
// on screen, so counting it would put a "(1)" on a panel with nothing set.
export const panelFilterCount = (view) =>
  view.types.length +
  view.gens.length +
  (view.includeForms === DEFAULT_VIEW.includeForms ? 0 : 1);
