// Builds the canonical URL for a comparison state (D-022). When both slots are
// filled we use the clean, shareable path deep link (`/compare/a/vs/b`); a
// partial one-slot state falls back to a query param since the path route needs
// both segments; empty is the builder route.
//
// Everything that is not a slot rides on top as a query param, and every one of
// them is **omitted at its default** — no `asof` for the current generation, no
// `a1`/`a2` for a Pokémon's first ability — so the common case stays a clean
// path. That is the same "defaults stay out of the URL" rule the dex follows.
//
// `asof` is the generation the board is being read at (D-045). It is named
// `asof` rather than `gen` because the dex spends `?gen=` on its origin filter
// ("Pokémon introduced in Gen 5"), which is a different axis from "the board as
// it stood in Gen 5". One concept, one name, across both tools (D-049).
//
// `a1`/`a2` are the abilities the two cards are read with (D-073). They are
// part of the view — a Levitate board and a Cursed Body board are different
// answers to the same matchup — so they belong in the URL like everything else
// here.
//
// The third parameter became an options object when the second and third
// params arrived: `compareUrl(a, b, gen, x, y)` is a signature nobody can read
// at the call site, and `dexTable.js` had already established the shape a view
// travels in.
export function compareUrl(p1Slug, p2Slug, { asof, a1, a2 } = {}) {
  const query = [
    asof == null ? null : `asof=${asof}`,
    a1 == null ? null : `a1=${a1}`,
    a2 == null ? null : `a2=${a2}`,
  ].filter(Boolean);
  const withQuery = (base, existing = "") => {
    const qs = [existing, ...query].filter(Boolean).join("&");
    return qs ? `${base}?${qs}` : base;
  };
  if (p1Slug && p2Slug) return withQuery(`/compare/${p1Slug}/vs/${p2Slug}`);
  if (p1Slug) return withQuery("/compare", `p1=${p1Slug}`);
  if (p2Slug) return withQuery("/compare", `p2=${p2Slug}`);
  return withQuery("/compare");
}
