// A labelled group of chips: a `text-overline` name over a wrapping row.
//
// It was a private `Group` inside `DexFilters` and a hand-written copy inside
// the stat game's controls. The games' setup panel needs five of them (D-096),
// which puts this well past D-058's threshold — a second caller is when a block
// stops being page markup and becomes a component.
//
// **The label is not decoration**, which is the reason this is a component
// rather than a `<div className="...">` convention. D-040 established that the
// dex's groups are named so a lone toggle reads as a peer rather than an orphan
// in a bar of controls, and D-050 that two generation controls in one panel
// cannot share one bare label. A group without a name is the failure mode; a
// component with `label` required is how that stops being a thing you remember.
//
// `role="group"` plus `aria-label` gives a screen reader the same context the
// eye gets from the overline, which is what lets each chip inside keep its
// visible text as its whole accessible name (WCAG 2.5.3, the FilterChip rule).
export default function ChipGroup({ label, hint, children }) {
  return (
    <div role="group" aria-label={label}>
      <div className="text-overline text-tertiary mb-2">
        {label}
        {/* The hint carries a group's rule when it has one that is not obvious
            from its chips — "leave empty for all" on a filter, against the
            stats group where empty is impossible (D-096). Inside the label
            block so it is part of what the overline introduces, not a caption
            floating under the chips. */}
        {hint && <span className="ml-2 normal-case text-tertiary">{hint}</span>}
      </div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}
