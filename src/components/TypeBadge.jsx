import { typeColorVar, typeTextVar, capitalize } from "../lib/types";

// A type pill, colored by the type token. `size="sm"` for search rows.
//
// `label` overrides the text (the type chart's column headers show a three-
// letter abbreviation) and `className` is a layout hook only — the caller can
// make a badge fill its column, but the colour pairing stays in here, where it
// is the one audited by `npm run audit:contrast`.
//
// `radius` is a prop rather than something a caller passes through `className`
// for a reason worth stating: appending `rounded-xs` to a string that already
// says `rounded-full` does not override it. Tailwind resolves that collision by
// stylesheet order, not by the order the classes are written — the same trap
// that silently gave the dex's sort control the wrong height (D-042). A prop
// picks one class instead of stacking two.
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
