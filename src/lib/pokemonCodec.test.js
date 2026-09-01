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
