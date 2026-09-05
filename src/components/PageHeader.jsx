// The heading block every page and every Home feature section opens with: the
// name in the `Word.` motif with the accent dot, and a one-line description
// under it.
//
// It exists because the same six lines of markup were hand-written five times —
// /compare, /dex, /types, /credits and `FeaturePreview` — and had already
// drifted: Credits was left-aligned with an 18px description where the three
// tools were centred with a 14px one, for no reason either page could state.
// The accent dot alone was copied seven times across the site.
//
// `as` is the heading level, not a style. The three tools and Credits are the
// page, so they render an `<h1>`; a Home feature section sits under Home's own
// `<h1>` and renders an `<h2>` — the same block at the same size, one rung down
// the outline. Keeping the level a prop is what lets one component serve both
// without either page growing a second `<h1>` (asserted in routes.test.jsx).
//
// Home's hero and the 404's numeral are deliberately NOT built from this: they
// are one-off treatments at a different size, documented as exemptions in
// 04_design §6 rather than bent to fit.
export default function PageHeader({ title, subtitle, as: Heading = "h1" }) {
  return (
    <header className="mb-8 text-center">
      <Heading className="text-h1">
        {title}
        <span className="text-accent">.</span>
      </Heading>
      {subtitle && (
        <p className="mt-1 text-body-sm text-secondary">{subtitle}</p>
      )}
    </header>
  );
}
