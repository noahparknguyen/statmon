import { Link } from "react-router";

// The shared button: three variants and two sizes, so every page's buttons
// come from one set of class strings rather than copies that drift apart.
//
// Pass `to` to render a react-router <Link> that looks identical to a
// <button>: the buttons on Home and the 404 are navigations, not actions.
//
// `ghost` is the quiet one: no fill and no border until the pointer arrives,
// for an action that shouldn't compete with what it sits under, such as "Clear
// all filters" and "Clear record".
//
// Class strings are written out in full rather than composed from fragments, so
// Tailwind's scanner can see every utility.
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
