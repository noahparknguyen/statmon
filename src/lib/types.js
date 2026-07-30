// Type → token color helpers. We reference the CSS custom properties defined
// in index.css (--color-type-*), so components stay token-driven and Tailwind's
// scanner never needs to see a dynamically-built class.

export const typeColorVar = (slug) => `var(--color-type-${slug})`;

// Badge label color. Every type color is light enough on the dark UI that
// near-black text maximizes contrast — the mid-luminance types (fighting,
// poison, ghost, dragon, dark) score far better with dark text than white
// (dragon was also nudged lighter). So all badges use dark text. (D-027)
export const typeTextVar = () => "var(--color-base)";

export const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
