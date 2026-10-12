// The heading block every page and every Home feature section opens with: the
// name in the `Word.` motif with the accent dot, and a one-line description
// under it.
//
// One component, so every page's heading has the same alignment, sizes, and
// spacing.
//
// `as` is the heading level, not a style. On a page, this is the page's title,
// so it renders an `<h1>`. A Home section sits under Home's own `<h1>` and
// renders an `<h2>`: the same block at the same size, one level down the
// outline. Keeping the level a prop lets one component serve both without Home
// getting a second `<h1>`, which routes.test.jsx checks.
//
// Home's wordmark (inside the sprite wall) and the 404's numeral aren't built
// from this, on purpose: they're one-off treatments at a different size,
// rather than bent to fit.
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
