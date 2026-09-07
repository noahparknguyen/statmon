import { describe, it, expect } from "vitest";
import {
  CONTENDER_COUNTS,
  DEFAULT_SETTINGS,
  NEW_SESSION,
  defaultSettings,
  higherQuestion,
  higherUrl,
  parseHigher,
  poolFor,
  resolveStats,
  scoreAnswer,
  setAsOf,
  settingsKey,
  statName,
  statValue,
  statsFor,
  toggleGen,
  toggleStat,
  toggleType,
} from "./games";
import { CURRENT_GEN, eraView } from "./eras";
import { GEN1_STAT_ORDER, STAT_ORDER } from "./stats";

const params = (qs) => new URLSearchParams(qs);

// A deterministic stand-in for Math.random: cycles a fixed list, so a test can
// assert an exact round rather than a property of one. Every generator here
// takes its rng as an argument precisely so this is possible.
const seeded = (values) => {
  let i = 0;
  return () => values[i++ % values.length];
};

// A statistically fine but reproducible rng for the sweeps below — a plain LCG,
// so a failure is a bug rather than an unlucky day in CI.
const lcg = (seed = 1) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

describe("the stat set a game can ask about", () => {
  it("is the modern six plus BST today", () => {
    expect(statsFor(null)).toEqual([...STAT_ORDER, "bst"]);
  });

  it("is Gen 1's five plus BST under a Gen 1 lens — Special in, SpA/SpD out", () => {
    const options = statsFor(1);
    expect(options).toEqual([...GEN1_STAT_ORDER, "bst"]);
    expect(options).toContain("special");
    expect(options).not.toContain("spAtk");
  });

  it("spells every stat out for a prompt rather than as a column header", () => {
    expect(statName("spAtk")).toBe("Sp. Attack");
    expect(statName("bst")).toBe("Base stat total");
    expect(statName("special")).toBe("Special");
    for (const asof of [null, 1]) {
      for (const stat of statsFor(asof)) {
        expect(statName(stat), stat).toBeTruthy();
      }
    }
  });
});

// The one place the games diverge from the dex's "an empty group is not a
// constraint" rule (D-040), and the divergence is the feature: the stats are
// the question space, not a filter, so "ask me about nothing" resolves to "ask
// me about everything" (D-096).
describe("resolveStats — empty means all", () => {
  it("resolves an empty selection to every stat the lens has", () => {
    expect(resolveStats([], null)).toEqual(statsFor(null));
    expect(resolveStats([], 1)).toEqual(statsFor(1));
  });

  it("drops what the lens cannot hold, and falls back to all if nothing survives", () => {
    expect(resolveStats(["speed", "nonsense"], null)).toEqual(["speed"]);
    expect(resolveStats(["nonsense"], null)).toEqual(statsFor(null));
  });

  it("maps across the Gen 1 Special split rather than discarding", () => {
    expect(resolveStats(["spAtk"], 1)).toEqual(["special"]);
    expect(resolveStats(["spDef"], 1)).toEqual(["special"]);
    // Both halves collapse onto the one stat that replaced them, once.
    expect(resolveStats(["spAtk", "spDef"], 1)).toEqual(["special"]);
    expect(resolveStats(["special"], null)).toEqual(["spAtk"]);
    // Speed exists on both sides and survives untouched.
    expect(resolveStats(["speed"], 1)).toEqual(["speed"]);
  });

  it("returns canonical order however the selection was built", () => {
    expect(resolveStats(["bst", "hp", "speed"], null)).toEqual([
      "hp",
      "speed",
      "bst",
    ]);
  });
});

describe("toggles", () => {
  it("adds and removes a stat, in canonical order", () => {
    const one = toggleStat(DEFAULT_SETTINGS, "hp");
    expect(one.stats).toEqual(statsFor(null).filter((s) => s !== "hp"));
    expect(toggleStat(one, "hp").stats).toEqual(statsFor(null));
  });

  it("refuses to remove the last stat", () => {
    const only = { ...DEFAULT_SETTINGS, stats: ["speed"] };
    expect(toggleStat(only, "speed")).toBe(only);
  });

  it("adds and removes generations and types the way the dex does", () => {
    const g = toggleGen(toggleGen(DEFAULT_SETTINGS, 5), 1);
    expect(g.gens).toEqual([1, 5]);
    expect(toggleGen(g, 1).gens).toEqual([5]);
    const t = toggleType(toggleType(DEFAULT_SETTINGS, "water"), "fire");
    expect(t.types).toEqual(["fire", "water"]);
  });
});

describe("the lens narrows every group with it", () => {
  it("drops generations and types the era cannot hold, and remaps the stats", () => {
    const wide = {
      ...DEFAULT_SETTINGS,
      stats: ["spAtk", "speed"],
      gens: [1, 5, 8],
      types: ["fire", "fairy"],
    };
    const narrow = setAsOf(wide, 3);
    expect(narrow.asof).toBe(3);
    expect(narrow.gens).toEqual([1]); // nothing originates after the lens
    expect(narrow.types).toEqual(["fire"]); // Fairy arrives in Gen 6
    expect(narrow.stats).toEqual(["spAtk", "speed"]); // both exist in Gen 3

    const gen1 = setAsOf(wide, 1);
    expect(gen1.stats).toEqual(["special", "speed"]);
  });
});

describe("the pool", () => {
  it("is the default forms only until forms are asked for", () => {
    expect(poolFor({}).every((p) => p.isDefault)).toBe(true);
    expect(
      poolFor({ includeForms: true }).some(
        (p) => p.slug === "charizard-mega-x",
      ),
    ).toBe(true);
  });

  // 151 is the outside fact: a Gen 1 game is Red and Blue's dex.
  it("is 151 Pokémon under a Gen 1 lens", () => {
    expect(poolFor({ asof: 1 })).toHaveLength(151);
  });

  it("caps on when a form arrived, not on its species' generation", () => {
    const gen3 = poolFor({ asof: 3, includeForms: true }).map((p) => p.slug);
    expect(gen3).toContain("raichu");
    expect(gen3).not.toContain("raichu-alola"); // a Gen 1 species, added in Gen 7
  });

  it("narrows by origin generation and by type, and combines them", () => {
    const kantoFire = poolFor({ gens: [1], types: ["fire"] });
    expect(kantoFire.length).toBeGreaterThan(0);
    expect(
      kantoFire.every((p) => p.generation === 1 && p.types.includes("fire")),
    ).toBe(true);
    expect(kantoFire.map((p) => p.slug)).toContain("charmander");
    expect(kantoFire.map((p) => p.slug)).not.toContain("torchic");
  });

  it("is empty for a typing the era had not invented", () => {
    expect(poolFor({ types: ["fairy"], asof: 5 })).toHaveLength(0);
  });
});

describe("higherQuestion", () => {
  it("draws the requested number of distinct contenders", () => {
    for (const n of CONTENDER_COUNTS) {
      const q = higherQuestion({ ...DEFAULT_SETTINGS, n }, lcg(n));
      expect(q.contenders).toHaveLength(n);
      expect(new Set(q.contenders.map((p) => p.slug)).size).toBe(n);
      expect(q.values).toHaveLength(n);
    }
  });

  it("names the contender that actually holds the highest value", () => {
    const q = higherQuestion(
      { ...DEFAULT_SETTINGS, stats: ["speed"], n: 4 },
      lcg(7),
    );
    const top = Math.max(...q.values);
    expect(statValue(eraView(q.winner, null), "speed")).toBe(top);
    expect(q.values[q.contenders.indexOf(q.winner)]).toBe(top);
  });

  it("reads its values through eraView, not through today's stats", () => {
    // Butterfree's Sp. Atk was 80 until Gen 6 and is 90 today, so a Gen 5 game
    // that read `p.stats` would be quietly wrong.
    const q = higherQuestion(
      { ...defaultSettings(5), stats: ["spAtk"] },
      lcg(3),
    );
    for (const [i, p] of q.contenders.entries()) {
      expect(q.values[i]).toBe(eraView(p, 5).stats.spAtk);
    }
  });

  // The one hard guarantee: a tie has two right answers and the game can only
  // accept one. 1.2%–2.5% of random pairs tie, often enough that an unguarded
  // generator would ship a broken round in a player's first session.
  it("never returns a tie for first, across every stat and both counts", () => {
    const rng = lcg(99);
    for (const n of CONTENDER_COUNTS) {
      for (const stat of statsFor(null)) {
        for (let i = 0; i < 120; i++) {
          const q = higherQuestion(
            { ...DEFAULT_SETTINGS, stats: [stat], n },
            rng,
          );
          const ranked = [...q.values].sort((a, b) => b - a);
          expect(ranked[0], `${stat} n=${n}`).toBeGreaterThan(ranked[1]);
          expect(q.margin).toBe(ranked[0] - ranked[1]);
        }
      }
    }
  });

  it("clears the knowable-margin floor — 3 for a stat, 5 for BST", () => {
    const rng = lcg(21);
    for (let i = 0; i < 300; i++) {
      expect(
        higherQuestion({ ...DEFAULT_SETTINGS, stats: ["speed"] }, rng).margin,
      ).toBeGreaterThanOrEqual(3);
      expect(
        higherQuestion({ ...DEFAULT_SETTINGS, stats: ["bst"] }, rng).margin,
      ).toBeGreaterThanOrEqual(5);
    }
  });

  it("only ever asks about a selected stat, and only draws from the pool", () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      stats: ["speed", "bst"],
      gens: [1],
      types: ["water"],
    };
    const rng = lcg(5);
    for (let i = 0; i < 150; i++) {
      const q = higherQuestion(settings, rng);
      expect(["speed", "bst"]).toContain(q.stat);
      expect(
        q.contenders.every(
          (p) => p.generation === 1 && p.types.includes("water"),
        ),
      ).toBe(true);
    }
  });

  it("is reproducible from its rng", () => {
    const draw = () =>
      higherQuestion(
        { ...DEFAULT_SETTINGS, stats: ["speed"], n: 4 },
        seeded([0.1, 0.42, 0.7, 0.93]),
      );
    expect(draw().contenders.map((p) => p.slug)).toEqual(
      draw().contenders.map((p) => p.slug),
    );
  });

  // Reachable through the setup panel now that the filters exist (D-096), so
  // the arena has to render it rather than assume it away.
  it("returns null when the settings cannot produce a question", () => {
    // A typing that did not exist yet: an empty pool.
    expect(
      higherQuestion({ ...defaultSettings(5), types: ["fairy"] }),
    ).toBeNull();
    // Fewer Pokémon than the round needs seats for.
    expect(
      higherQuestion({ ...DEFAULT_SETTINGS, n: 4, gens: [1], types: ["ghost"] })
        ?.contenders?.length ?? null,
    ).not.toBe(3);
  });
});

describe("the session", () => {
  it("counts an answer, and a wrong one breaks the streak", () => {
    let s = NEW_SESSION;
    s = scoreAnswer(s, true);
    s = scoreAnswer(s, true);
    expect(s).toEqual({ asked: 2, correct: 2, streak: 2, best: 2 });
    s = scoreAnswer(s, false);
    expect(s).toEqual({ asked: 3, correct: 2, streak: 0, best: 2 });
  });

  it("keeps the best streak after the streak that set it ends", () => {
    let s = NEW_SESSION;
    for (const ok of [true, true, true, false, true]) s = scoreAnswer(s, ok);
    expect(s.streak).toBe(1);
    expect(s.best).toBe(3);
  });

  it("does not mutate the session it is given", () => {
    const before = { ...NEW_SESSION };
    scoreAnswer(NEW_SESSION, true);
    expect(NEW_SESSION).toEqual(before);
  });
});

describe("settings in the URL", () => {
  it("defaults to every stat, two contenders, no filters", () => {
    expect(parseHigher(params(""))).toEqual(DEFAULT_SETTINGS);
  });

  it("reads a full set of settings", () => {
    // `gen=1,3` rather than `1,5`: under an `asof=3` lens nothing originates
    // later, so a Gen 5 origin filter is clamped away — asserted on its own
    // below. Using it here would have tested the clamp by accident.
    expect(
      parseHigher(
        params("n=4&stats=speed,bst&gen=1,3&type=fire&forms=1&asof=3"),
      ),
    ).toEqual({
      n: 4,
      stats: ["speed", "bst"],
      gens: [1, 3],
      types: ["fire"],
      includeForms: true,
      asof: 3,
    });
  });

  it("degrades anything unrecognised to its default", () => {
    expect(
      parseHigher(params("n=7&stats=charisma&gen=99&type=plastic&asof=99")),
    ).toEqual(DEFAULT_SETTINGS);
  });

  it("spells the current generation as no parameter at all", () => {
    expect(parseHigher(params(`asof=${CURRENT_GEN}`)).asof).toBeNull();
  });

  it("clamps a filter the lens cannot hold, so a stale link self-heals", () => {
    // The dex's own rule (D-049): nothing originates after the lens, and Fairy
    // does not exist in Gen 5.
    expect(parseHigher(params("asof=3&gen=7")).gens).toEqual([]);
    expect(parseHigher(params("asof=5&type=fairy")).types).toEqual([]);
    expect(parseHigher(params("asof=1&stats=spAtk")).stats).toEqual([
      "special",
    ]);
  });

  it("omits every default from the URL", () => {
    expect(higherUrl(DEFAULT_SETTINGS)).toBe("/games/higher");
    expect(higherUrl({ ...DEFAULT_SETTINGS, stats: ["speed"] })).toBe(
      "/games/higher?stats=speed",
    );
    expect(higherUrl({ ...DEFAULT_SETTINGS, n: 4, gens: [1] })).toBe(
      "/games/higher?n=4&gen=1",
    );
  });

  // The property that matters: a control writes a URL, the page reads it back,
  // and the state must be the one the control meant.
  it("round-trips every reachable setting", () => {
    const cases = [
      DEFAULT_SETTINGS,
      { ...DEFAULT_SETTINGS, n: 4 },
      { ...DEFAULT_SETTINGS, stats: ["speed"] },
      { ...DEFAULT_SETTINGS, stats: ["hp", "speed", "bst"] },
      { ...DEFAULT_SETTINGS, gens: [1, 3, 5], types: ["fire", "water"] },
      { ...DEFAULT_SETTINGS, includeForms: true },
      { ...defaultSettings(1), stats: ["special"], gens: [1] },
      { ...defaultSettings(5), types: ["dark"], n: 4, includeForms: true },
    ];
    for (const settings of cases) {
      const qs = higherUrl(settings).split("?")[1] ?? "";
      expect(parseHigher(params(qs)), higherUrl(settings)).toEqual(settings);
    }
  });

  // A control must never emit a setting its own page would discard on arrival —
  // the D-078 lesson, asserted rather than trusted.
  it("never writes a setting the parse would throw away", () => {
    const wide = {
      ...DEFAULT_SETTINGS,
      stats: ["spAtk", "speed"],
      gens: [1, 5, 8],
      types: ["fire", "fairy"],
      n: 4,
    };
    for (const asof of [null, 1, 3, 5, 8]) {
      const next = setAsOf(wide, asof);
      const qs = higherUrl(next).split("?")[1] ?? "";
      expect(parseHigher(params(qs)), `asof=${asof}`).toEqual(next);
    }
  });

  // The saved best streak is filed under this string (lib/record.js), so two
  // ways of clicking to the same game must produce one key, not two.
  it("gives one canonical key however the settings were built", () => {
    const a = toggleType(
      toggleGen(toggleStat(DEFAULT_SETTINGS, "hp"), 5),
      "fire",
    );
    const b = toggleGen(
      toggleType(toggleStat(DEFAULT_SETTINGS, "hp"), "fire"),
      5,
    );
    expect(settingsKey(a)).toBe(settingsKey(b));
    expect(settingsKey(DEFAULT_SETTINGS)).toBe("");
  });
});
