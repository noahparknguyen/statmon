import { describe, it, expect } from "vitest";
import { STAT_ORDER, STAT_LABEL, MAX_STAT, statPct } from "./stats";

describe("stat metadata", () => {
  it("has the six modern stats, each with a label (D-004)", () => {
    expect(STAT_ORDER).toHaveLength(6);
    for (const key of STAT_ORDER) {
      expect(STAT_LABEL[key]).toBeTruthy();
    }
  });
});

describe("statPct", () => {
  it("scales against the fixed 255 reference, not the pair (D-011)", () => {
    expect(statPct(0)).toBe("0%");
    expect(statPct(MAX_STAT)).toBe("100%");
    expect(statPct(MAX_STAT / 2)).toBe("50%");
  });

  it("clamps above the reference so a bar can never overflow its track", () => {
    expect(statPct(MAX_STAT + 100)).toBe("100%");
  });
});
