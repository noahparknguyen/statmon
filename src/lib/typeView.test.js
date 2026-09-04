import { describe, it, expect } from "vitest";
import {
  MULT_ORDER,
  matchupTiers,
  parseTypes,
  toggleType,
  typesUrl,
} from "./typeView";
import { effectiveness, typesIn } from "./typeChart";
import { TYPES } from "./types";

// Tier expectations are checked against a direct `effectiveness` computation as
// well as being written out, so a broken grouping cannot pass by agreeing with
// itself. The written-out values are the ones a player would recognise —
// Volcarona's 4× Rock, Ground doing nothing to a Flying type.
const tier = (types, mult, gen = null) =>
  matchupTiers(types, gen).find((t) => t.mult === mult)?.types ?? [];

describe("matchupTiers", () => {
  it("groups every attacking type exactly once", () => {
    for (const types of [["water"], ["water", "flying"], ["steel", "fairy"]]) {
      const grouped = matchupTiers(types).flatMap((t) => t.types);
      expect([...grouped].sort()).toEqual([...TYPES].sort());
    }
  });

  it("orders tiers strongest first and drops empty ones", () => {
    const tiers = matchupTiers(["water", "flying"]);
    const mults = tiers.map((t) => t.mult);
    expect(mults).toEqual([...mults].sort((a, b) => b - a));
    expect(mults.every((m) => MULT_ORDER.includes(m))).toBe(true);
    for (const t of tiers) expect(t.types.length).toBeGreaterThan(0);
    // Water/Flying has no ¼× attacker, and the absent row is the point.
    expect(mults).not.toContain(0.25);
  });

  it("stacks a dual type's multipliers", () => {
    // Water/Flying: Electric is 2× into both halves.
    expect(tier(["water", "flying"], 4)).toEqual(["electric"]);
    expect(tier(["water", "flying"], 2)).toEqual(["rock"]);
    expect(tier(["water", "flying"], 0)).toEqual(["ground"]);
    // Bug/Fire — Volcarona, and the 4× Rock every player knows.
    expect(tier(["bug", "fire"], 4)).toEqual(["rock"]);
  });

  it("agrees with a direct effectiveness computation, tier for tier", () => {
    for (const pair of [
      ["water", "flying"],
      ["bug", "fire"],
      ["steel", "fairy"],
      ["ghost"],
    ]) {
      for (const { mult, types } of matchupTiers(pair)) {
        for (const attacker of types) {
          expect(effectiveness(attacker, pair)).toBe(mult);
        }
      }
    }
  });

  it("handles a single defending type", () => {
    expect(tier(["ghost"], 2)).toEqual(["ghost", "dark"]);
    expect(tier(["ghost"], 0)).toEqual(["normal", "fighting"]);
  });

  it("returns nothing when no typing is selected", () => {
    expect(matchupTiers([])).toEqual([]);
  });

  it("scores on the era's chart, not today's", () => {
    // Ghost did nothing to Psychic in Gen 1 (D-047).
    expect(tier(["psychic"], 0, 1)).toContain("ghost");
    expect(tier(["psychic"], 2)).toContain("ghost");
    // Bug was super effective on Poison in Gen 1.
    expect(tier(["poison"], 2, 1)).toContain("bug");
    expect(tier(["poison"], 0.5)).toContain("bug");
  });

  it("only groups attackers that existed in the era", () => {
    for (const gen of [1, 5, 9]) {
      const grouped = matchupTiers(["water"], gen).flatMap((t) => t.types);
      expect([...grouped].sort()).toEqual([...typesIn(gen)].sort());
    }
    expect(matchupTiers(["water"], 1).flatMap((t) => t.types)).not.toContain(
      "steel",
    );
  });
});

describe("parseTypes", () => {
  it("reads one or two types from the path", () => {
    expect(parseTypes(["water"])).toEqual(["water"]);
    expect(parseTypes(["water", "flying"])).toEqual(["water", "flying"]);
  });

  it("canonicalises order, so one view has one URL", () => {
    // Effectiveness is a product and so commutative; the URL should not be.
    expect(parseTypes(["flying", "water"])).toEqual(["water", "flying"]);
    expect(parseTypes(["flying", "water"])).toEqual(
      parseTypes(["water", "flying"]),
    );
  });

  it("drops anything it cannot use rather than throwing", () => {
    expect(parseTypes([])).toEqual([]);
    expect(parseTypes([undefined, null])).toEqual([]);
    expect(parseTypes(["plastic"])).toEqual([]);
    expect(parseTypes(["water", "plastic"])).toEqual(["water"]);
    expect(parseTypes(["water", "water"])).toEqual(["water"]);
    expect(parseTypes(["WATER", "Flying"])).toEqual(["water", "flying"]);
  });

  it("keeps at most two, even from a hand-written path", () => {
    // Not reachable through the picker, which caps at two — but /types/a/b/c
    // is a URL somebody can type, and it should land somewhere sensible.
    // Built from TYPES rather than written out: three type names in a row is
    // what the "only one list of the 18" guard in types.test.js looks for, and
    // deriving them is what that guard is asking for anyway.
    const three = TYPES.slice(0, 3);
    expect(parseTypes(three)).toEqual(TYPES.slice(0, 2));
  });

  it("drops a type that did not exist in the era being read", () => {
    expect(parseTypes(["water", "fairy"], 5)).toEqual(["water"]);
    expect(parseTypes(["water", "fairy"], 6)).toEqual(["water", "fairy"]);
    expect(parseTypes(["dark", "steel"], 1)).toEqual([]);
  });
});

describe("typesUrl", () => {
  it("puts the typing in the path and the lens in the query", () => {
    expect(typesUrl([])).toBe("/types");
    expect(typesUrl(["water"])).toBe("/types/water");
    expect(typesUrl(["water", "flying"])).toBe("/types/water/flying");
    expect(typesUrl(["water", "flying"], 3)).toBe("/types/water/flying?asof=3");
    expect(typesUrl([], 1)).toBe("/types?asof=1");
  });

  it("round-trips through parseTypes", () => {
    for (const types of [[], ["ghost"], ["water", "flying"]]) {
      const path = typesUrl(types)
        .replace("/types", "")
        .split("/")
        .filter(Boolean);
      expect(parseTypes(path)).toEqual(types);
    }
  });
});

describe("toggleType", () => {
  it("adds, removes, and keeps canonical order", () => {
    expect(toggleType([], "flying")).toEqual(["flying"]);
    // Water sorts before Flying in TYPES, whichever was clicked first.
    expect(toggleType(["flying"], "water")).toEqual(["water", "flying"]);
    expect(toggleType(["water", "flying"], "water")).toEqual(["flying"]);
  });

  it("refuses a third rather than silently evicting one", () => {
    const pair = ["water", "flying"];
    expect(toggleType(pair, "fire")).toBe(pair);
  });
});
