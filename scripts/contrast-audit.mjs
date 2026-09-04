#!/usr/bin/env node
/**
 * Statmon — WCAG contrast audit (docs/04_design §3)
 * ---------------------------------------------------------------------------
 * Reads the real `--color-*` tokens from src/index.css (resolving var() chains)
 * and computes WCAG 2.1 contrast ratios for every meaningful pairing:
 *   1. semantic text (primary/secondary/tertiary/accent) on each surface
 *   2. type color AS TEXT on `surface` — the type-colored diff numbers (D-023)
 *   3. type badge labels — the badge's text color on the filled type color
 *   4. stat-bar fill vs the `elevated` track — non-text (graphical) contrast
 *   5. dex stat-cell text over its proportional type fill
 *   6. type-chart grid cells — the multiplier text on each cell fill
 *
 * Thresholds: AA normal text 4.5, AA large text 3.0, non-text (1.4.11) 3.0.
 * (Statmon's diff/badge/label text is small, so 4.5 applies.)
 *
 *   npm run audit:contrast
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TYPES } from "../src/lib/types.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CSS = path.join(ROOT, "src", "index.css");

/* ---- parse --color-* tokens and resolve var() chains to hex ---- */
const raw = await readFile(CSS, "utf8");
const decls = {};
for (const m of raw.matchAll(/--color-([\w-]+):\s*([^;]+);/g)) {
  decls[m[1]] = m[2].trim();
}
function resolve(name, seen = new Set()) {
  let v = decls[name];
  if (v == null || seen.has(name)) return null;
  seen.add(name);
  const varMatch = v.match(/^var\(\s*--color-([\w-]+)\s*\)$/);
  if (varMatch) return resolve(varMatch[1], seen);
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v : null; // skip color-mix() etc.
}
const hex = (name) => resolve(name);

/* ---- WCAG luminance + ratio ---- */
const chan = (c) => {
  const x = c / 255;
  return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
};
const lum = (h) => {
  const n = parseInt(h.slice(1), 16);
  const r = (n >> 16) & 255,
    g = (n >> 8) & 255,
    b = n & 255;
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// All badges use near-black (base) text — see lib/types.js typeTextVar (D-027).
const base = hex("base"),
  surface = hex("surface"),
  elevated = hex("elevated");

const fails = [];
const row = (label, r, th) => {
  const ok = r >= th;
  if (!ok) fails.push(`${label} — ${r.toFixed(2)} (needs ${th})`);
  return `  ${label.padEnd(34)} ${r.toFixed(2).padStart(5)}  ${ok ? "PASS" : "FAIL"}`;
};

console.log("\n=== 1. Semantic text on backgrounds (AA 4.5) ===");
for (const t of ["primary", "secondary", "tertiary", "accent"]) {
  for (const [bn, bg] of [
    ["base", base],
    ["surface", surface],
    ["elevated", elevated],
  ]) {
    console.log(row(`${t} on ${bn}`, ratio(hex(t), bg), 4.5));
  }
}

console.log(
  "\n=== 2. Type color AS TEXT on surface — diff numbers (AA 4.5) ===",
);
for (const t of TYPES)
  console.log(row(t, ratio(hex(`type-${t}`), surface), 4.5));

console.log(
  "\n=== 3. Type badge label — dark text on filled type color (AA 4.5) ===",
);
for (const t of TYPES) {
  console.log(row(t, ratio(base, hex(`type-${t}`)), 4.5));
}

console.log("\n=== 4. Bar fill vs elevated track — non-text (1.4.11, 3.0) ===");
for (const t of TYPES)
  console.log(row(t, ratio(hex(`type-${t}`), elevated), 3.0));

// The dex table's stat cell puts text-primary over a proportional fill of the
// type colour at 28%, composited on the row background (D-039). The hover
// background (surface) is the lighter of the two and therefore the worse case
// for light text, so that is what is audited.
console.log(
  "\n=== 5. Dex stat cell — primary text on a 28% type fill over the row (AA 4.5) ===",
);
const primary = hex("primary");
// Alpha compositing: the fill is `color-mix(type 28%, transparent)` painted on
// the row background, so the effective colour is a 28/72 blend of the two.
const blend = (fg, bg, alpha) => {
  const mix = (i) =>
    Math.round(
      alpha * parseInt(fg.slice(1 + i * 2, 3 + i * 2), 16) +
        (1 - alpha) * parseInt(bg.slice(1 + i * 2, 3 + i * 2), 16),
    );
  return `#${[0, 1, 2].map((i) => mix(i).toString(16).padStart(2, "0")).join("")}`;
};
for (const t of TYPES)
  console.log(
    row(t, ratio(primary, blend(hex(`type-${t}`), surface, 0.28)), 4.5),
  );

// The type chart's grid (D-051) tints a cell by what it does — accent-muted for
// super effective, elevated for resisted and immune — and prints the multiplier
// on top. The fills themselves are deliberately NOT audited against the panel:
// they are redundant with the text, so 1.4.11 does not bite, the same reading
// 04_design §3 already applies to stat-bar fills. The text is what has to pass.
console.log(
  "\n=== 6. Type chart grid cell — multiplier text on its fill (AA 4.5) ===",
);
// 2× is a 55% blend of accent into elevated, so it is composited the same way
// the dex stat cell is above rather than read straight from a token.
const strongFill = blend(hex("accent"), hex("elevated"), 0.55);
console.log(
  row("2× — primary on the accent blend", ratio(primary, strongFill), 4.5),
);
for (const [label, fg, bg] of [
  ["0× — primary on base", "primary", "base"],
  ["½× — tertiary on base", "tertiary", "base"],
  ["1× — baseline, no text", "tertiary", "elevated"],
]) {
  console.log(row(label, ratio(hex(fg), hex(bg)), 4.5));
}
// A selected column lays a 12% accent wash over whatever fill is beneath it
// (D-053). 12% is not an aesthetic choice: it is the most that keeps the text on
// top of it above AA, which is why the column's edges carry the highlight and
// the wash only assists.
const washed = (fill) => blend(hex("accent"), fill, 0.12);
console.log("\n  -- selected column, text over the wash --");
console.log(
  row(
    "2× — primary over washed accent blend",
    ratio(primary, washed(strongFill)),
    4.5,
  ),
);
console.log(
  row(
    "½× — tertiary over washed base",
    ratio(hex("tertiary"), washed(hex("base"))),
    4.5,
  ),
);
console.log(
  row(
    "0× — primary over washed base",
    ratio(primary, washed(hex("base"))),
    4.5,
  ),
);

// The fills also have to be tellable apart, which is the whole point of the
// scale — this is the number the first version got wrong (1.42 / 1.10 / 1.00).
console.log("\n  -- fill separation (not a WCAG rule; the scan test) --");
console.log(
  row("2× fill vs the 1× baseline", ratio(strongFill, hex("elevated")), 2.0),
);
console.log(
  row(
    "½×/0× fill vs the 1× baseline",
    ratio(hex("base"), hex("elevated")),
    1.15,
  ),
);

console.log(`\n── ${fails.length} failure(s) ─────────────────────────────`);
for (const f of fails) console.log(`  ✗ ${f}`);
if (!fails.length) console.log("  All pairings pass. ✓");
