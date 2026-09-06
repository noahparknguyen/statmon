import { describe, it, expect } from "vitest";
import {
  ABILITIES_FROM_GEN,
  ABILITY_EFFECTS,
  HIDDEN_FROM_GEN,
  abilitiesAsOf,
  abilityLabel,
  abilityParam,
  affectsTypes,
  defaultAbility,
  resolveAbility,
} from "./abilities";
import { ALL_POKEMON, getBySlug } from "./pokemon";
import { CURRENT_GEN } from "./eras";
import { effectiveness, stabMatchup } from "./typeChart";
import { TYPES } from "./types";

// These tests are load-bearing in a way the rest of the suite is not.
//
// `npm run build:data` re-derives the effectiveness chart from PokéAPI and
// fails on a single wrong cell (D-047). There is no equivalent here: PokéAPI
// states Levitate's effect as the prose "Evades Ground moves." and nowhere as
// data, so the table in abilities.js is hand-maintained with nothing behind it
// (02_research §13). The build checks the KEYS — every slug is a real ability
// some Pokémon has — and these check the MEANING.
//
// So the expected values below are Bulbapedia's, not this codebase's, the same
// rule eras.test.js follows: a test that only restates what the table says
// would pass on a wrong table.

const p = (slug) => getBySlug(slug);

describe("the effect table", () => {
  // A table entry is a FACTOR applied to the chart's answer, not a product, so
  // it is checked against its own list rather than against MULT_ORDER. Using
  // MULT_ORDER here read like the same rule and was not: since D-084 added
  // ⅛× to it, `eff({ fire: 0.125 })` would have passed while meaning something
  // the chart never intends.
  const FACTORS = [0, 0.5, 2];

  it("names only real types, at factors the chart can absorb", () => {
    for (const [slug, entry] of Object.entries(ABILITY_EFFECTS)) {
      for (const [type, factor] of Object.entries(entry.types ?? {})) {
        expect(TYPES, `${slug} names ${type}`).toContain(type);
        // The membership rule of D-073: an ability zeroes, halves or doubles.
        // This is what keeps Dry Skin's Fire ×1.25 and Filter's ×0.75 out — and
        // the whole-dex sweep in typeView.test.js is what checks the PRODUCTS
        // those factors reach, which is the half D-084 proved was missing.
        expect(FACTORS, `${slug} → ${type} is ×${factor}`).toContain(factor);
      }
    }
  });

  it("dates every effect no earlier than abilities themselves", () => {
    for (const [slug, entry] of Object.entries(ABILITY_EFFECTS)) {
      expect(entry.since, slug).toBeGreaterThanOrEqual(ABILITIES_FROM_GEN);
    }
  });

  it("gives every entry exactly one mechanism", () => {
    // A per-type map or a rule over the product, never both — the reduce in
    // abilityMultiplier silently ignores `types` when `all` is present.
    for (const [slug, entry] of Object.entries(ABILITY_EFFECTS)) {
      expect(Boolean(entry.types) !== Boolean(entry.all), slug).toBe(true);
    }
  });

  it("keeps move-property abilities out", () => {
    // Each of these is a real immunity, and none of them is a TYPE immunity:
    // Wind Rider evades wind moves (Tailwind, Bleakwind Storm), not Flying
    // ones. 02_research §13 listed Wind Rider as a candidate and was wrong.
    for (const slug of [
      "wind-rider",
      "bulletproof",
      "soundproof",
      "queenly-majesty",
    ]) {
      expect(affectsTypes(slug), slug).toBe(false);
    }
  });
});

describe("abilityMultiplier", () => {
  it("zeroes the type an immunity names, whatever the chart said", () => {
    // Ground is 2× into an Electric type, and Levitate is why Eelektross does
    // not care — the case the whole feature exists for.
    expect(effectiveness("ground", ["electric"])).toBe(2);
    expect(effectiveness("ground", ["electric"], null, "levitate")).toBe(0);
  });

  it("multiplies rather than overrides, so Thick Fat lands on 1×", () => {
    // Fire into a Grass type is 2×; Thick Fat halves it to 1×, NOT to ½×.
    // Overriding instead of multiplying is the obvious wrong implementation.
    expect(effectiveness("fire", ["grass"])).toBe(2);
    expect(effectiveness("fire", ["grass"], null, "thick-fat")).toBe(1);
    // And into a type Fire is already resisted by, it goes to ¼×.
    expect(effectiveness("fire", ["water"], null, "thick-fat")).toBe(0.25);
  });

  it("makes its holder worse off when the ability says so", () => {
    // Fluffy doubles Fire. The table is not a list of advantages.
    expect(effectiveness("fire", ["normal"], null, "fluffy")).toBe(2);
  });

  it("waits for the generation the effect actually worked in", () => {
    // Lightning Rod only redirected until Gen 5, when it became an immunity.
    // Rhyhorn and Electrike have carried it in an ordinary slot since Gen 3 —
    // NOT Zapdos, whose copy is hidden and so did not exist until Gen 5 — so
    // without `since` a Gen 3 board would claim an immunity that generation did
    // not have. Same for Gastrodon and Storm Drain from Gen 4.
    expect(effectiveness("electric", ["flying"], 4, "lightning-rod")).toBe(2);
    expect(effectiveness("electric", ["flying"], 5, "lightning-rod")).toBe(0);
    expect(effectiveness("water", ["ground"], 4, "storm-drain")).toBe(2);
    expect(effectiveness("water", ["ground"], 5, "storm-drain")).toBe(0);
  });

  it("cancels the Flying type's weaknesses under Delta Stream", () => {
    // Mega Rayquaza is Dragon/Flying, and Strong Winds removes the FLYING
    // half's weakness while leaving the Dragon half alone. So all three of
    // Flying's weaknesses drop one step from wherever the pairing put them —
    // which is three different starting values, not one: Ice 4× → 2×, Rock
    // 2× → 1×, and Electric 1× → ½×, because Dragon already resisted it.
    const rayquaza = ["dragon", "flying"];
    const expected = { ice: [4, 2], rock: [2, 1], electric: [1, 0.5] };
    for (const [attack, [before, after]] of Object.entries(expected)) {
      expect(effectiveness(attack, rayquaza), attack).toBe(before);
      expect(
        effectiveness(attack, rayquaza, null, "delta-stream"),
        attack,
      ).toBe(after);
    }
  });

  it("lets only super-effective attacks through Wonder Guard", () => {
    // Shedinja is Bug/Ghost. Fire is 2× and lands; everything neutral or
    // resisted does nothing at all.
    const shedinja = ["bug", "ghost"];
    expect(effectiveness("fire", shedinja, null, "wonder-guard")).toBe(2);
    expect(effectiveness("water", shedinja, null, "wonder-guard")).toBe(0);
    expect(effectiveness("bug", shedinja, null, "wonder-guard")).toBe(0);
  });

  it("passes the chart's own answer through when nothing applies", () => {
    for (const ability of [null, undefined, "intimidate", "not-an-ability"]) {
      expect(effectiveness("ground", ["electric"], null, ability)).toBe(2);
    }
  });
});

describe("stabMatchup", () => {
  it("reports the correction, not just the corrected value", () => {
    // The chip renders `2̶×̶ 0×  via Levitate`, so it needs all three.
    const [ground] = stabMatchup(
      { types: ["ground"] },
      { types: ["electric"] },
      null,
      "levitate",
    );
    expect(ground).toEqual({
      type: "ground",
      mult: 0,
      baseMult: 2,
      via: "levitate",
    });
  });

  it("leaves `via` null when the ability changed nothing", () => {
    // Krookodile's Dark STAB into an Electric type is 1× either way, so there
    // is no correction to draw even though Levitate is in play.
    const [dark] = stabMatchup(
      { types: ["dark"] },
      { types: ["electric"] },
      null,
      "levitate",
    );
    expect(dark.via).toBeNull();
    expect(dark.mult).toBe(dark.baseMult);
  });
});

describe("abilitiesAsOf", () => {
  it("has nobody carrying an ability before Generation III", () => {
    expect(ABILITIES_FROM_GEN).toBe(3);
    for (const gen of [1, 2]) {
      expect(abilitiesAsOf(p("pikachu"), gen)).toEqual([]);
      expect(abilitiesAsOf(p("gengar"), gen)).toEqual([]);
    }
    // PokéAPI itself does not say this: it reports Static with no past record
    // at all, which would read as Pikachu having it in Red and Blue.
    expect(p("pikachu").abilityEras.some((e) => e.until <= 2)).toBe(false);
  });

  it("gives Gengar back the Levitate it had through Generation VI", () => {
    // The clearest era interaction on the site: Gengar was Ground-immune until
    // Gen 7, when Levitate became Cursed Body.
    expect(abilitiesAsOf(p("gengar"), 6).map((a) => a.slug)).toEqual([
      "levitate",
    ]);
    expect(abilitiesAsOf(p("gengar"), 7).map((a) => a.slug)).toEqual([
      "cursed-body",
    ]);
    expect(abilitiesAsOf(p("gengar")).map((a) => a.slug)).toEqual([
      "cursed-body",
    ]);
  });

  it("withholds a hidden ability from the generations before it existed", () => {
    // Pikachu's Lightning Rod is a Gen 5 arrival, stored as an empty slot 3
    // through Gen 4 — the shape 540 of the 566 stored era records take.
    expect(abilitiesAsOf(p("pikachu"), 4).map((a) => a.slug)).toEqual([
      "static",
    ]);
    expect(abilitiesAsOf(p("pikachu"), 5)).toEqual([
      { slug: "static", hidden: false },
      { slug: "lightning-rod", hidden: true },
    ]);
  });

  it("returns an empty roster rather than throwing for an entry with none", () => {
    // Fourteen entries carry no abilities at all, every one a speculative Mega.
    const bare = ALL_POKEMON.filter((m) => m.abilities.length === 0);
    expect(bare.length).toBe(14);
    for (const mon of bare) {
      expect(abilitiesAsOf(mon)).toEqual([]);
      expect(defaultAbility(mon)).toBeNull();
    }
    expect(abilitiesAsOf(null)).toEqual([]);
  });

  it("keeps every roster to at most two normal and one hidden", () => {
    // The invariant the two-field encoding in pokemonCodec depends on, checked
    // across the whole dex rather than assumed from a sample.
    for (const mon of ALL_POKEMON) {
      const hidden = mon.abilities.filter((a) => a.hidden);
      expect(hidden.length, mon.slug).toBeLessThanOrEqual(1);
      expect(
        mon.abilities.length - hidden.length,
        mon.slug,
      ).toBeLessThanOrEqual(2);
      // Hidden is always last, which is what makes slot order recoverable.
      if (hidden.length) expect(mon.abilities.at(-1).hidden).toBe(true);
    }
  });

  it("gives nobody a hidden ability before Generation V", () => {
    // Hidden abilities arrived in Gen 5, and PokéAPI only half says so. Where
    // the hidden slot was later REPLACED there is no empty-slot record to read,
    // just one substitution whose `until` reaches back to Gen 3 — so Zapdos's
    // stored `{until: 5, slots: {3: "lightning-rod"}}` read literally hands it
    // a hidden ability in Ruby and Sapphire. It affected 21 entries and seven
    // of them bend a matchup, which had a Gen 3 Suicune immune to Water.
    expect(HIDDEN_FROM_GEN).toBe(5);
    for (const mon of ALL_POKEMON) {
      for (let gen = ABILITIES_FROM_GEN; gen < HIDDEN_FROM_GEN; gen++) {
        const hidden = abilitiesAsOf(mon, gen).filter((a) => a.hidden);
        expect(hidden, `${mon.slug} @ gen ${gen}`).toEqual([]);
      }
    }
    // And it still has one from Gen 5, so the floor did not simply delete them.
    expect(abilitiesAsOf(p("zapdos"), 5).map((a) => a.slug)).toEqual([
      "pressure",
      "lightning-rod",
    ]);
    expect(abilitiesAsOf(p("zapdos"), 4).map((a) => a.slug)).toEqual([
      "pressure",
    ]);
  });

  it("resolves a roster that is complete, ordered and free of holes", () => {
    // An era patch can empty slot 2 as well as slot 3 (112 records do), so the
    // resolver has to close the gap rather than leave one. Asserted by SHAPE
    // rather than by truthiness — the earlier version of this test checked that
    // every slug was truthy, which `abilitiesAsOf` guarantees by construction
    // and so could never fail.
    for (const mon of ALL_POKEMON) {
      for (let gen = ABILITIES_FROM_GEN; gen <= CURRENT_GEN; gen++) {
        const roster = abilitiesAsOf(mon, gen);
        const slugs = roster.map((a) => a.slug);
        const where = `${mon.slug} @ gen ${gen}`;
        expect(new Set(slugs).size, where).toBe(slugs.length);
        expect(roster.length, where).toBeLessThanOrEqual(3);
        // Hidden is always last, which is what makes the two-field encoding
        // in pokemonCodec recoverable.
        const hiddenAt = roster.findIndex((a) => a.hidden);
        if (hiddenAt !== -1) expect(hiddenAt, where).toBe(roster.length - 1);
        // A roster is never all-hidden with nothing in slot 1.
        if (roster.length) expect(roster[0].hidden, where).toBe(false);
      }
    }
  });

  it("only marks an ability as mattering once its effect existed", () => {
    // Storm Drain is in the table but only redirected until Gen 5, so the chip
    // marker must not promise a change the STAB block then does not make.
    expect(affectsTypes("storm-drain", 4)).toBe(false);
    expect(affectsTypes("storm-drain", 5)).toBe(true);
    expect(affectsTypes("storm-drain")).toBe(true);
    expect(affectsTypes("levitate", 3)).toBe(true);
    expect(affectsTypes("intimidate")).toBe(false);
    expect(affectsTypes(null)).toBe(false);
  });
});

describe("defaultAbility / resolveAbility", () => {
  it("reads the first slot of the roster the board is showing", () => {
    expect(defaultAbility(p("chandelure"))).toBe("flash-fire");
    expect(defaultAbility(p("eelektross"))).toBe("levitate");
    // Era-dependent, because the roster is.
    expect(defaultAbility(p("gengar"), 6)).toBe("levitate");
    expect(defaultAbility(p("gengar"), 7)).toBe("cursed-body");
    expect(defaultAbility(p("gengar"), 2)).toBeNull();
  });

  it("keeps an ability the Pokémon actually has", () => {
    expect(resolveAbility(p("chandelure"), null, "infiltrator")).toBe(
      "infiltrator",
    );
  });

  it("degrades to the default rather than rendering one it never had", () => {
    // A stale link, a hand-edited one, or switching generation while reading a
    // board whose ability arrived later.
    expect(resolveAbility(p("chandelure"), null, "levitate")).toBe(
      "flash-fire",
    );
    expect(resolveAbility(p("pikachu"), 4, "lightning-rod")).toBe("static");
    expect(resolveAbility(p("pikachu"), 5, "lightning-rod")).toBe(
      "lightning-rod",
    );
    expect(resolveAbility(p("gengar"), 2, "levitate")).toBeNull();
    expect(resolveAbility(null, null, "levitate")).toBeNull();
  });
});

describe("abilityParam", () => {
  it("omits the default and keeps anything else", () => {
    expect(abilityParam(p("chandelure"), null, "flash-fire")).toBeNull();
    expect(abilityParam(p("chandelure"), null, "infiltrator")).toBe(
      "infiltrator",
    );
  });

  it("resolves against the NEW generation before comparing to the default", () => {
    // The bug this exists for: comparing a wanted slug to the new generation's
    // default without resolving it first emitted parameters the page's own
    // parser then discarded. Gengar's ability today is Cursed Body; at Gen 6 it
    // is Levitate, so carrying "cursed-body" into a Gen 6 URL wrote a slug that
    // rendered as Levitate.
    expect(abilityParam(p("gengar"), 6, "cursed-body")).toBeNull();
    expect(abilityParam(p("gengar"), null, "levitate")).toBeNull();
    // Below Gen 3 there is no ability at all, so there is nothing to carry.
    expect(abilityParam(p("gengar"), 2, "levitate")).toBeNull();
  });
});

describe("abilityLabel", () => {
  it("titlecases the ordinary ones", () => {
    expect(abilityLabel("levitate")).toBe("Levitate");
    expect(abilityLabel("flash-fire")).toBe("Flash Fire");
  });

  it("spells out the twelve a rule would get wrong", () => {
    expect(abilityLabel("well-baked-body")).toBe("Well-Baked Body");
    expect(abilityLabel("beads-of-ruin")).toBe("Beads of Ruin");
    expect(abilityLabel("zero-to-hero")).toBe("Zero to Hero");
    expect(abilityLabel("dragons-maw")).toBe("Dragon's Maw");
    expect(abilityLabel("rks-system")).toBe("RKS System");
    expect(abilityLabel("as-one-glastrier")).toBe("As One");
  });

  it("has a label for every ability in the dex", () => {
    const slugs = new Set(
      ALL_POKEMON.flatMap((m) => m.abilities.map((a) => a.slug)),
    );
    expect(slugs.size).toBeGreaterThan(300);
    for (const slug of slugs) {
      const label = abilityLabel(slug);
      expect(label, slug).toBeTruthy();
      // A raw slug leaking through would read "well-baked-body". A hyphen is
      // fine — "Well-Baked Body" has one — so the tell is a LOWERCASE letter
      // after it, which no display name has and every slug does.
      expect(/-[a-z]/.test(label), `${slug} → ${label}`).toBe(false);
    }
  });
});
