#!/usr/bin/env node
/**
 * Statmon — style allowlist audit
 * ---------------------------------------------------------------------------
 * Fails on any utility in src/ that the style guide does not allow.
 *
 * 06_style_guide has opened on one sentence since it was written: "If a value
 * isn't in this document, it doesn't get used." For colour that was true from
 * D-033 on, because the stock palette was cleared and an off-palette class
 * simply produces no CSS. For everything else it was a hope. A `p-5` on two
 * cards, a `rounded-xl` token nothing used, a bare `z-1300`, a `px-5` board
 * beside `px-3` and `px-4` ones: each was a value the guide never named, and
 * nothing said so (D-134).
 *
 * So the guide's closed sets are written down here, once, as rules, and every
 * utility in every class string is held to them. The sets are the guide's own
 * tables (06_style_guide §2–§10); where this file and the guide disagree, the
 * guide is the one to read and this is the one to fix.
 *
 * WHAT IT CHECKS, by property:
 *   - colour       semantic tokens only (§3). A primitive such as
 *                  `neutral-500` or `accent-300` names a value, not a role.
 *   - type         the 22 named text styles (§5), read from index.css. No
 *                  stock size (`text-sm`), no `leading-*` or `tracking-*`;
 *                  family and weight only as inline emphasis.
 *   - spacing      padding, margin, gap and space from the scale (§6.1).
 *   - radius       the five role radii (§7.1); a side radius only follows a
 *                  surface's `lg` curve.
 *   - size, place  on the 4px grid, a fraction, or a keyword (§6.4).
 *   - opacity      the four steps (§7.4).
 *   - layer        `z-0`/`z-1`/`z-2` for paint order inside one component, or
 *                  a token from the ladder (§10).
 *   - effects      no stock shadow, ring or blur outside the named ones.
 *   - arbitrary    `[...]` values only from the list below, each with the
 *                  derivation that makes it a number rather than a guess (§6.5).
 *   - unknown      a token that is not a utility this reader knows fails too,
 *                  so the coverage cannot quietly shrink.
 *
 * WHAT IT DOES NOT CHECK, stated rather than implied: inline `style={{…}}`
 * objects, which carry token references (`var(--…)`) that a class scan cannot
 * see; and class names built at run time, which Tailwind cannot see either and
 * which this codebase therefore never builds (D-028).
 *
 *   npm run audit:styles
 */

import { COLORS, TEXT_STYLES, classStrings } from "./classes.mjs";

/* -------------------------------------------------------------------------
   The closed sets (06_style_guide).
   ---------------------------------------------------------------------- */

// §3: the semantic colour tokens. Every other `--color-*` in index.css is a
// primitive or a type colour, and both are reached through these or through
// `typeColorVar()`, never as a class.
const SEMANTIC_COLORS = new Set([
  "base",
  "surface",
  "elevated",
  "border-subtle",
  "border-strong",
  "border-field",
  "primary",
  "secondary",
  "tertiary",
  "accent",
  "accent-hover",
  "accent-contrast",
  "accent-muted",
  "diff-tie",
  "track-glass",
  "transparent",
]);

// §7.4: a colour's opacity modifier. 85 is a sticky bar over scrolling
// content, 70 a modal's backdrop.
const COLOR_ALPHA = new Set(["70", "85"]);

// §7.4: element opacity. 40 is unavailable or disabled, 50 is receded.
const OPACITY = new Set(["40", "50"]);

// §6.1: the spacing scale, in Tailwind steps (×4px). 36 and 40 are the two
// layout steps: Home's section rhythm (D-083) and the flanking art's anchor
// off the centre line (D-072).
const SPACING = new Set([
  "0",
  "px",
  "0.5",
  "1",
  "1.5",
  "2",
  "2.5",
  "3",
  "4",
  "5",
  "6",
  "8",
  "10",
  "12",
  "16",
  "20",
  "24",
  "36",
  "40",
  "auto",
]);

// §7.1: one radius per role.
const RADII = new Set(["xs", "sm", "md", "lg", "full"]);

// §6.4: the named measures a box may be capped at.
const CONTAINERS = new Set(["content", "sm", "md", "xl", "2xl", "4xl"]);

// §10: paint order inside one component. Anything that has to sit above or
// below another component reads the ladder's token instead.
const LOCAL_Z = new Set(["0", "1", "2"]);

// Inline emphasis (§5): family and weight may change inside a run of text, and
// only those two, only to these.
const EMPHASIS = new Set(["font-display", "font-semibold"]);

// §6.5: every arbitrary value, with the working that makes it a number rather
// than a taste. A new one is added here with its derivation, or it fails.
const ARBITRARY = new Map([
  ["min-h-[21px]", "a compact chip: 11px text, py-1, a 1px border each side"],
  ["min-h-[26rem]", "the game board's floor on a landscape phone"],
  ["h-[72svh]", "Home's hero wall, so the board crests the fold (D-070)"],
  ["max-h-[85svh]", "the setup dialog stays inside the viewport"],
  ["w-[min(36rem,calc(100vw-2rem))]", "the setup dialog, inside the gutters"],
  ["max-h-[475px]", "the vendored artwork's own size (D-109)"],
  ["max-w-[475px]", "the vendored artwork's own size (D-109)"],
  ["[image-rendering:pixelated]", "pixel sprites at whole multiples"],
  ["[--wall-tile:6rem]", "a hero tile at the sprite's native 96px"],
  ["[--wall-tile:12rem]", "a hero tile at exactly 2x native (D-070)"],
  ["grid-cols-[1.6rem_1fr_3.25rem_1fr_1.6rem]", "the mirrored stat row"],
  ["grid-cols-[0.55rem_auto_0.55rem]", "a difference with a caret each side"],
  ["grid-cols-[2rem_1fr_2.5rem]", "a stat row: label, bar, value"],
  ["grid-cols-[5rem_1fr_2.25rem]", "a phone stat line: name, bar, value"],
  ["grid-cols-[2.5rem_1fr]", "a tier row: multiplier, attackers"],
  ["grid-cols-[auto_1fr]", "a label column beside its controls"],
  ["grid-cols-[1fr_auto_1fr]", "two sides and the thing between them"],
  ["grid-cols-[1fr_auto]", "/style: a specimen and its spec"],
  ["grid-rows-[1fr_auto_1fr]", "a stacked board and its round card"],
  [
    "grid-rows-[minmax(15rem,1fr)_auto_1fr]",
    "the type game's answer column: the verdict's room, never under its tallest card, then the answers (D-143)",
  ],
  [
    "grid-rows-[1fr_auto]",
    "a verdict's layer: the card on its bottom edge (D-143)",
  ],
  [
    "right-[calc(50%+8rem+1px)]",
    "the attacking column's right edge: half the board, half the 16rem answer column, one divider (D-143)",
  ],
]);

/* -------------------------------------------------------------------------
   The rules, by property family.
   ---------------------------------------------------------------------- */

// A value on the 4px grid, a fraction, or a keyword: the shapes a size or a
// position may take (§6.4).
const onGrid = (v) =>
  /^\d+(\.5)?$/.test(v) ||
  /^\d+\/\d+$/.test(v) ||
  /^(px|full|auto|svh|max|min|fit)$/.test(v);

const after = (base, prefix) => base.slice(prefix.length);

// Which families carry a design value, and the test for each. Families not
// named here are layout mechanics (display, flex direction, overflow, order…)
// and take no value the guide has an opinion about.
function verdict({ base, family }) {
  const raw = base.replace(/^-/, "");

  if (raw.includes("[")) {
    return ARBITRARY.has(raw)
      ? null
      : "arbitrary value with no derivation in the list (§6.5)";
  }

  if (!family)
    return raw.startsWith("text-")
      ? "a stock text size; use a named style (§5)"
      : "not a utility this audit knows";
  if (family === "text-style") return null;
  if (family.startsWith("component:") || family.startsWith("marker:"))
    return null;

  const colour = (value) => {
    const [name, alpha] = value.split("/");
    if (!SEMANTIC_COLORS.has(name))
      return COLORS.has(name)
        ? `a primitive colour; use its semantic token (§3)`
        : "not a colour token";
    if (alpha != null && !COLOR_ALPHA.has(alpha))
      return `opacity /${alpha} is not one of the steps (§7.4)`;
    return null;
  };

  switch (family) {
    case "text-color":
      return colour(after(raw, "text-"));
    case "background":
      return colour(after(raw, "bg-"));
    case "border-color":
      return colour(after(raw, "border-"));
    case "text-decoration-color":
      return colour(after(raw, "decoration-"));
    case "text":
      return "a stock text size; use a named style (§5)";

    case "font-family":
    case "font-weight":
    case "font-size":
      return EMPHASIS.has(raw) ? null : "type is set by named styles (§5)";
    case "line-height":
    case "letter-spacing":
      return "type is set by named styles (§5)";

    case "padding":
    case "padding-x":
    case "padding-y":
    case "padding-top":
    case "padding-right":
    case "padding-bottom":
    case "padding-left":
    case "margin":
    case "margin-x":
    case "margin-y":
    case "margin-top":
    case "margin-right":
    case "margin-bottom":
    case "margin-left":
    case "gap":
    case "gap-x":
    case "gap-y":
    case "space-x":
    case "space-y": {
      const value = raw.slice(raw.lastIndexOf("-") + 1);
      return SPACING.has(value) ? null : `${value} is not on the scale (§6.1)`;
    }

    case "radius": {
      const value = after(raw, "rounded-");
      return RADII.has(value) ? null : `not a role radius (§7.1)`;
    }
    case "radius-tl":
    case "radius-tr":
    case "radius-bl":
    case "radius-br":
    case "radius-t":
    case "radius-b":
    case "radius-l":
    case "radius-r":
      return raw.endsWith("-lg")
        ? null
        : "a side radius only follows a surface's lg curve (§7.1)";

    case "height":
    case "width":
    case "size":
    case "min-height":
    case "min-width":
    case "max-height":
    case "top":
    case "right":
    case "bottom":
    case "left":
    case "inset":
    case "inset-x":
    case "inset-y":
    case "translate-x":
    case "translate-y": {
      const value = raw.slice(raw.indexOf("-") + 1).replace(/^[xy]-/, "");
      const v = value.replace(/^(h|w|x|y)-/, "");
      return onGrid(v) ? null : `${v} is off the 4px grid (§6.4)`;
    }
    case "max-width": {
      const value = after(raw, "max-w-");
      return CONTAINERS.has(value) || onGrid(value)
        ? null
        : `not a named measure (§6.4)`;
    }

    case "opacity":
      return OPACITY.has(after(raw, "opacity-"))
        ? null
        : "not an opacity step (§7.4)";

    case "z-index": {
      const value = after(raw, "z-");
      if (LOCAL_Z.has(value)) return null;
      return /^\(--z-[a-z]+\)$/.test(value)
        ? null
        : "a layer takes a token from the ladder (§10)";
    }

    case "box-shadow":
    case "ring":
    case "drop-shadow":
      return "shadows are the named tokens (§7.3)";
    case "backdrop":
      return raw === "backdrop-blur"
        ? null
        : "the one backdrop effect is the sticky bars' blur (§7.3)";

    case "transition-duration":
    case "transition-timing":
    case "transition-delay":
      return "motion takes its tokens by default (§9)";

    default:
      return null;
  }
}

/* -------------------------------------------------------------------------
   The audit.
   ---------------------------------------------------------------------- */

const failures = [];
const stats = {};
let utilities = 0;

for (const { file, line, chunk, parsed } of classStrings({
  single: true,
  stats,
})) {
  for (const p of parsed) {
    utilities++;
    const why = verdict(p);
    if (why) failures.push({ file, line, token: p.token, why, chunk });
  }
}

if (!TEXT_STYLES.size) {
  console.error("Read no named text styles from index.css; refusing to pass.");
  process.exit(1);
}

console.log(
  `\nChecked ${utilities} utilities in ${stats.classStrings} class strings ` +
    `across ${stats.files} files.\n`,
);

const line = "─".repeat(37);
if (failures.length) {
  for (const f of failures) {
    console.log(`  ${f.file}:${f.line}  ${f.token}`);
    console.log(`    ${f.why}`);
  }
  console.log(`\n── ${failures.length} violation(s) ${line}`);
  console.log(
    "  Use a value 06_style_guide allows, or add it to the guide first.\n",
  );
  process.exit(1);
}
console.log(`── 0 violation(s) ${line}`);
console.log("  Every utility is one the style guide allows. ✓\n");
