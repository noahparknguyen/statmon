import { describe, it, expect } from "vitest";
import {
  MULT_ORDER,
  matchupTiers,
  parseDefender,
  parseTypes,
  toggleType,
  typesUrl,
} from "./typeView";
import { effectiveness, formatMult, typesIn } from "./typeChart";
import { abilitiesAsOf } from "./abilities";
import { ALL_POKEMON, getBySlug } from "./pokemon";
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

  it("moves an attacker between tiers when the defender's ability says so", () => {
    // Eelektross is a plain Electric type, so Ground is its one weakness — and
    // Levitate is the whole reason that is not true (D-073).
    expect(tier(["electric"], 2)).toEqual(["ground"]);
    const withLevitate = (mult) =>
      matchupTiers(["electric"], null, "levitate").find((t) => t.mult === mult)
        ?.types ?? [];
    expect(withLevitate(2)).toEqual([]);
    expect(withLevitate(0)).toEqual(["ground"]);
  });

  it("has a tier for every multiplier the dex can actually produce", () => {
    // The guard that would have caught D-084. An ability MULTIPLIES the chart's
    // own answer, so a defender that already resists twice and then halves again
    // lands on ⅛× — a value typing alone can never reach. Because this function
    // filters by exact equality against MULT_ORDER, a multiplier missing from it
    // does not render wrong, it renders *not at all*: the attacking type
    // silently vanishes from every tier.
    //
    // Swept across the whole dex rather than sampled, because the four entries
    // that reach it (Dewgong, Spheal, Sealeo and Walrein — Water/Ice with Thick
    // Fat in slot 1, so it is their DEFAULT reading) are not ones anybody would
    // have thought to write down.
    const missing = new Set();
    for (const mon of ALL_POKEMON) {
      for (const gen of [null, 3, 5, 9]) {
        for (const { slug } of abilitiesAsOf(mon, gen)) {
          for (const attack of TYPES) {
            const mult = effectiveness(attack, mon.types, gen, slug);
            if (!MULT_ORDER.includes(mult)) {
              missing.add(`${mon.slug} + ${slug} vs ${attack} = ${mult}`);
            }
          }
        }
      }
    }
    expect([...missing]).toEqual([]);
  });

  it("has a printable label for every tier it can render", () => {
    // The other half of the same bug: a value in MULT_ORDER with no entry in
    // MULT_LABEL falls through to `${m}×` — a bare "0.125×" where the scale
    // everywhere else reads "⅛×". Every real label is a whole numeral or a
    // vulgar fraction, so a decimal point is the tell.
    for (const mult of MULT_ORDER) {
      expect(formatMult(mult), `${mult}× has no label`).not.toContain(".");
    }
  });

  it("still groups every attacking type exactly once under an ability", () => {
    // A tier list that loses or duplicates an attacker is worse than one that
    // is merely wrong, and Wonder Guard is the entry most likely to do it.
    for (const ability of ["levitate", "wonder-guard", "thick-fat"]) {
      const grouped = matchupTiers(["bug", "ghost"], null, ability).flatMap(
        (t) => t.types,
      );
      expect([...grouped].sort(), ability).toEqual([...TYPES].sort());
    }
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
    expect(typesUrl(["water", "flying"], { asof: 3 })).toBe(
      "/types/water/flying?asof=3",
    );
    expect(typesUrl([], { asof: 1 })).toBe("/types?asof=1");
  });

  it("carries the Pokémon that named the typing, and its ability", () => {
    expect(typesUrl(["electric"], { as: "eelektross" })).toBe(
      "/types/electric?as=eelektross",
    );
    expect(
      typesUrl(["ghost", "poison"], {
        asof: 6,
        as: "gengar",
        ability: "levitate",
      }),
    ).toBe("/types/ghost/poison?asof=6&as=gengar&ab=levitate");
  });

  it("omits every parameter at its default, so the common case is a path", () => {
    expect(typesUrl(["water"], { asof: null, as: null, ability: null })).toBe(
      "/types/water",
    );
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

describe("parseDefender", () => {
  const at = (qs) => new URLSearchParams(qs);

  it("reads the Pokémon that named the typing", () => {
    expect(parseDefender(["electric"], at("as=eelektross"))?.name).toBe(
      "Eelektross",
    );
  });

  it("compares canonically, not by slot order", () => {
    // Volcarona is stored Bug/Fire and canonicalises to Fire/Bug. Comparing
    // position by position would reject the very Pokémon that produced the URL.
    expect(parseTypes(getBySlug("volcarona").types)).toEqual(["fire", "bug"]);
    expect(parseDefender(["fire", "bug"], at("as=volcarona"))?.name).toBe(
      "Volcarona",
    );
  });

  it("drops a Pokémon whose typing is not the one on screen", () => {
    // This is what makes clicking a type chip off drop the Pokémon for free:
    // the parameter simply stops validating, with no cleanup branch anywhere.
    expect(parseDefender(["electric"], at("as=volcarona"))).toBeNull();
    expect(parseDefender(["fire"], at("as=volcarona"))).toBeNull();
  });

  it("drops anything it cannot use rather than throwing", () => {
    expect(parseDefender(["electric"], at(""))).toBeNull();
    expect(parseDefender(["electric"], at("as=not-a-pokemon"))).toBeNull();
    expect(parseDefender([], at("as=eelektross"))).toBeNull();
  });

  it("reads the typing the Pokémon had in the generation being shown", () => {
    // Clefairy was Normal until Gen 6 and is Fairy now, so each typing is
    // valid in its own era and neither is valid in the other's.
    expect(parseDefender(["normal"], at("as=clefairy"), 5)?.name).toBe(
      "Clefairy",
    );
    expect(parseDefender(["fairy"], at("as=clefairy"), 5)).toBeNull();
    expect(parseDefender(["fairy"], at("as=clefairy"))?.name).toBe("Clefairy");
  });

  it("drops a Pokémon that did not exist that far back", () => {
    // An Alolan form of a Gen 1 species: Gen 1 Raichu was not this Raichu.
    expect(
      parseDefender(["electric", "psychic"], at("as=raichu-alola"), 1),
    ).toBeNull();
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
