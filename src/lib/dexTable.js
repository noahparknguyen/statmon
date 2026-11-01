// Pure logic for the dex table: what can be sorted, how rows are sorted and
// filtered, and how the view maps to and from the URL.
//
// Pure functions over plain data, with no React and no DOM, so they're tested
// directly in dexTable.test.js and the page stays thin.
import { ALL_POKEMON, formsOf } from "./pokemon";
import { CURRENT_GEN, eraView } from "./eras";
import { GEN1_STAT_ORDER, SPECIAL, STAT_ORDER, STAT_LABEL } from "./stats";
import { TYPES } from "./types";
import { typeExistsIn } from "./typeChart";

// The stat columns a lens shows: today's six, or Gen 1's five with Special in
// place of Sp. Atk and Sp. Def.
export const statKeysFor = (asof) =>
  asof === 1 ? GEN1_STAT_ORDER : STAT_ORDER;

// Sortable columns, in display order. The stats come from statKeysFor, so a
// Gen 1 dex offers Special as a column and drops the two stats that didn't
// exist yet.
export const sortKeysFor = (asof) => [
  "dex",
  "name",
  ...statKeysFor(asof),
  "bst",
];

// Every key any lens can sort by, Special included, since a Gen 1 dex can rank
// by it.
export const SORT_LABEL = {
  dex: "#",
  name: "Name",
  bst: "BST",
  ...Object.fromEntries(
    [...STAT_ORDER, SPECIAL].map((k) => [k, STAT_LABEL[k]]),
  ),
};

// Longer names for a phone's Sort by chips, the games' questions ("Higher
// Speed?"), and screen readers, where "SpA" and "#" don't explain themselves.
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

// The generations actually in the dataset, so a new one in a rebuilt dataset
// shows up in the filter without a code change.
export const GENERATIONS = [
  ...new Set(ALL_POKEMON.map((p) => p.generation)),
].sort((a, b) => a - b);

// Alternate forms have made-up ids above 10000, so their National Dex number is
// the id of the default form in their group.
export function dexNumberOf(pokemon) {
  if (pokemon.isDefault) return pokemon.id;
  return (formsOf(pokemon).find((f) => f.isDefault) ?? pokemon).id;
}

// Stats sort high to low on the first click, since "who is fastest" is the
// question being asked. Identity columns sort low to high.
export const defaultDir = (key) => (isStatKey(key) ? "desc" : "asc");

const sortValue = (p, key, view) => {
  if (key === "name") return p.name;
  if (key === "dex") return dexNumberOf(p);
  if (key === "bst") return view.bst;
  return view.stats[key];
};

// Decorate, sort, undecorate: each row's value and dex number are worked out
// once rather than once per comparison, and ties break explicitly rather than
// on input order, so equal values always render in the same order.
//
// With `asof`, rows sort on that generation's values. Ranking is what the dex
// is for, so history the sort couldn't reach would be trivia. `null` is today
// and costs nothing, since eraView returns the entry's own stats.
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
    // Ties: National Dex order, then id, so a species sorts before its Megas.
    return a.dex - b.dex || a.p.id - b.p.id;
  });
  return decorated.map((d) => d.p);
}

// The search bar's normalisation, so "ho-oh", "Ho Oh", and "hooh" all match.
const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// Types and generations are multi-select, and combine the usual faceted way: OR
// within a group, AND across groups. Fire + Fighting in Gens 1, 3, and 5 means
// "(Fire or Fighting) and (Gen 1, 3, or 5)", which returns Charmander, Machop,
// Torchic, Blaziken, and Tepig alike. A Pokémon belongs to exactly one
// generation, so AND would always match nothing there, and types follow the
// same rule so the two groups behave alike. An empty group doesn't constrain.
//
// `asof` filters as well as re-reads: a Gen 3 dex listing Pokémon that didn't
// exist yet would be wrong, so anything that debuted later is out. The cut-off
// is `introducedIn`, not `generation`: Alolan Raichu is a Gen 1 species that
// arrived in Gen 7, and it doesn't belong in a Gen 3 dex.
//
// Types match the era's typing too, so a Gen 5 dex filtered to Fairy is
// correctly empty, and Clefairy counts as Normal there.
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
   The URL and the view. The URL is the only source of truth, so the page
   holds no sort or filter state of its own: it reads these parameters and
   navigates to change them. Defaults are left out, so the usual case is a
   clean /dex.
   ---------------------------------------------------------------------- */

export const DEFAULT_VIEW = {
  sort: "dex",
  dir: "asc",
  q: "",
  types: [],
  gens: [],
  // Alternate forms are hidden by default, so the dex at rest is the plain
  // National Dex, with the 234 Megas and battle forms a click away.
  includeForms: false,
  asof: null,
};

// Sp. Atk and Sp. Def are what Gen 1's Special became, so a sort across that
// boundary maps rather than resetting: switch a Sp. Atk ranking to the Gen 1
// dex and you get the Special ranking, the same question asked of the
// generation that had one stat for it. Anything with no counterpart falls back
// to the default column.
//
// Exported because the stat game crosses the same boundary: a Sp. Atk drill
// switched to Gen 1 keeps the Special that Sp. Atk came from. A second copy of
// this map would drift.
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
// hand-edited or stale URL gives a sensible view instead of a blank page.
export function parseView(searchParams) {
  const get = (k) => searchParams.get(k);
  const rawAsOf = Number(get("asof"));
  // Today's generation is written as no parameter, as on the comparison page.
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
    // Capped at the lens, so a stale ?asof=3&gen=7 heals to no generation
    // filter instead of a table with nothing in it.
    gens: parseList(get("gen"), generationsFor(asof)),
    // Only `forms=1` shows them. `forms=0` and no parameter both hide them, so
    // an older link with `forms=0` still means what it said.
    includeForms: get("forms") === "1",
    asof,
  };
}

// The types and origin generations that exist under a lens: Dark and Steel
// arrive in Gen 2, Fairy in Gen 6, and nothing originates after the lens
// itself. The filter controls and the URL parse both read these, so a control
// can't offer a value the parse would reject, or the reverse.
export const typesFor = (asof) => TYPES.filter((t) => typeExistsIn(t, asof));

export const generationsFor = (asof) =>
  asof == null ? GENERATIONS : GENERATIONS.filter((g) => g <= asof);

// Reads a comma-separated multi-select parameter. It's driven by the canonical
// list rather than the URL's order, which drops unknown values, removes
// duplicates, and fixes the order in one step. So the same selection always
// gives the same URL however it was clicked, and a hand-edited URL can't reach
// a state the controls couldn't. A single value ("type=fire") parses as a
// one-item list, so older one-type links still work.
//
// Exported because the games use the same parameters: `?gen=` and `?type=`
// mean the same thing on `/games/higher` as here, so they have to parse the
// same way too.
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
// Special split and drops any filter the new lens can't express, as parseView
// does. So clicking a chip and editing the URL land in the same state.
export const setAsOf = (view, asof) => ({
  ...view,
  asof,
  sort: parseSort(view.sort, asof),
  types: view.types.filter((t) => typeExistsIn(t, asof)),
  gens: view.gens.filter((g) => asof == null || g <= asof),
});

// What clicking a column header does: a new column takes its natural
// direction, and the active column flips.
export const toggleSort = (view, key) =>
  view.sort === key
    ? { ...view, dir: view.dir === "asc" ? "desc" : "asc" }
    : { ...view, sort: key, dir: defaultDir(key) };

/* -------------------------------------------------------------------------
   Filter changes. Each returns a whole new view for the page to navigate to,
   and nothing is changed in place.
   ---------------------------------------------------------------------- */

// Adds or removes one value, rebuilding the list in canonical order, so the
// URL is the same whichever order the chips were clicked in. The games'
// settings use it too.
export const toggleIn = (canonical, list, value) => {
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

// Clears the filters and leaves the sort alone: clearing what you filtered by
// shouldn't also throw away the column you were reading.
export const clearFilters = (view) => ({
  ...view,
  q: DEFAULT_VIEW.q,
  types: DEFAULT_VIEW.types,
  gens: DEFAULT_VIEW.gens,
  includeForms: DEFAULT_VIEW.includeForms,
});

// Everything narrowing the list, the name box included. It drives "Clear all
// filters", which clears all of it.
export const activeFilterCount = (view) =>
  (view.q ? 1 : 0) + panelFilterCount(view);

// Only the filters inside a phone's sort and filter sheet, for the count on
// the button that opens it (DexToolbar). The name field sits beside that
// button, always on screen, so counting it would put a "(1)" on a sheet with
// nothing set.
export const panelFilterCount = (view) =>
  view.types.length +
  view.gens.length +
  (view.includeForms === DEFAULT_VIEW.includeForms ? 0 : 1);
