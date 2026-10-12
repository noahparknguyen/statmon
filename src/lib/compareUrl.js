// The canonical URL for a comparison. With both slots filled it's the clean,
// shareable path (`/compare/a/vs/b`). With one, it falls back to a query
// parameter, since the path needs both. Empty is plain `/compare`.
//
// Everything else rides along as a query parameter, and each is left out at
// its default: no `asof` for today's generation, and no `a1` or `a2` for a
// Pokémon's first ability. So the usual case stays a clean path, as on the dex.
//
// `asof` is the generation the board is read at. It isn't `gen` because the
// dex uses `?gen=` for where a Pokémon comes from ("introduced in Gen 5"),
// which is a different question from "the board as it stood in Gen 5". One
// meaning per name across both tools.
//
// `a1` and `a2` are the abilities the two cards are read with. They're part of
// the view, since a Levitate board and a Cursed Body board answer the same
// matchup differently, so they belong in the URL too. They come in an options
// object because `compareUrl(a, b, gen, x, y)` would be unreadable where it's
// called.
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
