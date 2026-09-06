import { describe, it, expect } from "vitest";
import ROWS from "../data/pokemon.json";
import {
  titleCase,
  encodeEntry,
  decodeEntry,
  encodeAll,
  decodeAll,
} from "./pokemonCodec";

describe("titleCase", () => {
  it("titlecases each hyphenated segment", () => {
    expect(titleCase("volcarona")).toBe("Volcarona");
    expect(titleCase("charizard-mega-x")).toBe("Charizard Mega X");
    expect(titleCase("ho-oh")).toBe("Ho Oh");
  });
});

describe("decodeEntry", () => {
  it("rebuilds the fields the stored row omits", () => {
    const v = decodeEntry(ROWS.find((r) => r.s === "volcarona"));
    expect(v).toMatchObject({
      id: 637,
      slug: "volcarona",
      name: "Volcarona",
      speciesSlug: "volcarona",
      isDefault: true,
      generation: 5,
      types: ["bug", "fire"],
      bst: 550,
      forms: ["volcarona"],
      spriteUrl: "/sprites/637.png",
      artworkUrl: "/artwork/637.webp",
    });
    expect(v.stats).toEqual({
      hp: 85,
      attack: 60,
      defense: 65,
      spAtk: 135,
      spDef: 105,
      speed: 100,
    });
  });

  it("keeps the stored species and form list for an alternate form", () => {
    const mega = decodeEntry(ROWS.find((r) => r.s === "charizard-mega-x"));
    expect(mega.isDefault).toBe(false);
    expect(mega.speciesSlug).toBe("charizard");
    expect(mega.forms).toHaveLength(3);
    expect(mega.name).toBe("Charizard Mega X");
  });

  it("falls back to the sprite when an entry has no artwork", () => {
    const decoded = decodeEntry({
      i: 1,
      s: "x",
      g: 1,
      t: ["normal"],
      st: [1, 1, 1, 1, 1, 1],
      na: 1,
    });
    expect(decoded.artworkUrl).toBe("/sprites/1.png");
  });

  it("reports no sprite as null, and artwork falls back to it", () => {
    const decoded = decodeEntry({
      i: 2,
      s: "y",
      g: 1,
      t: ["normal"],
      st: [1, 1, 1, 1, 1, 1],
      ns: 1,
      na: 1,
    });
    expect(decoded.spriteUrl).toBeNull();
    expect(decoded.artworkUrl).toBeNull();
  });
});

describe("era fields (D-045)", () => {
  it("decodes stat eras oldest-first, with Gen 1's Special as its own key", () => {
    const butterfree = decodeEntry(ROWS.find((r) => r.s === "butterfree"));
    expect(butterfree.statEras).toEqual([
      { until: 1, stats: { special: 80 } },
      { until: 5, stats: { spAtk: 80 } },
    ]);
  });

  it("decodes type eras", () => {
    const clefairy = decodeEntry(ROWS.find((r) => r.s === "clefairy"));
    expect(clefairy.typeEras).toEqual([{ until: 5, types: ["normal"] }]);
  });

  it("gives an entry with no history empty era lists, not undefined", () => {
    const volcarona = decodeEntry(ROWS.find((r) => r.s === "volcarona"));
    expect(volcarona.statEras).toEqual([]);
    expect(volcarona.typeEras).toEqual([]);
  });

  it("dates an alternate form to its own debut, not its species'", () => {
    // A Gen 1 species introduced in Gen 7 — the case that would otherwise let
    // an era selector offer Gen 1 for a form that did not exist yet.
    const alolan = decodeEntry(ROWS.find((r) => r.s === "raichu-alola"));
    expect(alolan.generation).toBe(1);
    expect(alolan.introducedIn).toBe(7);
  });

  it("defaults introducedIn to the species generation", () => {
    const volcarona = decodeEntry(ROWS.find((r) => r.s === "volcarona"));
    expect(volcarona.introducedIn).toBe(5);
  });
});

describe("ability fields (D-073)", () => {
  const decode = (slug) => decodeEntry(ROWS.find((r) => r.s === slug));

  it("splits the roster into normal slots and the hidden one", () => {
    // The two-field encoding rests on an invariant that holds across all 1,259
    // entries: the hidden ability is always slot 3 and there is never more
    // than one (asserted over the whole dex in abilities.test.js).
    expect(decode("pikachu").abilities).toEqual([
      { slug: "static", hidden: false },
      { slug: "lightning-rod", hidden: true },
    ]);
    expect(decode("eelektross").abilities).toEqual([
      { slug: "levitate", hidden: false },
    ]);
  });

  it("decodes an empty slot as null, which is how a slot arriving is spelled", () => {
    // Pikachu had no hidden ability through Gen 4 — the shape 540 of the 566
    // stored era records take, and the reason `0` is stored rather than `null`.
    expect(decode("pikachu").abilityEras).toEqual([
      { until: 4, slots: { 3: null } },
    ]);
  });

  it("decodes a genuine substitution", () => {
    // Only 26 of the stored records are one ability replacing another. This is
    // the one that changes a matchup: Gengar was Ground-immune through Gen 6.
    expect(decode("gengar").abilityEras).toEqual([
      { until: 6, slots: { 1: "levitate" } },
    ]);
  });

  it("gives an entry with no abilities empty arrays, not undefined", () => {
    // Fourteen entries carry none at all, so every consumer can map over them
    // without a guard — the same reason `forms` always includes self.
    const bare = decode("zygarde-mega");
    expect(bare.abilities).toEqual([]);
    expect(bare.abilityEras).toEqual([]);
  });
});

describe("round trip", () => {
  // The invariant D-036 verified by hand before shipping the compact dataset.
  // Asserting it here means a future field change cannot quietly break it.
  it("re-encodes the whole shipped dataset to exactly what is stored", () => {
    expect(encodeAll(decodeAll(ROWS))).toEqual(ROWS);
  });

  it("round-trips every entry individually", () => {
    for (const row of ROWS) {
      expect(encodeEntry(decodeEntry(row))).toEqual(row);
    }
  });
});
