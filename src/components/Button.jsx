import { Link } from "react-router";

// The shared button/CTA. Three variants and two sizes cover every control on
// the site that has a text label; before this existed the same class strings
// were hand-copied across Home, Compare, NotFound and the style playground,
// which is exactly how variants drift apart (04_design §6).
//
// Pass `to` to render a react-router <Link> that looks identical to a <button>
// — the CTAs on Home and 404 are navigations, not actions.
//
// **`ghost` is the quiet one** (D-135): no fill and no border until the pointer
// arrives, for an action that should not compete with what it sits under —
// "Clear all filters", "Clear record". 04_design §6 said to add it here when a
// use appeared rather than hand-roll one; two had appeared, both hand-rolled,
// at two different heights.
//
// Class strings are written out in full rather than composed from fragments so
// Tailwind's scanner can see every utility (cf. D-028).
const BASE =
  "inline-flex items-center gap-2 rounded-full text-button transition-colors";

const VARIANT = {
  primary: "bg-accent text-accent-contrast hover:bg-accent-hover",
  secondary:
    "bg-elevated border border-border-subtle text-secondary hover:text-primary hover:border-border-strong",
  ghost: "text-tertiary hover:bg-elevated hover:text-primary",
};

const SIZE = {
  md: "h-11 px-6", // page-level CTAs
  sm: "h-9 px-4", // inline controls (Swap)
};

export default function Button({
  variant = "primary",
  size = "md",
  to,
  className = "",
  children,
  ...rest
}) {
  const cls = [BASE, VARIANT[variant], SIZE[size], className]
    .filter(Boolean)
    .join(" ");

  if (to) {
    return (
      <Link to={to} className={cls} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={`${cls} disabled:opacity-40 disabled:pointer-events-none`}
      {...rest}
    >
      {children}
    </button>
  );
}
