#!/usr/bin/env node
/**
 * Statmon — conflicting-utility audit
 * ---------------------------------------------------------------------------
 * Finds class strings that set the same CSS property twice.
 *
 * Tailwind resolves `min-h-0 flex-1 min-h-[26rem]` by STYLESHEET order, not by
 * the order the utilities are written — so the one that wins is not the one you
 * meant, and nothing tells you. That is the D-042 trap, and it has now shipped
 * twice: once as a `TypeBadge` radius pair, and once as the game board's height
 * (D-110), where it was caught by a human reading the diff rather than by any
 * check. This is the part that does not depend on someone reading the diff.
 *
 * WHAT IT CHECKS. Each string literal in `src/` is split into utilities, each
 * utility is mapped to the property family it sets, and two utilities in the
 * same family under the same variant prefix are a conflict.
 *
 * The `text-*` split is the reason this needs real knowledge of the design
 * system rather than a regex: `text-h2 text-primary` is a NAMED TEXT STYLE plus
 * a COLOUR TOKEN and is correct on nearly every component on the site, while
 * `text-h2 text-h3` is a genuine conflict. Both sets are read from
 * `src/index.css` at run time — the 23 `@layer components` styles and the
 * `--color-*` tokens — so this cannot drift from the scale it audits
 * (06_style_guide §5).
 *
 * WHAT IT DOES NOT CHECK, stated rather than implied:
 *   - Conflicts ACROSS composition. `${BOARD} min-h-[26rem]` in a template
 *     literal is two strings to this script, and resolving it would mean
 *     evaluating the module. The D-110 defect was inside ONE string, which is
 *     the case this covers.
 *   - Utilities it cannot classify. It reports that count rather than hiding
 *     it, so the coverage is visible instead of assumed.
 *
 * Kept alongside `audit:contrast`, `check:docs` and `sweep:widths` (D-027,
 * D-031, D-059):
 *   npm run audit:classes
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");
const CSS = path.join(SRC, "index.css");

/* -------------------------------------------------------------------------
   The design system, read from the stylesheet rather than restated here.
   ---------------------------------------------------------------------- */

const css = fs.readFileSync(CSS, "utf8");

// Every class the stylesheet defines itself — §5's named text styles, the
// `.animate-*` keyframe hooks, and one-off component classes like
// `.type-grid`. Each is its own family: two DIFFERENT component classes are
// unrelated properties, while the same one twice is a genuine duplicate.
// The class is taken from the head of the selector rather than from a bare
// `.name {`, because several are only ever written compound — `.type-grid td`
// and `.type-grid-sticky::before` both define classes the markup uses.
const COMPONENT_CLASSES = new Set(
  [...css.matchAll(/^\s*\.([a-z][a-z0-9-]*)/gm)].map((m) => m[1]),
);

// The subset that is §5's text scale, which is what disambiguates `text-*`.
const TEXT_STYLES = new Set(
  [...COMPONENT_CLASSES].filter((c) => c.startsWith("text-")),
);

// Markers, not properties: `group` and `peer` set nothing and exist to be
// referenced by a descendant's variant.
const MARKERS = new Set(["group", "peer"]);

// `--color-primary` → `primary`, so `text-primary` and `border-border-subtle`
// can be recognised as colour utilities.
const COLORS = new Set(
  [...css.matchAll(/^\s*--color-([a-z0-9-]+)\s*:/gm)].map((m) => m[1]),
);

// `font-` carries two unrelated properties and the split has to come from the
// tokens, not from guessing: `--font-display` is a FAMILY and
// `--font-weight-semibold` is a WEIGHT, so `font-display font-semibold` is a
// correct pair rather than a conflict. Getting this wrong was this script's
// first finding, against `ComparisonCard`, and it was the script that was
// wrong.
const FONT_FAMILIES = new Set(
  [...css.matchAll(/^\s*--font-(?!weight-)([a-z0-9-]+)\s*:/gm)].map(
    (m) => m[1],
  ),
);
const FONT_WEIGHTS = new Set([
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
function familyOf(base) {
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
function splitVariant(token) {
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
const normalize = (base) => base.replace(/^!/, "").replace(/^-/, "");

/* -------------------------------------------------------------------------
   Finding the class strings.
   ---------------------------------------------------------------------- */

// Every token has to look like a utility for the string to be treated as one.
// Prose fails this on its capitals, commas and apostrophes, which is what keeps
// copy out of the audit without needing to know where copy lives.
const UTILITY_SHAPE = /^-?!?[a-z0-9][a-z0-9:[\]()/@._,%#&>~+*-]*$/;

const looksLikeClassString = (tokens) =>
  tokens.length >= 2 && tokens.every((t) => UTILITY_SHAPE.test(t));

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(jsx?|mjs)$/.test(entry.name)) yield full;
  }
}

/* -------------------------------------------------------------------------
   The audit.
   ---------------------------------------------------------------------- */

const conflicts = [];
const unclassified = new Map();
let stringsScanned = 0;
let stringsAnalyzed = 0;
let filesScanned = 0;

for (const file of walk(SRC)) {
  // Tests describe markup in prose and assert on class names; auditing them
  // reports the fixture rather than the site.
  if (/\.test\.jsx?$/.test(file)) continue;
  filesScanned++;

  const text = fs.readFileSync(file, "utf8");
  const rel = path.relative(ROOT, file);

  // Double-quoted, single-quoted, and each literal chunk of a template string.
  // Template chunks are taken between `${...}` holes, which is exactly the
  // limitation documented at the top: composition is not resolved.
  const literals = [
    ...text.matchAll(/"([^"\\\n]*)"/g),
    ...text.matchAll(/'([^'\\\n]*)'/g),
    ...text.matchAll(/`([^`\\]*)`/g),
  ];

  for (const m of literals) {
    for (const chunk of m[1].split(/\$\{[^}]*\}/)) {
      const tokens = chunk.trim().split(/\s+/).filter(Boolean);
      if (!tokens.length) continue;
      stringsScanned++;
      if (!looksLikeClassString(tokens)) continue;

      // Classify first, decide second. `npm run audit:contrast` is three
      // lowercase tokens and passes any shape test — what tells it apart from a
      // class string is that it classifies as nothing. Requiring most of a
      // string to be recognisable utilities keeps prose, shell commands and
      // `color-mix(...)` values out of the report without needing to know where
      // any of them live.
      const parsed = tokens.map((token) => {
        const { variant, base } = splitVariant(token);
        return { token, variant, base, family: familyOf(normalize(base)) };
      });
      const known = parsed.filter((p) => p.family);
      if (known.length < 2 || known.length * 2 < tokens.length) continue;
      stringsAnalyzed++;

      const seen = new Map();
      for (const p of parsed) {
        if (!p.family) {
          unclassified.set(p.base, (unclassified.get(p.base) ?? 0) + 1);
          continue;
        }
        const key = `${p.variant}|${p.family}`;
        if (seen.has(key)) {
          conflicts.push({
            file: rel,
            line: text.slice(0, m.index).split("\n").length,
            family: p.family,
            variant: p.variant,
            first: seen.get(key),
            second: p.token,
            chunk: chunk.trim(),
          });
        } else {
          seen.set(key, p.token);
        }
      }
    }
  }
}

/* -------------------------------------------------------------------------
   Report.
   ---------------------------------------------------------------------- */

const pad = (s, n) => String(s).padEnd(n);

console.log(
  `\nScanned ${filesScanned} file(s): ${stringsScanned} string literal(s), ` +
    `${stringsAnalyzed} of them class strings.\n`,
);

if (conflicts.length) {
  console.log("Conflicting utilities — same property, same variant:\n");
  for (const c of conflicts) {
    const where = c.variant ? `${c.variant}: ${c.family}` : c.family;
    console.log(`  ${c.file}:${c.line}`);
    console.log(`    ${pad(where, 24)} ${c.first}  vs  ${c.second}`);
    console.log(
      `    in: ${c.chunk.length > 96 ? `${c.chunk.slice(0, 96)}…` : c.chunk}\n`,
    );
  }
}

// Coverage, reported rather than assumed: a check that silently understands
// nothing passes just as loudly as one that understands everything.
const unknownTotal = [...unclassified.values()].reduce((a, b) => a + b, 0);
if (unknownTotal) {
  const top = [...unclassified.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);
  console.log(
    `Unclassified utilities: ${unclassified.size} distinct, ${unknownTotal} occurrence(s).`,
  );
  console.log(
    `  Most common: ${top.map(([t, n]) => `${t} (${n})`).join(", ")}\n`,
  );
}

const line = "─".repeat(37);
if (conflicts.length) {
  console.log(`── ${conflicts.length} conflict(s) ${line}`);
  console.log("  Tailwind resolves these by stylesheet order, not by yours.\n");
  process.exit(1);
}
console.log(`── 0 conflict(s) ${line}`);
console.log("  No class string sets the same property twice. ✓\n");
