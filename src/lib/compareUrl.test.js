import { describe, it, expect } from "vitest";
import { compareUrl } from "./compareUrl";

// This module had no test of its own until the ability parameters arrived
// (D-073). It was covered incidentally through routes.test.jsx, which renders
// pages rather than reading URLs — so a wrong query string showed up as a page
// that looked fine and linked somewhere slightly wrong. The URL is the single
// source of truth for the whole comparison (D-022); it is worth asserting
// directly.

describe("compareUrl", () => {
  it("uses the path deep link when both slots are filled", () => {
    expect(compareUrl("volcarona", "chandelure")).toBe(
      "/compare/volcarona/vs/chandelure",
    );
  });

  it("falls back to a query param for a partial selection", () => {
    // The path route needs both segments, so a one-slot state cannot use it.
    expect(compareUrl("volcarona", null)).toBe("/compare?p1=volcarona");
    expect(compareUrl(null, "chandelure")).toBe("/compare?p2=chandelure");
    expect(compareUrl(null, null)).toBe("/compare");
  });

  it("carries the generation lens on top of either shape", () => {
    expect(compareUrl("charizard", "blastoise", { asof: 1 })).toBe(
      "/compare/charizard/vs/blastoise?asof=1",
    );
    expect(compareUrl("charizard", null, { asof: 1 })).toBe(
      "/compare?p1=charizard&asof=1",
    );
    expect(compareUrl(null, null, { asof: 3 })).toBe("/compare?asof=3");
  });

  it("carries each card's ability", () => {
    expect(
      compareUrl("krookodile", "gengar", { asof: 6, a2: "levitate" }),
    ).toBe("/compare/krookodile/vs/gengar?asof=6&a2=levitate");
    expect(compareUrl("pikachu", "gengar", { a1: "lightning-rod" })).toBe(
      "/compare/pikachu/vs/gengar?a1=lightning-rod",
    );
  });

  it("omits every parameter at its default, so the common case is a path", () => {
    // The site-wide rule: a default is spelled as no parameter at all, so
    // there is one state rather than two that can disagree, and a shared link
    // stays clean.
    expect(
      compareUrl("volcarona", "chandelure", { asof: null, a1: null, a2: null }),
    ).toBe("/compare/volcarona/vs/chandelure");
    expect(compareUrl("volcarona", "chandelure", {})).toBe(
      "/compare/volcarona/vs/chandelure",
    );
  });

  it("orders the query the same way however it was built", () => {
    // Two links to the same board should be the same string, or a shared URL
    // stops matching a bookmarked one for no reason a reader could see.
    expect(
      compareUrl("a", "b", { a2: "levitate", asof: 6, a1: "static" }),
    ).toBe("/compare/a/vs/b?asof=6&a1=static&a2=levitate");
  });
});
