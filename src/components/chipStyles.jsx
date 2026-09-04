// The shared look of a toggle chip: the pill shape and the on/off colour pair.
//
// Statmon has three chip families — form chips on a Pokémon card, the dex's
// type/generation filters, and the comparison board's generation strip. They
// differ in geometry, because each sits in a different space: form chips are
// compact enough to fit a fixed 40px band, filter chips carry a dot and an ×,
// and generation chips are near-square around a single numeral. What they do
// NOT differ in is colour — and before this file the same four class strings
// were hand-copied into all three, which is precisely how variants drift apart
// (the [D-032] lesson that produced `Button`).
//
// So: colour and shape here, geometry at the call site.
//
// A constants-only `.jsx` module for the same two reasons as `dexColumns.jsx` —
// Tailwind only scans `.jsx` (D-038), so these strings would be invisible from
// `lib/`, and `react-refresh` requires a component file to export only
// components, so they cannot hang off a component either.

// Shape and behaviour, without size: every chip is a pill that transitions.
export const CHIP = "text-badge inline-flex items-center rounded-full border";

// Selected, when the chip has no colour of its own.
export const CHIP_ON = "border-transparent bg-accent text-accent-contrast";

// Unselected. The hover only brightens the label — the fill stays put, so a
// row of chips does not shimmer as the pointer crosses it.
export const CHIP_OFF =
  "border-border-strong bg-elevated text-secondary hover:text-primary";

// Selected, when the chip carries its own fill (a type colour, supplied inline
// by the caller). The border gets out of the way; the fill is the state.
export const CHIP_ON_FILLED = "border-transparent";
