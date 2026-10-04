import { Children } from "react";

// A labelled group of chips: a `text-overline` name over a row (06_style_guide
// §12.2).
//
// It was a private `Group` inside `DexFilters` and a hand-written copy inside
// the stat game's controls. The games' setup panel needs five of them (D-096),
// which puts this well past D-058's threshold — a second caller is when a block
// stops being page markup and becomes a component.
//
// **Every labelled chip group is this component now** (D-135), which it was
// not: the generation strip and the type chart's picker each built their own,
// and the three disagreed on the label's gap (6px or 8px) and the chips' gap
// (4px or 6px). One component, one answer: the label sits 8px over the row,
// chips sit 6px apart.
//
// **The label is not decoration**, which is the reason this is a component
// rather than a `<div className="...">` convention. D-040 established that the
// dex's groups are named so a lone toggle reads as a peer rather than an orphan
// in a bar of controls, and D-050 that two generation controls in one panel
// cannot share one bare label. A group without a name is the failure mode; a
// component with `label` required is how that stops being a thing you remember.
//
// `role="group"` plus an accessible name gives a screen reader the same context
// the eye gets from the overline, which is what lets each chip inside keep its
// visible text as its whole accessible name (WCAG 2.5.3, the FilterChip rule).
// `name` overrides that accessible name when a group has more to say than its
// label does — "Defending type, pick up to two" — so nothing has to hide inside
// the label as `sr-only` text.
//
// **`fit` is the one layout variant, and it exists for the generation strip.**
// Nine numerals have to stay on one line: wrapped at 390px they left the ninth,
// the selected one, alone on a second row. So a fitted group shares its width
// instead of wrapping — one column per chip, each up to 36px and shrinking
// below that only as far as the width demands. At 320px that is 24.7px, still
// over WCAG 2.5.8's floor, and why the strip keeps a 4px gap where every other
// group has 6: at 6px the same width leaves 22.9px. (D-137)
//
// `hint` carries a group's rule when it is not obvious from its chips ("leave
// empty for all"); `note` is a sentence about the current choice, set under
// the row ("A dual type. Two rows of the chart, multiplied…").
const ROW = "flex flex-wrap gap-1.5";
const FIT = "grid gap-1";

export default function ChipGroup({
  label,
  name = label,
  hint,
  note,
  fit = false,
  children,
}) {
  const count = Children.toArray(children).length;
  return (
    <div role="group" aria-label={name} className="min-w-0">
      <div className="mb-2 text-overline text-tertiary">
        {label}
        {/* Inside the label block so it is part of what the overline
            introduces, not a caption floating under the chips. */}
        {hint && <span className="ml-2 normal-case">{hint}</span>}
      </div>
      <div
        className={fit ? FIT : ROW}
        style={
          fit
            ? { gridTemplateColumns: `repeat(${count}, minmax(0, 2.25rem))` }
            : undefined
        }
      >
        {children}
      </div>
      {note && <p className="mt-2 text-body-sm text-secondary">{note}</p>}
    </div>
  );
}
