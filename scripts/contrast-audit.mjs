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
 *
 * Thresholds: AA normal text 4.5, AA large text 3.0, non-text (1.4.11) 3.0.
 * (Statmon's diff/badge/label text is small, so 4.5 applies.)
 *
 *   npm run audit:contrast
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

const TYPES = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
];
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

console.log(`\n── ${fails.length} failure(s) ─────────────────────────────`);
for (const f of fails) console.log(`  ✗ ${f}`);
if (!fails.length) console.log("  All pairings pass. ✓");
