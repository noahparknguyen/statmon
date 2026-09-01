import { describe, it, expect } from "vitest";
import {
  ALL_POKEMON,
  getBySlug,
  formsOf,
  formLabel,
  searchPokemon,
  spriteFor,
  artworkFor,
} from "./pokemon";

describe("the decoded dataset", () => {
  it("exposes every entry with the six stats and 1-2 types", () => {
    expect(ALL_POKEMON.length).toBeGreaterThan(1000);
    for (const p of ALL_POKEMON) {
      expect(p.types.length).toBeGreaterThanOrEqual(1);
      expect(p.types.length).toBeLessThanOrEqual(2);
      expect(p.bst).toBeGreaterThan(0);
    }
  });

  it("has a unique slug per entry", () => {
    expect(new Set(ALL_POKEMON.map((p) => p.slug)).size).toBe(
      ALL_POKEMON.length,
    );
  });
});

describe("formsOf", () => {
  it("lists every sibling form with the default first", () => {
    const forms = formsOf(getBySlug("charizard-mega-x"));
    expect(forms.map((f) => f.slug)).toEqual([
      "charizard",
      "charizard-mega-x",
      "charizard-mega-y",
    ]);
    expect(forms[0].isDefault).toBe(true);
  });

  it("returns just the Pokemon itself when it has no alternate forms", () => {
    expect(formsOf(getBySlug("volcarona")).map((f) => f.slug)).toEqual([
      "volcarona",
    ]);
  });
});

describe("formLabel", () => {
  it("labels the default form Base and others by their suffix", () => {
    expect(formLabel(getBySlug("charizard"))).toBe("Base");
    expect(formLabel(getBySlug("charizard-mega-x"))).toBe("Mega X");
    expect(formLabel(getBySlug("rattata-alola"))).toBe("Alola");
  });
});

describe("searchPokemon", () => {
  it("ranks prefix matches above substring matches", () => {
    const names = searchPokemon("char").map((p) => p.slug);
    expect(names[0]).toBe("charmander");
    // "charcadet" is a prefix match; "kommo-o"-style substring hits come after.
    expect(names.every((n) => n.includes("char"))).toBe(true);
  });

  it("ignores case, punctuation and returns nothing for a blank query", () => {
    expect(searchPokemon("HO-OH")[0].slug).toBe("ho-oh");
    expect(searchPokemon("hooh")[0].slug).toBe("ho-oh");
    expect(searchPokemon("   ")).toEqual([]);
  });

  it("honours the result limit", () => {
    expect(searchPokemon("a", 5)).toHaveLength(5);
  });
});

describe("image fallbacks", () => {
  it("falls back to artwork for the entries with no pixel sprite", () => {
    const spriteless = ALL_POKEMON.filter((p) => p.spriteUrl === null);
    expect(spriteless.length).toBeGreaterThan(0);
    for (const p of spriteless) {
      expect(spriteFor(p)).toBe(p.artworkUrl);
      expect(artworkFor(p)).toBe(p.artworkUrl);
    }
  });
});
