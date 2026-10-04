/**
 * Statmon — the class-string reader both style audits share
 * ---------------------------------------------------------------------------
 * `audit:classes` asks whether two utilities in one class string set the same
 * property. `audit:styles` asks whether each utility is one the style guide
 * allows at all. Both have to find the same class strings and understand each
 * utility the same way, so the finding and the understanding live here once —
 * the reason `chrome.mjs` is shared by the two scripts that drive a browser
 * (06_style_guide §12 rule 8: two copies of a lookup are two chances to fix
 * only one of them). Extracted from class-audit.mjs by D-134; the one addition is that
 * `decoration-` and `underline-offset-` now classify, where they used to be
 * the two utilities on the site this reader could not name.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
export const SRC = path.join(ROOT, "src");
export const CSS = path.join(SRC, "index.css");

/* -------------------------------------------------------------------------
   The design system, read from the stylesheet rather than restated here.
   ---------------------------------------------------------------------- */

export const css = fs.readFileSync(CSS, "utf8");

// Every class the stylesheet defines itself — §5's named text styles, the
// `.animate-*` keyframe hooks, and one-off component classes like
// `.type-grid`. Each is its own family: two DIFFERENT component classes are
// unrelated properties, while the same one twice is a genuine duplicate.
// The class is taken from the head of the selector rather than from a bare
// `.name {`, because several are only ever written compound — `.type-grid td`
// and `.type-grid-sticky::before` both define classes the markup uses.
export const COMPONENT_CLASSES = new Set(
  [...css.matchAll(/^\s*\.([a-z][a-z0-9-]*)/gm)].map((m) => m[1]),
);

// The subset that is §5's text scale, which is what disambiguates `text-*`.
export const TEXT_STYLES = new Set(
  [...COMPONENT_CLASSES].filter((c) => c.startsWith("text-")),
);

// Markers, not properties: `group` and `peer` set nothing and exist to be
// referenced by a descendant's variant.
export const MARKERS = new Set(["group", "peer"]);

// `--color-primary` → `primary`, so `text-primary` and `border-border-subtle`
// can be recognised as colour utilities.
export const COLORS = new Set(
  [...css.matchAll(/^\s*--color-([a-z0-9-]+)\s*:/gm)].map((m) => m[1]),
);

// `font-` carries two unrelated properties and the split has to come from the
// tokens, not from guessing: `--font-display` is a FAMILY and
// `--font-weight-semibold` is a WEIGHT, so `font-display font-semibold` is a
// correct pair rather than a conflict. Getting this wrong was this script's
// first finding, against `ComparisonCard`, and it was the script that was
// wrong.
export const FONT_FAMILIES = new Set(
  [...css.matchAll(/^\s*--font-(?!weight-)([a-z0-9-]+)\s*:/gm)].map(
    (m) => m[1],
  ),
);
export const FONT_WEIGHTS = new Set([
  ...[...css.matchAll(/^\s*--font-weight-([a-z0-9-]+)\s*:/gm)].map((m) => m[1]),
  // Tailwind's stock weight names generate utilities whether or not the theme
  // restates them.
  "thin",
  "extralight",
  "light",
  "normal",
  "medium",
  "semibold",
  "bold",
  "extrabold",
  "black",
]);

if (!TEXT_STYLES.size || !COLORS.size) {
  console.error(
    `Could not read the design system out of ${path.relative(ROOT, CSS)} ` +
      `(${TEXT_STYLES.size} text styles, ${COLORS.size} colours). ` +
      `Refusing to audit against an empty scale.`,
  );
  process.exit(1);
}

/* -------------------------------------------------------------------------
   Utility -> the CSS property family it sets.
   ---------------------------------------------------------------------- */

// Standalone utilities whose name carries no value.
const EXACT = new Map(
  Object.entries({
    block: "display",
    inline: "display",
    "inline-block": "display",
    flex: "display",
    "inline-flex": "display",
    grid: "display",
    "inline-grid": "display",
    hidden: "display",
    contents: "display",
    "flow-root": "display",
    table: "display",
    "table-cell": "display",
    "table-row": "display",
    "list-item": "display",

    static: "position",
    fixed: "position",
    absolute: "position",
    relative: "position",
    sticky: "position",

    "flex-row": "flex-direction",
    "flex-row-reverse": "flex-direction",
    "flex-col": "flex-direction",
    "flex-col-reverse": "flex-direction",
    "flex-wrap": "flex-wrap",
    "flex-nowrap": "flex-wrap",
    "flex-wrap-reverse": "flex-wrap",

    "table-auto": "table-layout",
    "table-fixed": "table-layout",
    "border-collapse": "border-collapse",
    "border-separate": "border-collapse",

    truncate: "text-overflow",
    "text-ellipsis": "text-overflow",
    "text-clip": "text-overflow",

    "sr-only": "sr-only",
    "not-sr-only": "sr-only",

    italic: "font-style",
    "not-italic": "font-style",
    uppercase: "text-transform",
    lowercase: "text-transform",
    capitalize: "text-transform",
    "normal-case": "text-transform",

    "border-solid": "border-style",
    "border-dashed": "border-style",
    "border-dotted": "border-style",
    "border-double": "border-style",
    "border-none": "border-style",
    underline: "text-decoration",
    "line-through": "text-decoration",
    "no-underline": "text-decoration",

    "text-left": "text-align",
    "text-center": "text-align",
    "text-right": "text-align",
    "text-justify": "text-align",

    // Bare side utilities set a 1px width on that side.
    border: "border-width",
    "border-t": "border-top",
    "border-r": "border-right",
    "border-b": "border-bottom",
    "border-l": "border-left",
    "border-x": "border-width-x",
    "border-y": "border-width-y",
  }),
);

// Prefix -> family, LONGEST FIRST. `min-h-` has to beat `h-`, and
// `rounded-tl-` has to beat `rounded-`.
const PREFIXES = [
  ["min-h-", "min-height"],
  ["max-h-", "max-height"],
  ["min-w-", "min-width"],
  ["max-w-", "max-width"],
  ["h-", "height"],
  ["w-", "width"],
  ["size-", "size"],

  ["px-", "padding-x"],
  ["py-", "padding-y"],
  ["pt-", "padding-top"],
  ["pr-", "padding-right"],
  ["pb-", "padding-bottom"],
  ["pl-", "padding-left"],
  ["ps-", "padding-inline-start"],
  ["pe-", "padding-inline-end"],
  ["p-", "padding"],

  ["mx-", "margin-x"],
  ["my-", "margin-y"],
  ["mt-", "margin-top"],
  ["mr-", "margin-right"],
  ["mb-", "margin-bottom"],
  ["ml-", "margin-left"],
  ["ms-", "margin-inline-start"],
  ["me-", "margin-inline-end"],
  ["m-", "margin"],

  ["gap-x-", "gap-x"],
  ["gap-y-", "gap-y"],
  ["gap-", "gap"],

  ["space-x-", "space-x"],
  ["space-y-", "space-y"],

  ["rounded-tl-", "radius-tl"],
  ["rounded-tr-", "radius-tr"],
  ["rounded-bl-", "radius-bl"],
  ["rounded-br-", "radius-br"],
  ["rounded-t-", "radius-t"],
  ["rounded-b-", "radius-b"],
  ["rounded-l-", "radius-l"],
  ["rounded-r-", "radius-r"],
  ["rounded-", "radius"],

  ["inset-x-", "inset-x"],
  ["inset-y-", "inset-y"],
  ["inset-", "inset"],
  ["top-", "top"],
  ["right-", "right"],
  ["bottom-", "bottom"],
  ["left-", "left"],

  ["overflow-x-", "overflow-x"],
  ["overflow-y-", "overflow-y"],
  ["overflow-", "overflow"],

  ["grid-cols-", "grid-cols"],
  ["grid-rows-", "grid-rows"],
  ["col-span-", "col-span"],
  ["row-span-", "row-span"],
  ["col-start-", "col-start"],
  ["row-start-", "row-start"],
  ["col-end-", "col-end"],
  ["row-end-", "row-end"],
  ["order-", "order"],

  ["items-", "align-items"],
  ["justify-items-", "justify-items"],
  ["justify-self-", "justify-self"],
  ["justify-", "justify-content"],
  ["self-", "align-self"],
  ["content-", "align-content"],
  ["place-", "place"],

  ["shrink-", "flex-shrink"],
  ["grow-", "flex-grow"],
  ["basis-", "flex-basis"],
  ["flex-", "flex"],

  ["translate-x-", "translate-x"],
  ["translate-y-", "translate-y"],
  ["scale-x-", "scale-x"],
  ["scale-y-", "scale-y"],
  ["scale-", "scale"],
  ["rotate-", "rotate"],
  ["origin-", "transform-origin"],

  ["object-", "object-fit"],
  ["aspect-", "aspect-ratio"],
  ["outline-", "outline"],
  ["opacity-", "opacity"],
  ["z-", "z-index"],
  ["leading-", "line-height"],
  ["tracking-", "letter-spacing"],
  ["font-", "font"],
  ["whitespace-", "white-space"],
  ["break-", "word-break"],
  ["cursor-", "cursor"],
  ["pointer-events-", "pointer-events"],
  ["select-", "user-select"],
  ["align-", "vertical-align"],
  ["list-", "list-style"],

  ["transition-", "transition-property"],
  ["duration-", "transition-duration"],
  ["delay-", "transition-delay"],
  ["ease-", "transition-timing"],
  ["animate-", "animation"],

  ["bg-clip-", "background-clip"],
  ["bg-opacity-", "background-opacity"],
  ["bg-", "background"],

  ["border-x-", "border-width-x"],
  ["border-y-", "border-width-y"],
  ["border-t-", "border-top"],
  ["border-r-", "border-right"],
  ["border-b-", "border-bottom"],
  ["border-l-", "border-left"],
  ["border-", "border"], // refined below into width vs colour
  ["shadow-", "box-shadow"],
  ["ring-", "ring"],
  ["fill-", "fill"],
  ["decoration-", "text-decoration-color"],
  ["underline-offset-", "text-underline-offset"],
  ["stroke-", "stroke"],
  ["backdrop-", "backdrop"],
  ["drop-shadow-", "drop-shadow"],
  ["text-", "text"], // refined below into style vs colour
];

// A bare number, a fraction, a `[...]` arbitrary value, or `px`/`full`/`auto`
// — the shapes a WIDTH takes, as opposed to a colour token's name.
const isSizeish = (v) =>
  /^\[.*\]$/.test(v) ||
  /^\d+(\.\d+)?(\/\d+)?$/.test(v) ||
  /^(px|auto|full)$/.test(v);

/**
 * The CSS property family a single utility sets, or `null` if unrecognised.
 *
 * `text-` and `border-` are split by looking at the VALUE, because in this
 * codebase both prefixes carry two unrelated properties:
 *   text-h2        -> a named text style (§5)      text-primary  -> a colour
 *   border-2       -> a width                       border-border-subtle -> a colour
 * Treating either as one family would flag `text-h2 text-primary`, which is the
 * single most common correct pair on the site.
 */
export function familyOf(base) {
  if (MARKERS.has(base)) return `marker:${base}`;
  if (EXACT.has(base)) return EXACT.get(base);
  // Before the prefix table, so `.text-h1` is a text style rather than a
  // `text-` colour lookup — and so `.type-grid` is recognised at all.
  if (COMPONENT_CLASSES.has(base)) {
    return TEXT_STYLES.has(base) ? "text-style" : `component:${base}`;
  }

  for (const [prefix, family] of PREFIXES) {
    if (!base.startsWith(prefix)) continue;
    const value = base.slice(prefix.length);

    if (family === "text") {
      if (COLORS.has(value)) return "text-color";
      // A `text-*` that is neither a named style nor a colour token — a stock
      // Tailwind size, say. Not this script's business to judge; it just must
      // not pretend to know which property it set.
      return null;
    }
    if (family === "border") {
      if (COLORS.has(value)) return "border-color";
      if (isSizeish(value)) return "border-width";
      return null;
    }
    if (family === "font") {
      if (FONT_WEIGHTS.has(value)) return "font-weight";
      if (FONT_FAMILIES.has(value)) return "font-family";
      return "font-size";
    }
    return family;
  }
  return null;
}

/* -------------------------------------------------------------------------
   Splitting a class string.
   ---------------------------------------------------------------------- */

/**
 * Split a utility into its variant prefix and its base.
 *
 * `sm:hover:text-primary` -> { variant: "sm:hover", base: "text-primary" }
 *
 * Colons inside an arbitrary value are not variant separators, so `[&:hover]:`
 * and `w-[calc(1px_+_2px)]` have to survive: the scan tracks bracket depth and
 * only splits on a colon at depth zero.
 */
export function splitVariant(token) {
  let depth = 0;
  let lastColon = -1;
  for (let i = 0; i < token.length; i++) {
    const c = token[i];
    if (c === "[" || c === "(") depth++;
    else if (c === "]" || c === ")") depth--;
    else if (c === ":" && depth === 0) lastColon = i;
  }
  return lastColon === -1
    ? { variant: "", base: token }
    : { variant: token.slice(0, lastColon), base: token.slice(lastColon + 1) };
}

// `!` forces importance and `-` negates; neither changes which property is set.
export const normalize = (base) => base.replace(/^!/, "").replace(/^-/, "");

/* -------------------------------------------------------------------------
   Finding the class strings.
   ---------------------------------------------------------------------- */

// Every token has to look like a utility for the string to be treated as one.
// Prose fails this on its capitals, commas and apostrophes, which is what keeps
// copy out of the audit without needing to know where copy lives.
export const UTILITY_SHAPE = /^-?!?[a-z0-9][a-z0-9:[\]()/@._,%#&>~+*-]*$/;

export const looksLikeClassString = (tokens) =>
  tokens.length >= 2 && tokens.every((t) => UTILITY_SHAPE.test(t));

export function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(jsx?|mjs)$/.test(entry.name)) yield full;
  }
}

/* -------------------------------------------------------------------------
   Every class string in src/, parsed.
   ---------------------------------------------------------------------- */

/**
 * Walk every component and page and yield each class string in it, with every
 * utility split and classified. Tests are skipped: they describe markup in
 * prose and assert on class names, so auditing them reports the fixture.
 *
 * Double-quoted, single-quoted, and each literal chunk of a template string.
 * Template chunks are taken between `${...}` holes, so composition is not
 * resolved: `${BOARD} min-h-[26rem]` is two strings here.
 *
 * A string counts as a class string when every token is shaped like a utility
 * AND most of them classify. Classify first, decide second:
 * `npm run audit:contrast` is three lowercase tokens and passes any shape test
 * — what tells it apart from a class string is that it classifies as nothing.
 * That keeps prose, shell commands and `color-mix(...)` values out without
 * knowing where any of them live.
 *
 * With `single: true` a lone token counts too, provided it classifies:
 * `"h-full"` in a size map is a class, `"speed"` in a URL is not and does not
 * classify. `audit:classes` leaves it off, since one utility cannot conflict
 * with itself; `audit:styles` turns it on, since one utility can still be one
 * the guide does not allow.
 *
 * `stats` is filled in as it goes, so a caller can report its coverage.
 */
export function* classStrings({ single = false, stats = {} } = {}) {
  stats.files = 0;
  stats.literals = 0;
  stats.classStrings = 0;
  for (const file of walk(SRC)) {
    if (/\.test\.jsx?$/.test(file)) continue;
    stats.files++;
    // Comments are blanked before anything is read, character for character
    // so line numbers survive. They quote utilities in backticks constantly —
    // "a bare `z-1300`", "`min-h-0` is the half that does the work" — and a
    // backtick is also how a template literal opens, so prose about classes
    // read as classes. Harmless to the conflict check, which needs two
    // utilities in one string; fatal to an allowlist, which would fail the
    // site on its own comments. Full-line `//` comments only: a `//` after code
    // can be the inside of a URL.
    const blank = (m) => m.replace(/[^\n]/g, " ");
    const text = fs
      .readFileSync(file, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, blank)
      .replace(/^\s*\/\/.*$/gm, blank);
    const rel = path.relative(ROOT, file);
    const literals = [
      ...text.matchAll(/"([^"\\\n]*)"/g),
      ...text.matchAll(/'([^'\\\n]*)'/g),
      ...text.matchAll(/`([^`\\]*)`/g),
    ];
    for (const m of literals) {
      for (const chunk of m[1].split(/\$\{[^}]*\}/)) {
        const tokens = chunk.trim().split(/\s+/).filter(Boolean);
        if (!tokens.length) continue;
        stats.literals++;
        const parsed = tokens.map((token) => {
          const { variant, base } = splitVariant(token);
          return { token, variant, base, family: familyOf(normalize(base)) };
        });
        const known = parsed.filter((p) => p.family);
        const isSingle =
          single &&
          tokens.length === 1 &&
          UTILITY_SHAPE.test(tokens[0]) &&
          known.length === 1;
        const isMulti =
          looksLikeClassString(tokens) &&
          known.length >= 2 &&
          known.length * 2 >= tokens.length;
        // A literal written straight into `className` IS a class string,
        // whatever it classifies as — which is the case the heuristic above
        // cannot see: `"flex itmes-center"` is one known utility and one typo,
        // fails the majority test, and would pass every audit by not being
        // read. Only the opening chunk of a template can follow the attribute.
        const before = text.slice(Math.max(0, m.index - 11), m.index);
        const forced =
          single &&
          tokens.every((t) => UTILITY_SHAPE.test(t)) &&
          /className=\{?$/.test(before);
        if (!isSingle && !isMulti && !forced) continue;
        stats.classStrings++;
        yield {
          file: rel,
          line: text.slice(0, m.index).split("\n").length,
          chunk: chunk.trim(),
          parsed,
        };
      }
    }
  }
}
