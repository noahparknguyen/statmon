import { describe, it, expect } from "vitest";
import {
  ANSWER_FLOOR,
  DEFAULT_SETTINGS,
  TIERS,
  TIER_DESC,
  TIER_LABEL,
  answersFor,
  canPlay,
  defendersFor,
  effectiveQuestion,
  effectiveUrl,
  multOf,
  parseEffective,
  questionSpace,
  setAsOf,
  setTier,
  settingsKey,
  toggleGen,
  toggleType,
} from "./effective";
import { CURRENT_GEN } from "./eras";
import { effectiveness, typesIn } from "./typeChart";
import { MULT_ORDER } from "./typeView";

const params = (qs) => new URLSearchParams(qs);
const at = (tier, extra = {}) => ({ ...DEFAULT_SETTINGS, tier, ...extra });

// Reproducible without being uniform — a failure here is a bug, not an unlucky
// day in CI. Every generator in this module takes its rng for that reason.
const lcg = (seed = 1) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

const rounds = (settings, n, seed = 7) => {
  const rng = lcg(seed);
  return Array.from({ length: n }, () => effectiveQuestion(settings, rng));
};

describe("the tiers", () => {
  it("each has a label and a description", () => {
    for (const tier of TIERS) {
      expect(TIER_LABEL[tier], tier).toBeTruthy();
      expect(TIER_DESC[tier], tier).toBeTruthy();
    }
  });

  it("draws single types, dual types and Pokémon respectively", () => {
    expect(defendersFor(at("easy")).every((d) => d.types.length === 1)).toBe(
      true,
    );
    expect(defendersFor(at("medium")).every((d) => d.types.length === 2)).toBe(
      true,
    );
    expect(defendersFor(at("hard")).every((d) => d.pokemon != null)).toBe(true);
  });

  it("offers every current type in Easy, and every unordered pair in Medium", () => {
    expect(defendersFor(at("easy"))).toHaveLength(18);
    // 18 choose 2. Unordered, because Water/Flying and Flying/Water are one
    // defender — the canonicalisation /types already applies.
    expect(defendersFor(at("medium"))).toHaveLength(153);
  });

  it("narrows to the era's types under a lens", () => {
    // 15 types in Gen 1: no Dark, no Steel, no Fairy.
    expect(defendersFor(at("easy", { asof: 1 }))).toHaveLength(15);
    expect(defendersFor(at("medium", { asof: 1 }))).toHaveLength((15 * 14) / 2);
  });
});

// The defending-type filter means one thing in all three tiers: the typing
// contains at least one selected type (D-040's OR-within-a-group rule).
describe("the defending-type filter", () => {
  it("picks the type itself in Easy", () => {
    const d = defendersFor(at("easy", { types: ["fire", "water"] }));
    expect(d.map((x) => x.types[0])).toEqual(["fire", "water"]);
  });

  it("requires a pairing to include it in Medium", () => {
    const d = defendersFor(at("medium", { types: ["ghost"] }));
    expect(d.length).toBe(17);
    expect(d.every((x) => x.types.includes("ghost"))).toBe(true);
  });

  it("is filterRows' own type filter in Hard", () => {
    const d = defendersFor(at("hard", { types: ["dragon"], gens: [1] }));
    expect(d.length).toBeGreaterThan(0);
    expect(
      d.every((x) => x.types.includes("dragon") && x.pokemon.generation === 1),
    ).toBe(true);
    expect(d.map((x) => x.pokemon.slug)).toContain("dratini");
  });
});

describe("Hard draws the ability with the Pokémon", () => {
  it("has one defender per (Pokémon, ability) pair", () => {
    const chandelure = defendersFor(at("hard", { types: ["ghost"] })).filter(
      (d) => d.pokemon.slug === "chandelure",
    );
    expect(chandelure.map((d) => d.ability).sort()).toEqual([
      "flame-body",
      "flash-fire",
      "infiltrator",
    ]);
  });

  // The whole reason the ability is drawn rather than fixed: the same Pokémon
  // is a different question depending on which one it is holding (D-104).
  it("gives the same Pokémon different answers for different abilities", () => {
    const byAbility = Object.fromEntries(
      defendersFor(at("hard", { types: ["ghost"] }))
        .filter((d) => d.pokemon.slug === "chandelure")
        .map((d) => [d.ability, multOf("fire", d)]),
    );
    expect(byAbility["flash-fire"]).toBe(0);
    expect(byAbility["flame-body"]).toBe(0.5);
    expect(byAbility["infiltrator"]).toBe(0.5);
  });

  it("carries no ability below Generation III, where none existed", () => {
    const d = defendersFor(at("hard", { asof: 2, types: ["ghost"] }));
    expect(d.length).toBeGreaterThan(0);
    expect(d.every((x) => x.ability === null)).toBe(true);
  });
});

describe("the answers a tier offers", () => {
  it("is what each tier can actually produce", () => {
    expect(answersFor(at("easy"))).toEqual([2, 1, 0.5, 0]);
    // ¼ and 4 need two rows multiplied, so they arrive with dual types.
    expect(answersFor(at("medium"))).toEqual([4, 2, 1, 0.5, 0.25, 0]);
    expect(answersFor(at("hard"))).toEqual([4, 2, 1, 0.5, 0.25, 0]);
  });

  it("is always in canonical order, highest first", () => {
    for (const tier of TIERS) {
      const answers = answersFor(at(tier));
      expect(answers).toEqual(MULT_ORDER.filter((m) => answers.includes(m)));
    }
  });

  // ⅛× is reachable from four Pokémon in the whole dex (Water/Ice with Thick
  // Fat, D-084). Offering it would make those four a seventh of every Hard
  // session; the floor drops it and nothing else.
  it("never offers ⅛×, and clears the floor by a wide margin on everything it keeps", () => {
    for (const tier of TIERS) {
      const { answers, counts, total } = questionSpace(at(tier));
      expect(answers, tier).not.toContain(0.125);
      for (const m of answers) {
        expect(counts.get(m) / total, `${tier} ${m}`).toBeGreaterThan(
          ANSWER_FLOOR * 10,
        );
      }
    }
    // And it really is producible — this is a floor, not a claim it cannot happen.
    const { counts } = questionSpace(at("hard"));
    expect(counts.get(0.125)).toBeGreaterThan(0);
  });

  it("every offered answer is one some question actually produces", () => {
    for (const tier of TIERS) {
      const { attackers, defenders, answers } = questionSpace(at(tier));
      for (const m of answers) {
        const exists = defenders.some((d) =>
          attackers.some((a) => multOf(a, d, null) === m),
        );
        expect(exists, `${tier} ${m}`).toBe(true);
      }
    }
  });

  it("refuses a game whose filters leave fewer than two answers", () => {
    // Normal attacking, defending only Ghost: the one answer is 0×.
    const cornered = at("easy", { types: ["ghost"] });
    expect(canPlay(cornered)).toBe(answersFor(cornered).length >= 2);
    expect(canPlay(at("easy"))).toBe(true);
    // A typing the era had not invented leaves no defenders at all.
    expect(canPlay(at("hard", { types: ["fairy"], asof: 5 }))).toBe(false);
    expect(
      effectiveQuestion(at("hard", { types: ["fairy"], asof: 5 })),
    ).toBeNull();
  });
});

describe("a round", () => {
  it("is internally consistent — the stated multiplier is the real one", () => {
    for (const tier of TIERS) {
      for (const q of rounds(at(tier), 200)) {
        expect(q, tier).not.toBeNull();
        expect(multOf(q.attack, q.defender, q.asof), tier).toBe(q.mult);
        expect(
          effectiveness(q.attack, q.defender.types, q.asof),
          `${tier} base`,
        ).toBe(q.baseMult);
      }
    }
  });

  it("only ever answers with something on the rail", () => {
    for (const tier of TIERS) {
      const answers = answersFor(at(tier));
      for (const q of rounds(at(tier), 300)) {
        expect(answers, tier).toContain(q.mult);
      }
    }
  });

  it("attacks with a type that existed at the generation", () => {
    for (const q of rounds(at("medium", { asof: 1 }), 200)) {
      expect(typesIn(1)).toContain(q.attack);
      expect(q.defender.types.every((t) => typesIn(1).includes(t))).toBe(true);
    }
  });

  // `via` is the whole of what the verdict needs to render the correction —
  // the same contract stabMatchup keeps, so nothing recomputes it downstream.
  it("names the ability only when it changed the answer", () => {
    let corrected = 0;
    for (const q of rounds(at("hard"), 600, 11)) {
      if (q.via == null) {
        expect(q.mult).toBe(q.baseMult);
      } else {
        expect(q.via).toBe(q.defender.ability);
        expect(q.mult).not.toBe(q.baseMult);
        corrected++;
      }
    }
    // Measured at ~16% with answers sampled evenly; asserted loosely because
    // this is a property of the dex, not a target (D-104).
    expect(corrected).toBeGreaterThan(0);
  });

  it("is reproducible from its rng", () => {
    const one = rounds(at("hard"), 5, 99);
    const two = rounds(at("hard"), 5, 99);
    expect(one.map((q) => [q.attack, q.defender.pokemon.slug, q.mult])).toEqual(
      two.map((q) => [q.attack, q.defender.pokemon.slug, q.mult]),
    );
  });
});

// The property that makes the game worth playing, and the one no hand-check
// would ever catch: uniform sampling would make "always guess 1×" a 63%
// strategy in Easy and 47% in Medium (measured before this was written).
describe("no answer is ever the best guess", () => {
  it.each(TIERS)("keeps every answer under a third of rounds in %s", (tier) => {
    const settings = at(tier);
    const answers = answersFor(settings);
    const seen = new Map(answers.map((m) => [m, 0]));
    const n = 3000;
    for (const q of rounds(settings, n, 4242))
      seen.set(q.mult, seen.get(q.mult) + 1);

    for (const [m, count] of seen) {
      const share = count / n;
      // Uniform over `answers.length` buckets, with generous slack for the
      // sampler's own variance — the assertion is "no answer dominates", not
      // an exact distribution.
      expect(
        share,
        `${tier} ${m} at ${(share * 100).toFixed(1)}%`,
      ).toBeLessThan(1 / answers.length + 0.12);
      expect(share, `${tier} ${m} never came up`).toBeGreaterThan(0);
    }
  });
});

describe("settings in the URL", () => {
  it("defaults to Easy with no filters", () => {
    expect(parseEffective(params(""))).toEqual(DEFAULT_SETTINGS);
    // `?play` marks a chosen game whose settings write nothing (D-116); the
    // defaults themselves are still omitted.
    expect(effectiveUrl(DEFAULT_SETTINGS)).toBe("/games/effective?play");
  });

  it("reads a full Hard game", () => {
    expect(
      parseEffective(params("tier=hard&type=water&gen=1,3&forms=1&asof=5")),
    ).toEqual({
      tier: "hard",
      types: ["water"],
      gens: [1, 3],
      includeForms: true,
      asof: 5,
    });
  });

  it("degrades anything unrecognised to its default", () => {
    expect(
      parseEffective(params("tier=nightmare&type=plastic&asof=99")),
    ).toEqual(DEFAULT_SETTINGS);
  });

  it("spells the current generation as no parameter at all", () => {
    expect(parseEffective(params(`asof=${CURRENT_GEN}`)).asof).toBeNull();
  });

  // Only Hard has a pool, so only Hard can carry pool parameters. Otherwise
  // `?tier=easy&gen=1` would be a URL that means nothing, and a reload would
  // silently change the game.
  it("ignores the pool parameters outside Hard, on the way in and out", () => {
    const parsed = parseEffective(params("tier=medium&gen=1&forms=1"));
    expect(parsed.gens).toEqual([]);
    expect(parsed.includeForms).toBe(false);
    expect(
      effectiveUrl({
        ...DEFAULT_SETTINGS,
        tier: "medium",
        gens: [1],
        includeForms: true,
      }),
    ).toBe("/games/effective?tier=medium");
  });

  it("drops the pool settings when the tier stops being able to use them", () => {
    const hard = {
      ...DEFAULT_SETTINGS,
      tier: "hard",
      gens: [1],
      includeForms: true,
    };
    expect(setTier(hard, "easy")).toEqual({
      ...DEFAULT_SETTINGS,
      tier: "easy",
      gens: [],
      includeForms: false,
    });
    expect(setTier(hard, "hard")).toEqual(hard);
  });

  it("clamps a filter the lens cannot hold", () => {
    const wide = {
      ...DEFAULT_SETTINGS,
      tier: "hard",
      types: ["fairy", "fire"],
      gens: [1, 8],
    };
    const narrow = setAsOf(wide, 3);
    expect(narrow.types).toEqual(["fire"]); // Fairy arrives in Gen 6
    expect(narrow.gens).toEqual([1]); // nothing originates after the lens
  });

  it("round-trips every reachable setting", () => {
    const cases = [
      DEFAULT_SETTINGS,
      at("medium"),
      at("hard"),
      at("easy", { types: ["fire", "water"] }),
      at("medium", { types: ["ghost"], asof: 5 }),
      at("hard", {
        types: ["dragon"],
        gens: [1, 2],
        includeForms: true,
        asof: 6,
      }),
    ];
    for (const settings of cases) {
      const qs = effectiveUrl(settings).split("?")[1] ?? "";
      expect(parseEffective(params(qs)), effectiveUrl(settings)).toEqual(
        settings,
      );
    }
  });

  // A control must never emit a setting its own page would discard on arrival.
  it("never writes a setting the parse would throw away", () => {
    const wide = at("hard", {
      types: ["fairy", "fire"],
      gens: [1, 5, 8],
      includeForms: true,
    });
    for (const asof of [null, 1, 3, 5, 8]) {
      const next = setAsOf(wide, asof);
      const qs = effectiveUrl(next).split("?")[1] ?? "";
      expect(parseEffective(params(qs)), `asof=${asof}`).toEqual(next);
    }
    for (const tier of TIERS) {
      const next = setTier(wide, tier);
      const qs = effectiveUrl(next).split("?")[1] ?? "";
      expect(parseEffective(params(qs)), tier).toEqual(next);
    }
  });

  it("gives one canonical key however the settings were built", () => {
    const a = toggleType(toggleType(at("hard"), "water"), "fire");
    const b = toggleType(toggleType(at("hard"), "fire"), "water");
    expect(settingsKey(a)).toBe(settingsKey(b));
    expect(toggleGen(at("hard"), 3).gens).toEqual([3]);
  });
});
