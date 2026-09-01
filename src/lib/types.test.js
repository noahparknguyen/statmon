import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { TYPES, typeColorVar, typeTextVar, capitalize } from "./types";
import { CHART } from "./typeChart";
import { ALL_POKEMON } from "./pokemon";

describe("TYPES", () => {
  it("is the 18 types with no duplicates", () => {
    expect(TYPES).toHaveLength(18);
    expect(new Set(TYPES).size).toBe(18);
  });

  // These three used to be three hand-maintained copies of the same list.
  // Now there is one, and these assertions are what keep it honest.
  it("matches the attacking types in the effectiveness chart", () => {
    expect(Object.keys(CHART).sort()).toEqual([...TYPES].sort());
  });

  it("matches the defending types the chart refers to", () => {
    const defending = new Set(
      Object.values(CHART).flatMap((row) => Object.keys(row)),
    );
    for (const t of defending) expect(TYPES).toContain(t);
  });

  it("covers every type that appears in the dataset", () => {
    const used = new Set(ALL_POKEMON.flatMap((p) => p.types));
    expect([...used].sort()).toEqual([...TYPES].sort());
  });

  it("has a --color-type-* token in index.css for each type", () => {
    const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
    for (const t of TYPES) {
      expect(css).toContain(`--color-type-${t}:`);
    }
  });
});

describe("token helpers", () => {
  it("builds the type color var reference", () => {
    expect(typeColorVar("fire")).toBe("var(--color-type-fire)");
  });

  it("uses one dark badge label color for every type (D-027)", () => {
    expect(typeTextVar()).toBe("var(--color-base)");
  });

  it("capitalizes a type slug for display", () => {
    expect(capitalize("dragon")).toBe("Dragon");
  });
});
