// The shared look of a toggle chip: the pill shape, and the on and off colours.
//
// Statmon has four chip families: form and ability chips on a Pokémon card, the
// dex's type and generation filters, and the comparison board's generation
// strip. Their sizes differ, because each sits in a different space. Form and
// ability chips share the card's 88px controls band and stay compact enough for
// two rows in it, filter chips carry a dot and an ×, and generation chips are
// near-square around a single numeral. Their colours don't differ, and copies
// of the same class strings in several places would drift apart, as `Button`
// prevents for buttons.
//
// So colour and shape live here, and size at each call site.
//
// A constants-only `.jsx` module, like `dexColumns.jsx`, for two reasons:
// Tailwind only scans `.jsx`, so these strings would be missed in `lib/`, and
// `react-refresh` needs a component file to export only components.

// Shape and behaviour, without size: every chip is a pill.
export const CHIP = "text-badge inline-flex items-center rounded-full border";

// The box a compact chip occupies, reserved by the cell that holds it.
//
// A chip is exactly 21px tall: `text-badge` has no line-height padding, so its
// line is the 11px font size, plus `py-1` (4 + 4) and a 1px border on each side.
//
// The cell needs it because the placeholders beside these chips aren't chips.
// `FormChips` renders nothing for the 845 entries with one form, and the card
// shows a dash instead. `AbilityChips` shows a sentence for the 14 entries with
// no abilities, and on any Gen 1 or 2 board. Both are plain text, so their
// height would come from the inherited line height (16px × 1.5 = 24px), three
// pixels taller than a chip, and the Form and Ability labels would shift
// whenever a Pokémon had a form: a card that twitches as you browse. Reserving
// the height on the cell fixes both placeholders and leaves the chips to size
// themselves.
export const CHIP_CELL = "flex min-h-[21px] min-w-0 flex-wrap items-center";

// The label beside a `CHIP_CELL`, held in the same 21px box.
//
// With the columns aligned on their baselines, the label would still take its
// position from whatever the cell held: a chip and a bare glyph don't share a
// baseline, and a wrapped row of chips takes its baseline from its first line.
// That's about a pixel, small enough to look like a rendering glitch, but
// noticeable while browsing. With both sides in the same box and `items-start`
// on the grid, the label's position depends only on the box, whatever sits
// beside it.
export const CHIP_CELL_LABEL = "flex min-h-[21px] items-center";

// Selected, when the chip has no colour of its own.
export const CHIP_ON = "border-transparent bg-accent text-accent-contrast";

// Unselected. Hovering only brightens the label, and the fill stays put, so a
// row of chips doesn't shimmer as the pointer crosses it.
export const CHIP_OFF =
  "border-border-strong bg-elevated text-secondary hover:text-primary";

// Unselected, for a chip that isn't interactive: `CHIP_OFF` without its hover,
// since a <span> that lights up under the pointer promises a click it won't
// take. Home's read-only ability pills use it. It lives here with the other
// colour pairs rather than in that component, so the chips' colours stay in one
// place.
export const CHIP_STATIC = "border-border-strong bg-elevated text-secondary";

// Selected, when the chip has its own fill (a type colour, set inline by the
// caller). The border steps aside, and the fill shows the state.
export const CHIP_ON_FILLED = "border-transparent";

// The filter family's size, the one size shared by more than one call site, so
// it lives here with the colours. `FilterChip` uses it, and so does the dex's
// "Filters (N)" disclosure, which isn't a filter chip but sits in a row with
// them.
//
// min-h-9 (36px) matches Button's compact size. Without it the chips would be
// 25px tall: above WCAG 2.5.8's 24px minimum, but small for a thumb, and unlike
// every other compact control.
export const CHIP_FILTER_GEOMETRY =
  "min-h-9 gap-1.5 px-3 py-1.5 transition-colors";
