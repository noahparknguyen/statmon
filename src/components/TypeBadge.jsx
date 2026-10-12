import { typeColorVar, typeTextVar, capitalize } from "../lib/types";

// A type pill, coloured by the type's token. `size="sm"` for rows.
//
// `label` overrides the text (the type chart's column headers show a
// three-letter abbreviation), and `className` is for layout only: the caller
// can make a badge fill its column, but the colour pairing stays in here,
// where `npm run audit:contrast` checks it.
//
// `radius` is a prop rather than something passed through `className`,
// because adding `rounded-xs` to a string that already says `rounded-full`
// doesn't override it. Tailwind settles that by stylesheet order, not by the
// order the classes are written. A prop picks one class instead of stacking
// two.
const RADIUS = { full: "rounded-full", xs: "rounded-xs" };

export default function TypeBadge({
  type,
  size = "md",
  radius = "full",
  label,
  className = "",
}) {
  const pad = size === "sm" ? "px-1.5 py-0.5" : "px-2 py-0.5";
  return (
    <span
      className={`text-badge ${RADIUS[radius]} ${pad} ${className}`}
      style={{ backgroundColor: typeColorVar(type), color: typeTextVar() }}
    >
      {label ?? capitalize(type)}
    </span>
  );
}
