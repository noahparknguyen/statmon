import { describe, it, expect } from "vitest";
import {
  sortKeysFor,
  statKeysFor,
  setAsOf,
  typesFor,
  generationsFor,
  SORT_LABEL,
  SORT_LONG_LABEL,
  GENERATIONS,
  DEFAULT_VIEW,
  isStatKey,
  dexNumberOf,
  defaultDir,
  sortRows,
  filterRows,
  parseView,
  viewToSearch,
  toggleSort,
  toggleType,
  toggleGen,
  clearFilters,
  activeFilterCount,
} from "./dexTable";
import { ALL_POKEMON, getBySlug } from "./pokemon";
import { CURRENT_GEN, eraView } from "./eras";
import { GEN1_STAT_ORDER, STAT_ORDER } from "./stats";

const slugs = (rows) => rows.map((p) => p.slug);

describe("column config", () => {
  it("covers identity columns plus the six stats and BST", () => {
    expect(sortKeysFor(null)).toEqual(["dex", "name", ...STAT_ORDER, "bst"]);
    for (const key of sortKeysFor(null)) {
      expect(SORT_LABEL[key]).toBeTruthy();
      expect(SORT_LONG_LABEL[key]).toBeTruthy();
    }
  });

  it("swaps the two special stats for one Special in a Gen 1 dex", () => {
    expect(statKeysFor(1)).toEqual(GEN1_STAT_ORDER);
    expect(sortKeysFor(1)).toEqual(["dex", "name", ...GEN1_STAT_ORDER, "bst"]);
    // Every Gen 1 column is still labelled, including the one only it has.
    for (const key of sortKeysFor(1)) {
      expect(SORT_LABEL[key]).toBeTruthy();
      expect(SORT_LONG_LABEL[key]).toBeTruthy();
    }
    // Any other generation is the modern six.
    for (const asof of [2, 5, 9, null]) {
      expect(statKeysFor(asof)).toEqual(STAT_ORDER);
    }
  });

  it("treats the stats and BST as stat columns, not the identity ones", () => {
    expect(isStatKey("speed")).toBe(true);
    expect(isStatKey("bst")).toBe(true);
    expect(isStatKey("dex")).toBe(false);
    expect(isStatKey("name")).toBe(false);
  });

  it("sorts stats high-to-low and identity columns low-to-high by default", () => {
    expect(defaultDir("speed")).toBe("desc");
    expect(defaultDir("bst")).toBe("desc");
    expect(defaultDir("dex")).toBe("asc");
    expect(defaultDir("name")).toBe("asc");
  });

  it("derives the generations from the dataset", () => {
    expect(GENERATIONS).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
});

describe("dexNumberOf", () => {
  it("returns the id for a default form", () => {
    expect(dexNumberOf(getBySlug("volcarona"))).toBe(637);
  });

  it("returns the species dex number for an alternate form, not its id", () => {
    const mega = getBySlug("charizard-mega-x");
    expect(mega.id).toBeGreaterThan(10000);
    expect(dexNumberOf(mega)).toBe(6);
    expect(dexNumberOf(getBySlug("rattata-alola"))).toBe(19);
  });
});

describe("sortRows", () => {
  it("sorts a stat descending, highest first", () => {
    const top = sortRows(ALL_POKEMON, "speed", "desc")[0];
    expect(top.stats.speed).toBe(
      Math.max(...ALL_POKEMON.map((p) => p.stats.speed)),
    );
  });

  it("sorts a stat ascending, lowest first", () => {
    const bottom = sortRows(ALL_POKEMON, "speed", "asc")[0];
    expect(bottom.stats.speed).toBe(
      Math.min(...ALL_POKEMON.map((p) => p.stats.speed)),
    );
  });

  it("sorts by BST", () => {
    const rows = sortRows(ALL_POKEMON, "bst", "desc");
    expect(rows[0].bst).toBeGreaterThanOrEqual(rows[1].bst);
  });

  it("sorts by name alphabetically", () => {
    const rows = sortRows(ALL_POKEMON, "name", "asc");
    expect(rows[0].name.localeCompare(rows[1].name)).toBeLessThanOrEqual(0);
  });

  it("orders by National Dex number, putting a Mega beside its species", () => {
    const rows = sortRows(
      [
        getBySlug("charizard-mega-y"),
        getBySlug("venusaur"),
        getBySlug("charizard"),
        getBySlug("charizard-mega-x"),
      ],
      "dex",
      "asc",
    );
    expect(slugs(rows)).toEqual([
      "venusaur",
      "charizard",
      "charizard-mega-x",
      "charizard-mega-y",
    ]);
  });

  it("breaks ties deterministically regardless of input order", () => {
    const rows = ALL_POKEMON.filter((p) => p.stats.speed === 100);
    const forward = slugs(sortRows(rows, "speed", "desc"));
    const reversed = slugs(sortRows([...rows].reverse(), "speed", "desc"));
    expect(forward).toEqual(reversed);
    expect(forward.length).toBeGreaterThan(1);
  });

  it("does not mutate the array it is given", () => {
    const rows = ALL_POKEMON.slice(0, 20);
    const before = slugs(rows);
    sortRows(rows, "speed", "desc");
    expect(slugs(rows)).toEqual(before);
  });
});

describe("filterRows", () => {
  it("returns everything with no criteria", () => {
    expect(filterRows(ALL_POKEMON)).toHaveLength(ALL_POKEMON.length);
  });

  it("drops alternate forms when they are excluded", () => {
    const rows = filterRows(ALL_POKEMON, { includeForms: false });
    expect(rows.every((p) => p.isDefault)).toBe(true);
    expect(rows).toHaveLength(1025);
  });

  it("filters by one type, matching either slot", () => {
    const rows = filterRows(ALL_POKEMON, { types: ["fire"] });
    expect(rows.every((p) => p.types.includes("fire"))).toBe(true);
    expect(slugs(rows)).toContain("volcarona"); // bug/fire — secondary slot
  });

  it("filters by one generation", () => {
    const rows = filterRows(ALL_POKEMON, { gens: [5] });
    expect(rows.every((p) => p.generation === 5)).toBe(true);
  });

  it("ORs multiple types — a union, not an intersection", () => {
    const rows = filterRows(ALL_POKEMON, { types: ["fire", "fighting"] });
    expect(
      rows.every(
        (p) => p.types.includes("fire") || p.types.includes("fighting"),
      ),
    ).toBe(true);
    // A pure Fire type, a pure Fighting type, and a dual Fire/Fighting type all
    // qualify. An intersection would have kept only the last.
    expect(slugs(rows)).toContain("charmander");
    expect(slugs(rows)).toContain("machop");
    expect(slugs(rows)).toContain("blaziken");
  });

  it("is the union of its parts, never larger", () => {
    const fire = filterRows(ALL_POKEMON, { types: ["fire"] });
    const fighting = filterRows(ALL_POKEMON, { types: ["fighting"] });
    const both = filterRows(ALL_POKEMON, { types: ["fire", "fighting"] });
    const union = new Set([...slugs(fire), ...slugs(fighting)]);
    expect(new Set(slugs(both))).toEqual(union);
    expect(both.length).toBeLessThan(fire.length + fighting.length);
  });

  it("ORs multiple generations", () => {
    const rows = filterRows(ALL_POKEMON, { gens: [1, 3, 5] });
    expect(rows.every((p) => [1, 3, 5].includes(p.generation))).toBe(true);
    expect(new Set(rows.map((p) => p.generation))).toEqual(new Set([1, 3, 5]));
  });

  it("ANDs across groups — any of these types, in any of these generations", () => {
    const rows = filterRows(ALL_POKEMON, {
      types: ["fire", "fighting"],
      gens: [1, 3, 5],
    });
    for (const p of rows) {
      expect(p.types.includes("fire") || p.types.includes("fighting")).toBe(
        true,
      );
      expect([1, 3, 5]).toContain(p.generation);
    }
    expect(slugs(rows)).toContain("charmander"); // fire, gen 1
    expect(slugs(rows)).toContain("machop"); // fighting, gen 1
    expect(slugs(rows)).toContain("blaziken"); // fire/fighting, gen 3
    expect(slugs(rows)).toContain("tepig"); // fire, gen 5
    expect(slugs(rows)).not.toContain("cyndaquil"); // fire, but gen 2
    expect(slugs(rows)).not.toContain("bulbasaur"); // gen 1, but grass
  });

  it("treats an empty group as no constraint at all", () => {
    expect(filterRows(ALL_POKEMON, { types: [], gens: [] })).toHaveLength(
      ALL_POKEMON.length,
    );
  });

  it("filters by name, ignoring case and punctuation", () => {
    expect(slugs(filterRows(ALL_POKEMON, { q: "HO-OH" }))).toContain("ho-oh");
    expect(slugs(filterRows(ALL_POKEMON, { q: "hooh" }))).toContain("ho-oh");
  });

  it("composes every criterion", () => {
    const rows = filterRows(ALL_POKEMON, {
      types: ["fire"],
      gens: [5],
      includeForms: false,
    });
    expect(rows).toHaveLength(15);
    for (const p of rows) {
      expect(p.types).toContain("fire");
      expect(p.generation).toBe(5);
      expect(p.isDefault).toBe(true);
    }
  });

  it("returns nothing when the criteria cannot all be met", () => {
    expect(filterRows(ALL_POKEMON, { q: "zzzznotapokemon" })).toEqual([]);
    // Charizard is real and Water is real; no Charizard is a Water type.
    expect(
      filterRows(ALL_POKEMON, { q: "charizard", types: ["water"] }),
    ).toEqual([]);
  });
});

describe("view state <-> URL", () => {
  const parse = (qs) => parseView(new URLSearchParams(qs));

  it("reads the defaults from an empty query string", () => {
    expect(parse("")).toEqual(DEFAULT_VIEW);
  });

  it("round-trips a full view", () => {
    const view = {
      sort: "speed",
      dir: "desc",
      q: "char",
      types: ["fire", "fighting"],
      gens: [1, 3, 5],
      includeForms: false,
      asof: null,
    };
    expect(parse(viewToSearch(view).slice(1))).toEqual(view);
  });

  it("writes multi-select filters as comma-separated lists", () => {
    expect(
      viewToSearch({
        ...DEFAULT_VIEW,
        types: ["fire", "fighting"],
        gens: [1, 3, 5],
      }),
    ).toBe("?type=fire%2Cfighting&gen=1%2C3%2C5");
  });

  it("omits defaults so the common case stays a clean /dex", () => {
    expect(viewToSearch(DEFAULT_VIEW)).toBe("");
    // A stat's natural direction is implied by the column, so it stays out too.
    expect(viewToSearch({ ...DEFAULT_VIEW, sort: "speed", dir: "desc" })).toBe(
      "?sort=speed",
    );
    expect(viewToSearch({ ...DEFAULT_VIEW, sort: "speed", dir: "asc" })).toBe(
      "?sort=speed&dir=asc",
    );
  });

  it("still reads a single-value filter, so older one-type links keep working", () => {
    expect(parse("type=fire&gen=5")).toMatchObject({
      types: ["fire"],
      gens: [5],
    });
  });

  it("normalises order, so the URL does not depend on click order", () => {
    expect(parse("type=fighting,fire").types).toEqual(["fire", "fighting"]);
    expect(parse("gen=5,1,3").gens).toEqual([1, 3, 5]);
  });

  it("drops duplicates and values it does not recognise", () => {
    expect(parse("type=fire,plastic,fire").types).toEqual(["fire"]);
    expect(parse("gen=1,99,1").gens).toEqual([1]);
    expect(parse("type=,,").types).toEqual([]);
  });

  it("falls back to defaults for values it does not recognise", () => {
    const view = parse("sort=nonsense&dir=sideways&type=plastic&gen=99");
    expect(view.sort).toBe(DEFAULT_VIEW.sort);
    expect(view.dir).toBe(DEFAULT_VIEW.dir);
    expect(view.types).toEqual([]);
    expect(view.gens).toEqual([]);
  });

  it("applies a column's natural direction when only the column is given", () => {
    expect(parse("sort=speed").dir).toBe("desc");
    expect(parse("sort=name").dir).toBe("asc");
  });
});

describe("filter mutations", () => {
  it("adds a type, then removes it again", () => {
    const added = toggleType(DEFAULT_VIEW, "fire");
    expect(added.types).toEqual(["fire"]);
    expect(toggleType(added, "fire").types).toEqual([]);
  });

  it("keeps types in canonical order however they were clicked", () => {
    const a = toggleType(toggleType(DEFAULT_VIEW, "fighting"), "fire");
    const b = toggleType(toggleType(DEFAULT_VIEW, "fire"), "fighting");
    expect(a.types).toEqual(["fire", "fighting"]);
    expect(a.types).toEqual(b.types);
    // Which is what makes the two click orders share one URL.
    expect(viewToSearch(a)).toBe(viewToSearch(b));
  });

  it("keeps generations in ascending order however they were clicked", () => {
    let v = DEFAULT_VIEW;
    for (const g of [5, 1, 3]) v = toggleGen(v, g);
    expect(v.gens).toEqual([1, 3, 5]);
  });

  it("does not mutate the view it is given", () => {
    const view = { ...DEFAULT_VIEW, types: ["fire"] };
    toggleType(view, "water");
    expect(view.types).toEqual(["fire"]);
  });

  it("leaves the sort alone when clearing filters", () => {
    const view = {
      ...DEFAULT_VIEW,
      sort: "speed",
      dir: "desc",
      q: "char",
      types: ["fire"],
      gens: [1],
      includeForms: false,
    };
    expect(clearFilters(view)).toEqual({
      ...DEFAULT_VIEW,
      sort: "speed",
      dir: "desc",
    });
  });

  it("counts each active filter once", () => {
    expect(activeFilterCount(DEFAULT_VIEW)).toBe(0);
    expect(
      activeFilterCount({
        ...DEFAULT_VIEW,
        q: "char",
        types: ["fire", "fighting"],
        gens: [1, 3, 5],
        // A deviation from the default, which is now "hidden" (D-056).
        includeForms: true,
      }),
    ).toBe(7);
    // Sorting is not a filter.
    expect(activeFilterCount({ ...DEFAULT_VIEW, sort: "speed" })).toBe(0);
  });
});

describe("toggleSort", () => {
  it("adopts a new column's natural direction", () => {
    expect(toggleSort(DEFAULT_VIEW, "speed")).toMatchObject({
      sort: "speed",
      dir: "desc",
    });
  });

  it("flips the direction of the column already sorted", () => {
    const desc = toggleSort(DEFAULT_VIEW, "speed");
    expect(toggleSort(desc, "speed")).toMatchObject({
      sort: "speed",
      dir: "asc",
    });
  });

  it("leaves the filters alone", () => {
    const view = { ...DEFAULT_VIEW, q: "char", type: "fire", gen: 5 };
    expect(toggleSort(view, "speed")).toMatchObject({
      q: "char",
      type: "fire",
      gen: 5,
    });
  });
});

describe("the generation lens (D-049)", () => {
  // Forms on, explicitly: these test the era ceiling, and the default now
  // hides forms (D-056), which would silently narrow what they measure.
  const at = (asof, view = {}) =>
    filterRows(ALL_POKEMON, {
      ...DEFAULT_VIEW,
      includeForms: true,
      asof,
      ...view,
    });

  it("caps the table at what existed by that generation", () => {
    // Counted from the dataset rather than from memory — the D-039 lesson,
    // where the wrong half of a failing assertion was my expectation.
    for (const asof of [1, 3, 5, 8]) {
      const expected = ALL_POKEMON.filter((p) => p.introducedIn <= asof).length;
      expect(at(asof)).toHaveLength(expected);
    }
    expect(at(1)).toHaveLength(151); // the Gen 1 dex, exactly
    expect(at(null)).toHaveLength(ALL_POKEMON.length);
  });

  it("excludes a later form of an earlier species", () => {
    // Alolan Raichu is a Gen 1 species that arrived in Gen 7 — the case a
    // `generation <= asof` ceiling would get wrong.
    expect(slugs(at(3))).not.toContain("raichu-alola");
    expect(slugs(at(3))).not.toContain("volcarona");
    expect(slugs(at(3))).toContain("raichu");
    expect(slugs(at(7))).toContain("raichu-alola");
  });

  it("sorts on the generation's own values", () => {
    const gen1 = sortRows(at(1), "special", "desc", 1);
    expect(gen1[0].slug).toBe("mewtwo"); // Special 154
    // The ranking is genuinely Gen 1's, not today's Sp. Atk wearing its name:
    // Tentacruel's Special of 120 puts it 9th of the 151, where its modern
    // Sp. Atk of 80 leaves it 471st of the whole dex.
    expect(slugs(gen1.slice(0, 10))).toContain("tentacruel");
    const today = sortRows(ALL_POKEMON, "spAtk", "desc");
    expect(slugs(today.slice(0, 200))).not.toContain("tentacruel");
  });

  it("ranks by a stat that changed, differently in each generation", () => {
    // Pidgeot's Speed went 91 → 101 in Gen 6. Sorting the SAME rows on the two
    // generations isolates the stat change from the changing size of the dex.
    const rows = at(5);
    const rank = (asof) =>
      slugs(sortRows(rows, "speed", "desc", asof)).indexOf("pidgeot");
    expect(rank(5)).toBeGreaterThan(rank(null));
  });

  it("totals a Gen 1 BST over five stats", () => {
    const alakazam = sortRows(at(1), "bst", "desc", 1).find(
      (p) => p.slug === "alakazam",
    );
    expect(alakazam).toBeTruthy();
    // 55 + 50 + 45 + 135 + 120 — one fewer stat to add up than today's 500.
    expect(eraView(alakazam, 1).bst).toBe(405);
  });

  it("matches types as they were in that generation", () => {
    // Clefairy was Normal until Gen 6.
    expect(slugs(at(5, { types: ["normal"] }))).toContain("clefairy");
    expect(slugs(at(9, { types: ["normal"] }))).not.toContain("clefairy");
    expect(slugs(at(9, { types: ["fairy"] }))).toContain("clefairy");
    // Fairy did not exist in Gen 5, so filtering by it there finds nothing.
    expect(at(5, { types: ["fairy"] })).toHaveLength(0);
  });

  it("offers only the types and origin generations the lens can hold", () => {
    expect(typesFor(1)).not.toContain("dark");
    expect(typesFor(1)).not.toContain("steel");
    expect(typesFor(2)).toContain("steel");
    expect(typesFor(5)).not.toContain("fairy");
    expect(typesFor(6)).toContain("fairy");
    expect(typesFor(null)).toHaveLength(18);
    expect(generationsFor(3)).toEqual([1, 2, 3]);
    expect(generationsFor(null)).toEqual(GENERATIONS);
  });
});

describe("switching the lens", () => {
  it("carries a sort across the Special split rather than dropping it", () => {
    expect(setAsOf({ ...DEFAULT_VIEW, sort: "spAtk" }, 1).sort).toBe("special");
    expect(setAsOf({ ...DEFAULT_VIEW, sort: "spDef" }, 1).sort).toBe("special");
    // …and back the other way when leaving Gen 1.
    expect(setAsOf({ ...DEFAULT_VIEW, sort: "special" }, 5).sort).toBe("spAtk");
    expect(setAsOf({ ...DEFAULT_VIEW, sort: "special" }, null).sort).toBe(
      "spAtk",
    );
  });

  it("keeps a sort that both generations share", () => {
    expect(setAsOf({ ...DEFAULT_VIEW, sort: "speed" }, 1).sort).toBe("speed");
    expect(setAsOf({ ...DEFAULT_VIEW, sort: "name" }, 1).sort).toBe("name");
  });

  it("drops filters the new lens cannot express", () => {
    const view = { ...DEFAULT_VIEW, types: ["fire", "fairy"], gens: [1, 7] };
    expect(setAsOf(view, 3)).toMatchObject({
      types: ["fire"], // Fairy did not exist yet
      gens: [1], // nothing originated in Gen 7 yet
      asof: 3,
    });
  });

  it("restores the full range on the way back to today", () => {
    expect(setAsOf({ ...DEFAULT_VIEW, asof: 1 }, null)).toMatchObject({
      asof: null,
    });
  });
});

describe("the lens in the URL", () => {
  const parse = (qs) => parseView(new URLSearchParams(qs));

  it("round-trips", () => {
    expect(parse("asof=3").asof).toBe(3);
    expect(viewToSearch({ ...DEFAULT_VIEW, asof: 3 })).toBe("?asof=3");
  });

  it("spells today as no parameter", () => {
    expect(parse("").asof).toBeNull();
    expect(parse(`asof=${CURRENT_GEN}`).asof).toBeNull();
    expect(viewToSearch(DEFAULT_VIEW)).toBe("");
  });

  it("degrades rather than rendering an impossible view", () => {
    expect(parse("asof=99").asof).toBeNull();
    expect(parse("asof=0").asof).toBeNull();
    expect(parse("asof=banana").asof).toBeNull();
  });

  it("self-heals a filter the lens cannot hold", () => {
    // Without the cap this would be a table with nothing in it.
    expect(parse("asof=3&gen=7").gens).toEqual([]);
    expect(parse("asof=3&gen=2,7").gens).toEqual([2]);
    expect(parse("asof=5&type=fairy").types).toEqual([]);
  });

  it("maps a stale sort key across the split instead of losing it", () => {
    expect(parse("asof=1&sort=spAtk").sort).toBe("special");
    expect(parse("sort=special").sort).toBe("spAtk");
    expect(parse("asof=1&sort=nonsense").sort).toBe("dex");
  });
});
