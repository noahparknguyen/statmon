// Pure logic for the dex table: what can be sorted, how rows are sorted and
// filtered, and how that whole view state maps to and from the URL.
//
// Everything here is a pure function over plain data, with no React and no DOM,
// so it is unit-tested directly (dexTable.test.js) rather than through the UI.
// The page component is left as thin as possible on top of it.
import { ALL_POKEMON, formsOf } from "./pokemon";
import { CURRENT_GEN, eraView } from "./eras";
import { GEN1_STAT_ORDER, SPECIAL, STAT_ORDER, STAT_LABEL } from "./stats";
import { TYPES } from "./types";
import { typeExistsIn } from "./typeChart";

// The stat columns a given lens shows: the modern six, or Gen 1's five with a
// single Special in place of Sp. Atk and Sp. Def (D-049).
export const statKeysFor = (asof) =>
  asof === 1 ? GEN1_STAT_ORDER : STAT_ORDER;

// Sortable columns, in display order. The stats come from statKeysFor rather
// than being restated, so a change there flows through to the table — and so a
// Gen 1 dex offers Special as a sortable column and drops the two that did not
// exist yet.
export const sortKeysFor = (asof) => [
  "dex",
  "name",
  ...statKeysFor(asof),
  "bst",
];

// Every key any lens can sort by. `special` is here because a Gen 1 dex really
// can rank by it — the reason it was kept OUT of this map earlier in the same
// session was that no header could reach it, and now one can.
export const SORT_LABEL = {
  dex: "#",
  name: "Name",
  bst: "BST",
  ...Object.fromEntries(
    [...STAT_ORDER, SPECIAL].map((k) => [k, STAT_LABEL[k]]),
  ),
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
  [SPECIAL]: "Special",
  bst: "Base stat total",
};

export const isStatKey = (key) =>
  key === "bst" || key === SPECIAL || STAT_ORDER.includes(key);

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

const sortValue = (p, key, view) => {
  if (key === "name") return p.name;
  if (key === "dex") return dexNumberOf(p);
  if (key === "bst") return view.bst;
  return view.stats[key];
};

// Decorate-sort-undecorate: sortValue and dexNumberOf are computed once per row
// rather than once per comparison, and the tiebreak is explicit rather than
// relying on input order, so an equal-value run renders identically every time.
//
// `asof` sorts on the generation's own values, which is the point of putting the
// lens on a *table*: ranking is what the dex is for, so history that the sort
// cannot reach would be trivia (D-049). `null` is today and costs nothing —
// eraView returns the entry's own stats untouched. Measured at ~1ms to resolve a
// whole era-filtered dex, the same order as the filter and sort themselves, so
// this stays unmemoised for the reasons Dex.jsx already documents.
export function sortRows(rows, key, dir, asof = null) {
  const sign = dir === "asc" ? 1 : -1;
  const byName = key === "name";
  const decorated = rows.map((p) => ({
    p,
    v: sortValue(p, key, eraView(p, asof)),
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
// `asof` is the lens, and it filters as well as re-reads: a table claiming to be
// the Gen 3 dex while listing Pokémon that had not been invented is simply
// wrong, so anything that debuted later is out (D-049). The ceiling is
// `introducedIn`, not `generation` — Alolan Raichu is a Gen 1 *species* that
// arrived in Gen 7, and it has no business in a Gen 3 dex.
//
// Types match the era's typing too, so a Gen 5 dex filtered by Fairy is
// correctly empty and Clefairy answers to Normal there.
export function filterRows(
  rows,
  { q = "", types = [], gens = [], includeForms = true, asof = null } = {},
) {
  const nq = normalize(q);
  return rows.filter((p) => {
    if (!includeForms && !p.isDefault) return false;
    if (asof != null && p.introducedIn > asof) return false;
    if (gens.length && !gens.includes(p.generation)) return false;
    if (types.length) {
      const own = asof == null ? p.types : eraView(p, asof).types;
      if (!types.some((t) => own.includes(t))) return false;
    }
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
  // Alternate forms are hidden by default (D-056): the resting state of the dex
  // is the clean National Dex, and the 234 Megas and battle forms are a step
  // away rather than mixed into it. Reverses the lean D-039 shipped with.
  includeForms: false,
  asof: null,
};

// Sp. Atk and Sp. Def are what Gen 1's Special became, so a sort across that
// boundary maps rather than being discarded: switch a Sp. Atk ranking to the
// Gen 1 dex and you get the Special ranking, which is the same question asked
// of the generation that had one stat for it. Anything with no counterpart
// falls back to the default column.
//
// Exported because the stat game asks the same question of the same boundary
// (lib/games.js): switching a Speed drill to a Gen 1 game keeps Speed, and
// switching a Sp. Atk one keeps the Special that Sp. Atk came from. A second
// hand-written copy of this map is precisely the pair that drifts.
export const ACROSS_THE_SPLIT = {
  spAtk: SPECIAL,
  spDef: SPECIAL,
  [SPECIAL]: "spAtk",
};

function parseSort(raw, asof) {
  const keys = sortKeysFor(asof);
  if (keys.includes(raw)) return raw;
  const mapped = ACROSS_THE_SPLIT[raw];
  return mapped && keys.includes(mapped) ? mapped : DEFAULT_VIEW.sort;
}

// Anything unrecognised falls back to its default rather than throwing, so a
// hand-edited or stale URL degrades to a sensible view instead of a blank page.
export function parseView(searchParams) {
  const get = (k) => searchParams.get(k);
  const rawAsOf = Number(get("asof"));
  // The newest generation is the current view, spelled as no parameter — the
  // same rule parseAsOf follows on the comparison tool.
  const asof =
    Number.isInteger(rawAsOf) && rawAsOf >= 1 && rawAsOf < CURRENT_GEN
      ? rawAsOf
      : null;
  const sort = parseSort(get("sort"), asof);
  const dir =
    get("dir") === "asc" || get("dir") === "desc"
      ? get("dir")
      : defaultDir(sort);
  return {
    sort,
    dir,
    q: get("q") ?? "",
    types: parseList(get("type"), typesFor(asof)),
    // Capped at the lens, so a stale ?asof=3&gen=7 self-heals to no generation
    // filter instead of a table with nothing in it.
    gens: parseList(get("gen"), generationsFor(asof)),
    // Reads `forms=1` as "show them". Links written under the old default
    // still mean what they said: `forms=0` was an explicit hide and still
    // hides, and a bare /dex now simply adopts the new default.
    includeForms: get("forms") === "1",
    asof,
  };
}

// The types and origin generations that exist within a lens — Dark and Steel
// arrive in Gen 2, Fairy in Gen 6, and nothing originates after the lens itself.
// Both the filter controls and the URL parse read these, so a control cannot
// offer a value the parse would reject, and vice versa.
export const typesFor = (asof) => TYPES.filter((t) => typeExistsIn(t, asof));

export const generationsFor = (asof) =>
  asof == null ? GENERATIONS : GENERATIONS.filter((g) => g <= asof);

// Reads a comma-separated multi-select param. Driven by the canonical list
// rather than by the URL's order, which drops unknown values, removes
// duplicates and normalises the order in one step — so the same selection
// always produces the same URL however it was clicked, and a hand-edited URL
// cannot reach a state the controls themselves could not. A single value
// ("type=fire") parses as a one-item list, so older one-type links still work.
//
// Exported because the games reuse this vocabulary verbatim — `?gen=` and
// `?type=` mean the same thing on `/games/higher` as they do here (D-049's
// one-concept-one-name rule), so they have to PARSE the same way too. A second
// copy of a canonicalising parser is how two tools start disagreeing about what
// `?type=fire,bogus,fire` means.
export function parseList(raw, canonical) {
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
  if (view.includeForms) params.set("forms", "1");
  if (view.asof != null) params.set("asof", String(view.asof));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

// Switching the lens keeps everything else, but re-reads the sort across the
// Special split and drops any filter the new lens cannot express — the same
// clamping parseView does, so clicking a chip and hand-editing the URL land in
// the same state.
export const setAsOf = (view, asof) => ({
  ...view,
  asof,
  sort: parseSort(view.sort, asof),
  types: view.types.filter((t) => typeExistsIn(t, asof)),
  gens: view.gens.filter((g) => asof == null || g <= asof),
});

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
