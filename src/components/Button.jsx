import { Link } from "react-router";

// The shared button/CTA. Two variants and two sizes cover every control on the
// site; before this existed the same class strings were hand-copied across
// Home, Compare, NotFound and the style playground, which is exactly how
// variants drift apart (04_design §6).
//
// Pass `to` to render a react-router <Link> that looks identical to a <button>
// — the CTAs on Home and 404 are navigations, not actions.
//
// Class strings are written out in full rather than composed from fragments so
// Tailwind's scanner can see every utility (cf. D-028).
const BASE =
  "inline-flex items-center gap-2 rounded-full text-button transition-colors";

const VARIANT = {
  primary: "bg-accent text-accent-contrast hover:bg-accent-hover",
  secondary:
    "bg-elevated border border-border-subtle text-secondary hover:text-primary hover:border-border-strong",
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
