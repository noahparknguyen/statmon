import { describe, it, expect } from "vitest";
import { randomMatchup } from "./randomMatchup";
import { ALL_POKEMON } from "./pokemon";
import { CURRENT_GEN } from "./eras";

// A seeded sequence, so "always distinct" and "always in the era" are claims
// about every draw rather than about the handful a live `Math.random` happened
// to produce during one test run.
const seeded = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

describe("randomMatchup", () => {
  it("returns two DIFFERENT Pokémon, every time", () => {
    const rng = seeded(7);
    for (let i = 0; i < 2000; i++) {
      const pair = randomMatchup(null, rng);
      expect(pair).not.toBeNull();
      expect(pair[0].slug, `draw ${i}`).not.toBe(pair[1].slug);
    }
  });

  it("cannot hang, or repeat itself, on a degenerate rng", () => {
    // A constant rng is what breaks a "redraw until they differ" loop: it draws
    // the same index forever. The second pick steps over the first instead.
    for (const constant of [0, 0.5, 0.999999]) {
      const pair = randomMatchup(null, () => constant);
      expect(pair).not.toBeNull();
      expect(pair[0].slug, `rng=${constant}`).not.toBe(pair[1].slug);
    }
  });

  it("draws only from Pokémon that existed at the generation being read", () => {
    const rng = seeded(99);
    for (const asof of [1, 2, 3, 5]) {
      for (let i = 0; i < 300; i++) {
        const [a, b] = randomMatchup(asof, rng);
        expect(a.introducedIn, `${a.slug} @${asof}`).toBeLessThanOrEqual(asof);
        expect(b.introducedIn, `${b.slug} @${asof}`).toBeLessThanOrEqual(asof);
      }
    }
  });

  it("never offers an alternate form", () => {
    const rng = seeded(4242);
    for (let i = 0; i < 1000; i++)
      for (const p of randomMatchup(null, rng)) expect(p.isDefault).toBe(true);
  });

  it("reaches a wide spread rather than a corner of the dex", () => {
    // Non-vacuous: a draw that always returned the same two would satisfy every
    // assertion above except this one.
    const rng = seeded(11);
    const seen = new Set();
    for (let i = 0; i < 1000; i++)
      for (const p of randomMatchup(null, rng)) seen.add(p.slug);
    expect(seen.size).toBeGreaterThan(500);
  });

  it("still plays at the narrowest era the lens offers", () => {
    // Gen 1 is the smallest pool a reader can select, and it is still 151.
    const pair = randomMatchup(1, seeded(3));
    expect(pair).not.toBeNull();
    expect(pair[0].introducedIn).toBe(1);
  });

  it("has a pool at every generation the site can be read at", () => {
    for (let gen = 1; gen <= CURRENT_GEN; gen++)
      expect(randomMatchup(gen, seeded(gen)), `gen ${gen}`).not.toBeNull();
    expect(ALL_POKEMON.length).toBeGreaterThan(1000);
  });
});
