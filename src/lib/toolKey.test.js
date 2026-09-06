import { describe, it, expect } from "vitest";
import { toolOf } from "./toolKey";
import { routes } from "../router";

// This function decides two user-visible behaviours at once — whether the page
// scrolls back to the top, and whether focus jumps to <main> — so the thing
// worth asserting is not the string it returns but the EQUIVALENCE CLASSES it
// draws: which URLs count as the same page, and which do not.

describe("toolOf", () => {
  it("keeps a tool's state URLs on one key", () => {
    // The bug this exists to prevent (D-087): each of these was a separate
    // scroll key, so picking a Pokémon, swapping or toggling a type scrolled
    // the board away from under you.
    const compare = [
      "/compare",
      "/compare/krookodile/vs/gengar",
      "/compare/krookodile/vs/gengar?asof=6&a2=levitate",
    ].map(toolOf);
    expect(new Set(compare).size).toBe(1);

    const types = ["/types", "/types/water", "/types/water/flying"].map(toolOf);
    expect(new Set(types).size).toBe(1);
  });

  it("separates the tools from each other and from home", () => {
    const keys = ["/", "/compare", "/dex", "/types", "/credits"].map(toolOf);
    expect(new Set(keys).size).toBe(keys.length);
    expect(toolOf("/")).toBe("home");
  });

  it("gives every route in the table a key, from its own first segment", () => {
    // Walks the real route table, so a route added later cannot quietly land
    // outside this rule — which is the way it would regress.
    const paths = routes[0].children
      .map((r) => r.path)
      .filter((p) => p && p !== "*");
    for (const path of paths) {
      const key = toolOf(`/${path}`);
      expect(key, path).toBeTruthy();
      expect(key, path).toBe(path.split("/")[0]);
    }
  });

  it("is stable for a trailing slash and a bare root", () => {
    expect(toolOf("/dex/")).toBe(toolOf("/dex"));
    expect(toolOf("")).toBe("home");
  });
});
