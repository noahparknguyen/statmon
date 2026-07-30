// Builds the canonical URL for a comparison state (D-022). When both slots are
// filled we use the clean, shareable path deep link (`/compare/a/vs/b`, the form
// SSR will render in Phase 4); a partial one-slot state falls back to a query
// param since the path route needs both segments; empty is the builder route.
export function compareUrl(p1Slug, p2Slug) {
  if (p1Slug && p2Slug) return `/compare/${p1Slug}/vs/${p2Slug}`;
  if (p1Slug) return `/compare?p1=${p1Slug}`;
  if (p2Slug) return `/compare?p2=${p2Slug}`;
  return "/compare";
}
