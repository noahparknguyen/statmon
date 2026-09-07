// The shared look of a toggle chip: the pill shape and the on/off colour pair.
//
// Statmon has four chip families — form and ability chips on a Pokémon card,
// the dex's type/generation filters, and the comparison board's generation
// strip. They differ in geometry, because each sits in a different space: form
// and ability chips share the card's 88px controls band and stay compact enough
// for two rows in it, filter chips carry a dot and an ×, and generation chips
// are near-square around a single numeral. What they do NOT differ in is colour
// — and before this file the same four class strings were hand-copied into
// three of them, which is precisely how variants drift apart (the [D-032]
// lesson that produced `Button`).
//
// So: colour and shape here, geometry at the call site.
//
// A constants-only `.jsx` module for the same two reasons as `dexColumns.jsx` —
// Tailwind only scans `.jsx` (D-038), so these strings would be invisible from
// `lib/`, and `react-refresh` requires a component file to export only
// components, so they cannot hang off a component either.

// Shape and behaviour, without size: every chip is a pill that transitions.
export const CHIP = "text-badge inline-flex items-center rounded-full border";

// The box a compact chip occupies, reserved by the CELL that holds it.
//
// A chip is exactly 21px tall and the arithmetic is worth writing down because
// this constant depends on it: `text-badge` is `leading-none`, so its line box
// is the 11px font size itself, plus `py-1` (4 + 4) and the 1px border on each
// side.
//
// **The cell needs it because the two placeholders beside these chips are not
// chips.** `FormChips` renders nothing for the 845 single-form entries and the
// card supplies an em-dash; `AbilityChips` renders a sentence for the 14
// entries with none, and for any Gen 1 or Gen 2 board. Both are inline text in
// a block, so their height came from the INHERITED line-height (16px x 1.5 =
// 24px) rather than from the glyph — three pixels taller than a chip. With the
// band on `items-baseline` that moved the Form and Ability labels up by 4px and
// 3px the moment a Pokémon had a form, which is a card that twitches as you
// browse.
//
// Reserving it on the cell fixes both placeholders at once and leaves the chips
// to size themselves.
export const CHIP_CELL = "flex min-h-[21px] min-w-0 flex-wrap items-center";

// The LABEL beside a `CHIP_CELL`, held in the same 21px box.
//
// Reserving the cell was only half of it. The band aligned its two columns on
// `items-baseline`, so the label still took its position from whatever the cell
// contained: a chip and a bare glyph do not sit on the same baseline, and a
// chip row that WRAPS takes its baseline from the first line, which moves as
// the row grows. That is worth about a pixel, which is small enough to look
// like a rendering artifact and consistent enough to notice while browsing.
//
// Given both sides the same box and `items-start` on the grid, the label's
// position is a function of the reservation alone — it no longer depends on
// what is beside it, wrapped or not, chip or dash.
export const CHIP_CELL_LABEL = "flex min-h-[21px] items-center";

// Selected, when the chip has no colour of its own.
export const CHIP_ON = "border-transparent bg-accent text-accent-contrast";

// Unselected. The hover only brightens the label — the fill stays put, so a
// row of chips does not shimmer as the pointer crosses it.
export const CHIP_OFF =
  "border-border-strong bg-elevated text-secondary hover:text-primary";

// Unselected, for a chip that is NOT interactive: `CHIP_OFF` without its hover,
// since a <span> that lights up under the pointer promises a click it does not
// accept. Home's read-only ability pills are the case (D-078); it lives here
// with the rest of the vocabulary rather than in that component, because a
// fourth colour pair defined at a call site is the drift this module exists to
// stop (06_style_guide §12 rule 8).
export const CHIP_STATIC = "border-border-strong bg-elevated text-secondary";

// Selected, when the chip carries its own fill (a type colour, supplied inline
// by the caller). The border gets out of the way; the fill is the state.
export const CHIP_ON_FILLED = "border-transparent";

// The filter family's geometry — the one geometry that is genuinely shared by
// more than one call site, so it lives here with the colours rather than being
// re-typed. `FilterChip` wears it, and so does the dex's "Filters (N)"
// disclosure, which is not a filter chip but has to sit in a row with them.
//
// min-h-9 (36px) matches Button's compact size (04_design §6). Without it the
// chips came out 25px tall — above the WCAG 2.5.8 AA floor of 24px, but a mean
// target for a thumb, and inconsistent with every other compact control.
export const CHIP_FILTER_GEOMETRY =
  "min-h-9 gap-1.5 px-3 py-1.5 transition-colors";
