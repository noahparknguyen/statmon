import { Children } from "react";

// A labelled group of chips: a `text-overline` name over a row.
//
// Every labelled chip group on the site is this component, so they all agree:
// the label sits 8px over the row, and the chips sit 6px apart.
//
// The label isn't decoration, which is why this is a component rather than a
// class-name convention. A name makes a lone toggle read as one of a set rather
// than an orphan in a bar of controls, and it's what tells two generation
// controls in one panel apart. A group without a name is the failure, and
// requiring `label` means nobody has to remember that.
//
// `role="group"` with an accessible name gives a screen reader the context the
// eye gets from the overline, which lets each chip inside keep its visible text
// as its whole accessible name (WCAG 2.5.3, as in FilterChip). `name` overrides
// that accessible name when a group has more to say than its label, such as
// "Defending type, pick up to two", so nothing has to hide inside the label as
// screen-reader text.
//
// `fit` is the one layout variant, and it's for the generation strip. Nine
// numerals have to stay on one line: wrapped at 390px, the ninth, the selected
// one, would sit alone on a second row. So a fitted group shares its width
// instead of wrapping: one column per chip, each up to 36px, shrinking only as
// far as the width demands. At 320px that's 24.7px, still over WCAG 2.5.8's
// 24px floor, which is why the strip keeps a 4px gap where every other group
// has 6: at 6px, the same width leaves 22.9px.
//
// `hint` gives a group's rule when its chips don't make it obvious ("leave
// empty for all"). `note` is a sentence about the current choice, under the row
// ("A dual type. Two rows of the chart, multiplied…").
const ROW = "flex flex-wrap gap-1.5";
const FIT = "grid gap-1";

// Where the label and the chips sit inside the group. Groups are left-aligned,
// as everything in a panel is. `center-below-sm` is for a group its parent
// centres in a stack below `sm`, the comparison's controls on a phone: the
// group is as wide as its widest part, so with one or two generations the label
// is wider than the chips, and left-aligned chips would sit off-centre under
// it. Centring both only there keeps the label level with the panel's edge
// everywhere else.
const ALIGN = {
  start: { label: "", row: "" },
  "center-below-sm": {
    label: "max-sm:text-center",
    row: "max-sm:justify-center",
  },
};

export default function ChipGroup({
  label,
  name = label,
  hint,
  note,
  fit = false,
  align = "start",
  children,
}) {
  const count = Children.toArray(children).length;
  return (
    <div role="group" aria-label={name} className="min-w-0">
      <div className={`mb-2 text-overline text-tertiary ${ALIGN[align].label}`}>
        {label}
        {/* Inside the label block, so it's part of what the overline
            introduces rather than a caption floating under the chips. */}
        {hint && <span className="ml-2 normal-case">{hint}</span>}
      </div>
      <div
        className={`${fit ? FIT : ROW} ${ALIGN[align].row}`}
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
