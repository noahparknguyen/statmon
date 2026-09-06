import { describe, it, expect } from "vitest";
import {
  CURRENT_GEN,
  differsFromToday,
  eraView,
  generationOptions,
  parseAsOf,
} from "./eras";
import { ALL_POKEMON, getBySlug } from "./pokemon";
import { GEN1_STAT_ORDER, STAT_ORDER } from "./stats";

// Expected values are Bulbapedia's, not this codebase's: Gen 1 Alakazam really
// is a 405 BST because Gen 1 had five stats to add up, and Butterfree really
// did gain 10 Sp. Atk in Gen 6. Asserting known-outside facts is the point —
// a test that only restates what the resolver computed would pass on a broken
// resolver.
const p = (slug) => getBySlug(slug);
const params = (qs) => new URLSearchParams(qs);

describe("eraView", () => {
  it("returns today's values untouched for the current view", () => {
    const view = eraView(p("butterfree"), null);
    expect(view.gen).toBeNull();
    expect(view.keys).toBe(STAT_ORDER);
    expect(view.stats).toBe(p("butterfree").stats);
    expect(view.bst).toBe(p("butterfree").bst);
    expect(view.types).toBe(p("butterfree").types);
  });

  it("reads Generation 1 with five stats and a single Special", () => {
    const view = eraView(p("butterfree"), 1);
    expect(view.keys).toEqual(GEN1_STAT_ORDER);
    expect(view.stats).toEqual({
      hp: 60,
      attack: 45,
      defense: 50,
      special: 80,
      speed: 70,
    });
    // Five stats, so a lower total than the modern 395 — correct, not a bug.
    expect(view.bst).toBe(305);
  });

  it("takes Gen 1 Special from the dataset, not from today's Sp. Atk", () => {
    // 43 of the 151 Gen 1 species disagree with the "Special became Sp. Atk"
    // shortcut. Chansey is the widest gap in the dex.
    expect(eraView(p("chansey"), 1).stats.special).toBe(105);
    expect(p("chansey").stats.spAtk).toBe(35);
    expect(eraView(p("gyarados"), 1).stats.special).toBe(100);
    expect(eraView(p("hypno"), 1).stats.special).toBe(115);
    expect(eraView(p("charizard"), 1).stats.special).toBe(85);
  });

  it("resolves a mid-history stat change on both sides of its boundary", () => {
    // Butterfree's Sp. Atk was 80 through Gen 5 and 90 since.
    expect(eraView(p("butterfree"), 5).stats.spAtk).toBe(80);
    expect(eraView(p("butterfree"), 6).stats.spAtk).toBe(90);
    expect(eraView(p("butterfree"), 5).bst).toBe(385);
    // Pikachu's Def and Sp. Def were both raised in Gen 6.
    expect(eraView(p("pikachu"), 5).stats).toMatchObject({
      defense: 30,
      spDef: 40,
    });
    expect(eraView(p("pikachu"), 6).stats).toMatchObject({
      defense: 40,
      spDef: 50,
    });
  });

  it("resolves changes made after Gen 1, including nerfs", () => {
    expect(eraView(p("aegislash-blade"), 7).stats).toMatchObject({
      attack: 150,
      spAtk: 150,
    });
    expect(eraView(p("aegislash-blade"), 8).stats.attack).toBe(140);
    expect(eraView(p("zacian-crowned"), 8).stats.attack).toBe(170);
    expect(eraView(p("zacian-crowned"), 9).stats.attack).toBe(150);
  });

  it("reads the era's typing", () => {
    expect(eraView(p("clefairy"), 5).types).toEqual(["normal"]);
    expect(eraView(p("clefairy"), 6).types).toEqual(["fairy"]);
    expect(eraView(p("rotom-heat"), 4).types).toEqual(["electric", "ghost"]);
    expect(eraView(p("rotom-heat"), 5).types).toEqual(["electric", "fire"]);
  });

  it("leaves a Pokémon with no history identical at every generation", () => {
    for (const gen of [5, 6, 7, 8]) {
      expect(eraView(p("volcarona"), gen).stats).toEqual(p("volcarona").stats);
      expect(eraView(p("volcarona"), gen).bst).toBe(p("volcarona").bst);
    }
  });

  it("never renders a Special for a form that has no Gen 1 record", () => {
    // A Gen 1 species, but this form arrived in Gen 7.
    expect(eraView(p("raichu-alola"), 1).keys).toEqual(STAT_ORDER);
  });

  it("returns null for an empty slot", () => {
    expect(eraView(null, 1)).toBeNull();
  });
});

describe("generationOptions", () => {
  const gens = (pair) => generationOptions(pair).map((o) => o.gen);
  const marked = (pair) =>
    generationOptions(pair)
      .filter((o) => o.differs)
      .map((o) => o.gen);

  it("offers every generation both Pokémon existed in", () => {
    expect(gens([p("charizard"), p("blastoise")])).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
  });

  it("offers a control even when nothing ever changed", () => {
    // The old change-boundary model rendered nothing here, which is what made
    // the control feel like it came and went for no visible reason (D-046).
    expect(gens([p("volcarona"), p("chandelure")])).toEqual([5, 6, 7, 8, 9]);
    // Volcarona and Samurott have no history of any kind — no stat era, no
    // type era, no ability era — so the strip is nine unmarked chips and the
    // control is still there. (The mascot pair above no longer qualifies:
    // Chandelure's hidden ability changed, which is the next test.)
    expect(marked([p("volcarona"), p("samurott")])).toEqual([]);
  });

  it("marks a generation whose ability roster differs, not just its stats", () => {
    // Chandelure's hidden ability was Shadow Tag through Gen 5 and is
    // Infiltrator now, so a Gen 5 board is genuinely a different board — and
    // the dot has to say so, or the one era interaction this feature turns on
    // would be invisible on the control that selects it (D-073).
    expect(marked([p("chandelure")])).toEqual([5]);
    expect(p("chandelure").abilityEras).toEqual([
      { until: 5, slots: { 3: "shadow-tag" } },
    ]);
    // Gengar carried Levitate through Gen 6 — the clearest era interaction on
    // the site — so 3 through 6 are marked. Gen 1 is marked too, for the older
    // reason: the five-stat Special shape.
    //
    // **Gen 2 is the interesting one, because it is NOT marked.** Gengar had no
    // ability then and has one now, which is a difference — but it is a fact
    // about the games rather than about Gengar, true of every entry in the dex.
    // Counting it would put a dot on Gen 2 for all 1,259 of them and say
    // nothing, which is the D-049 reason the dex has no dots at all. The floor
    // in differsFromToday is what this gap measures.
    expect(marked([p("gengar")])).toEqual([1, 3, 4, 5, 6]);
  });

  it("starts at the later debut, which is why Gen 1 is off the table for a mixed pair", () => {
    // The whole answer to "a Gen 1 Pokémon against a modern one": the strip
    // starts at 5, so the missing generations are visibly missing.
    expect(gens([p("charizard"), p("volcarona")])).toEqual([5, 6, 7, 8, 9]);
    // Mega Alakazam is a Gen 1 species that debuted in Gen 6.
    expect(gens([p("alakazam-mega"), p("butterfree")])).toEqual([6, 7, 8, 9]);
    // An Alolan form of a Gen 1 species — a Gen 1 board would be nonsense.
    expect(gens([p("raichu-alola"), p("pikachu")])).toEqual([7, 8, 9]);
  });

  it("marks the generations whose board differs from today", () => {
    // Butterfree: Gen 1's Special split, then Sp. Atk 80 through Gen 5.
    expect(marked([p("butterfree"), null])).toEqual([1, 2, 3, 4, 5]);
    // Clefairy was Normal until Gen 6 — a typing change counts too.
    expect(marked([p("clefairy"), null])).toEqual([1, 2, 3, 4, 5]);
    // Aegislash's Gen 8 nerf, on a Pokémon with no Gen 1 history at all.
    expect(marked([p("aegislash-blade"), null])).toEqual([6, 7]);
  });

  it("marks a generation if EITHER Pokémon differs there", () => {
    // Volcarona never changed; Butterfree did, and the board still differs.
    expect(marked([p("butterfree"), p("volcarona")])).toEqual([5]);
  });

  it("never marks the current generation", () => {
    for (const pair of [
      [p("butterfree"), p("blastoise")],
      [p("volcarona"), p("chandelure")],
      [p("aegislash-blade"), null],
    ]) {
      expect(marked(pair)).not.toContain(CURRENT_GEN);
    }
  });

  it("works with a single selected Pokémon", () => {
    expect(gens([p("pikachu"), null])).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("offers the whole timeline when nothing is selected yet", () => {
    // Not an empty list: the strip has to be on screen before the first pick,
    // or it appears later and shoves the board down the page (D-050).
    expect(gens([null, null])).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(marked([null, null])).toEqual([]);
  });
});

describe("differsFromToday", () => {
  it("is true for Gen 1, where the stat shape itself is different", () => {
    expect(differsFromToday(p("volcarona"), 5)).toBe(false);
    expect(differsFromToday(p("charizard"), 1)).toBe(true);
  });

  it("tracks a stat change across its boundary", () => {
    expect(differsFromToday(p("butterfree"), 5)).toBe(true);
    expect(differsFromToday(p("butterfree"), 6)).toBe(false);
  });

  it("tracks a typing change too", () => {
    expect(differsFromToday(p("clefairy"), 5)).toBe(true);
    expect(differsFromToday(p("rotom-heat"), 4)).toBe(true);
    expect(differsFromToday(p("rotom-heat"), 5)).toBe(false);
  });
});

describe("parseAsOf", () => {
  const pair = [p("butterfree"), p("blastoise")];

  it("reads any generation the selection shares", () => {
    for (const raw of [1, 2, 3, 4, 5, 6, 7, 8]) {
      expect(parseAsOf(params(`asof=${raw}`), pair)).toBe(raw);
    }
  });

  it("spells the current generation as no parameter", () => {
    expect(parseAsOf(params(""), pair)).toBeNull();
    expect(parseAsOf(params(`asof=${CURRENT_GEN}`), pair)).toBeNull();
  });

  it("degrades to the current view rather than rendering an impossible one", () => {
    expect(parseAsOf(params("asof=99"), pair)).toBeNull();
    expect(parseAsOf(params("asof=banana"), pair)).toBeNull();
    expect(parseAsOf(params("asof=1.5"), pair)).toBeNull();
    expect(parseAsOf(params("asof=0"), pair)).toBeNull();
    // Gen 1 is not shared by a pair that includes a Gen 6 form — this is what
    // happens when you switch to a Mega while reading a Gen 1 board.
    expect(
      parseAsOf(params("asof=1"), [p("butterfree"), p("alakazam-mega")]),
    ).toBeNull();
    // …and a generation neither existed in is not offered either.
    expect(
      parseAsOf(params("asof=1"), [p("volcarona"), p("chandelure")]),
    ).toBeNull();
  });
});

describe("the dataset's era records", () => {
  it("gives every Gen 1 record exactly the Special stat", () => {
    const gen1 = ALL_POKEMON.flatMap((entry) =>
      entry.statEras.filter((era) => era.until === 1),
    );
    expect(gen1).toHaveLength(151); // the Gen 1 dex, exactly
    for (const era of gen1) expect(Object.keys(era.stats)).toEqual(["special"]);
  });

  it("only carries a Gen 1 Special on entries that existed in Gen 1", () => {
    for (const entry of ALL_POKEMON) {
      if (entry.statEras.some((era) => "special" in era.stats)) {
        expect(entry.introducedIn).toBe(1);
      }
    }
  });

  it("never records a past value equal to the one it replaces", () => {
    // PokéAPI also emits a record when only the EV yield changed; seven
    // Pokémon carry one with an identical base stat. Kept, they would offer an
    // era toggle that changes nothing.
    for (const entry of ALL_POKEMON) {
      for (const era of entry.statEras) {
        for (const [key, value] of Object.entries(era.stats)) {
          if (key === "special") continue;
          expect(eraView(entry, era.until + 1).stats[key]).not.toBe(value);
        }
      }
    }
    expect(getBySlug("blissey").statEras).toEqual([]);
  });

  it("closes every era before the current generation, oldest first", () => {
    for (const entry of ALL_POKEMON) {
      const untils = [...entry.statEras, ...entry.typeEras].map((e) => e.until);
      for (const until of untils) {
        expect(until).toBeGreaterThanOrEqual(1);
        expect(until).toBeLessThan(CURRENT_GEN);
      }
      for (const eras of [entry.statEras, entry.typeEras]) {
        expect(eras.map((e) => e.until)).toEqual(
          [...eras.map((e) => e.until)].sort((a, b) => a - b),
        );
      }
    }
  });

  it("never dates an entry before its species", () => {
    for (const entry of ALL_POKEMON) {
      expect(entry.introducedIn).toBeGreaterThanOrEqual(entry.generation);
      expect(entry.introducedIn).toBeLessThanOrEqual(CURRENT_GEN);
    }
  });
});
