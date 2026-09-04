// Builds the canonical URL for a comparison state (D-022). When both slots are
// filled we use the clean, shareable path deep link (`/compare/a/vs/b`); a
// partial one-slot state falls back to a query param since the path route needs
// both segments; empty is the builder route.
//
// `asof` is the generation the board is being read at (D-045), carried as a
// query param on top of whichever shape the slots produce. It is omitted for
// the current generation, so the common case stays a clean path — the same
// "defaults stay out of the URL" rule the dex follows.
//
// Named `asof` rather than `gen` because the dex spends `?gen=` on its origin
// filter ("Pokémon introduced in Gen 5"), which is a different axis from "the
// board as it stood in Gen 5". One concept, one name, across both tools (D-049).
export function compareUrl(p1Slug, p2Slug, asof = null) {
  const query = asof == null ? "" : `asof=${asof}`;
  const withQuery = (base, existing = "") => {
    const qs = [existing, query].filter(Boolean).join("&");
    return qs ? `${base}?${qs}` : base;
  };
  if (p1Slug && p2Slug) return withQuery(`/compare/${p1Slug}/vs/${p2Slug}`);
  if (p1Slug) return withQuery("/compare", `p1=${p1Slug}`);
  if (p2Slug) return withQuery("/compare", `p2=${p2Slug}`);
  return withQuery("/compare");
}
