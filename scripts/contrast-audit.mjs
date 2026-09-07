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
 *   7. STAB chip — the type name and multiplier on the chip's own type fill
 *   8. Home hero — text on the scrim over a worst-case sprite pixel
 *   9. Game contender — the winning card's accent-muted fill
 *  10. Game arena — panel text over the primary-type tint
 *
 * Thresholds: AA normal text 4.5, AA large text 3.0, non-text (1.4.11) 3.0.
 * (Statmon's diff/badge/label text is small, so 4.5 applies.)
 *
 *   npm run audit:contrast
 */

import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TYPES } from "../src/lib/types.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CSS = path.join(ROOT, "src", "index.css");

/* ---- parse --color-* tokens and resolve var() chains to hex ---- */
const raw = await readFile(CSS, "utf8");

// Two fills this file audits are owned by components, not by tokens, and were
// restated here as `0.28` and `PANEL_TINT = 10`. A restated constant is one
// that can silently desync: change the app's value and this keeps validating a
// colour the site no longer paints, and passes. So they are READ, the way
// `--hero-scrim` below already is, and a missing one is a hard failure rather
// than a default.
const readConst = (file, re, what) => {
  const m = readFileSync(path.join(ROOT, file), "utf8").match(re);
  if (!m) {
    console.error(`Could not read ${what} from ${file}. It is audited here and
owned there; this file must not guess it.`);
    process.exit(1);
  }
  return Number(m[1]);
};

// The dex stat cell's proportional fill (DexRow), as a fraction.
const DEX_FILL =
  readConst(
    "src/components/DexRow.jsx",
    /FILL_ALPHA\s*=\s*"(\d+(?:\.\d+)?)%"/,
    "FILL_ALPHA",
  ) / 100;

// How much of a type sits over the page background on a game panel (gameChrome).
const PANEL_TINT = readConst(
  "src/components/gameChrome.jsx",
  /\bTINT\s*=\s*(\d+(?:\.\d+)?)\b/,
  "TINT",
);
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
    row(t, ratio(primary, blend(hex(`type-${t}`), surface, DEX_FILL)), 4.5),
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

// The STAB chip (components/StabChip.jsx) tints itself with the attacking type
// at 14% over `elevated` and prints the type name plus its multiplier on that.
// This pairing shipped on two surfaces for months and was audited by neither —
// it was missed because the two copies each looked like a one-off decoration
// rather than a text-on-fill pairing. Consolidating them is what surfaced it.
//
// Two rows per type: the name always takes `primary`, while the multiplier takes
// the tier colour, of which `secondary` (everything below 2×) is the faintest
// and therefore the only one worth testing. This group is why that tier is
// `secondary` and not `tertiary` — tertiary failed on 17 of the 18.
console.log(
  "\n=== 7. STAB chip — text on a 14% type fill over elevated (AA 4.5) ===",
);
const secondary = hex("secondary");
for (const t of TYPES) {
  const fill = blend(hex(`type-${t}`), elevated, 0.14);
  console.log(row(`${t} — name (primary)`, ratio(primary, fill), 4.5));
  console.log(row(`${t} — resisted (secondary)`, ratio(secondary, fill), 4.5));
}

// Home's hero (D-070) puts the wordmark and tagline on a scrim over a wall of
// sprites. Unlike every group above, the backdrop is not a token — it is
// whatever pixel happens to be behind the text, which changes with the dataset.
// So this audits the WORST backdrop a sprite can produce: a pure-white pixel
// under `--hero-scrim` of base. Anything that passes here passes everywhere on
// that wall, for any sample, forever.
//
// The scrim percentage is read from the stylesheet rather than restated, so the
// number this proves and the number the browser paints cannot drift. This group
// is why the tagline is `primary` on the hero and `secondary` everywhere else:
// at 65% the secondary token lands around 2.8:1 and fails.
console.log(
  "\n=== 8. Home hero — text on the scrim over a worst-case white sprite pixel (AA 4.5) ===",
);
const scrimPct = raw.match(/--hero-scrim:\s*([\d.]+)%/);
if (!scrimPct) {
  fails.push("hero: --hero-scrim not found in index.css");
} else {
  const alpha = Number(scrimPct[1]) / 100;
  const worst = blend(base, "#ffffff", alpha);
  console.log(`  scrim ${scrimPct[1]}% of base over white → ${worst}`);
  console.log(row("wordmark + tagline (primary)", ratio(primary, worst), 4.5));
  // Recorded as the reason the tagline was promoted, not as a requirement.
  const secondaryRatio = ratio(secondary, worst);
  console.log(
    `  (secondary on the same backdrop: ${secondaryRatio.toFixed(2)} — why hero text is primary)`,
  );
}

// The stat game marks its winning card with `--color-accent-muted` (D-093) —
// the "subtle accent fills" token 04_design §2 has always listed and nothing
// had ever consumed. Being the first consumer is exactly when a fill needs
// auditing: an unused token's pairings have never been anyone's problem.
//
// Three things sit on it. The Pokémon's name and the revealed stat value are
// `primary`; the check mark is `accent`, and it is an ICON rather than text, so
// it is held to 1.4.11's 3.0 for non-text contrast rather than to 4.5 — the
// same threshold the stat-bar fills are measured against in group 4.
console.log(
  "\n=== 9. Game contender — the winning card's accent fill (D-093) ===",
);
const accentMuted = hex("accent-muted");
console.log(row("name + value (primary)", ratio(primary, accentMuted), 4.5));
console.log(
  row("check icon (accent, non-text)", ratio(hex("accent"), accentMuted), 3),
);
// The card's border is the other half of the marking, and it has to be visible
// against the page it sits on or the fill is doing the work alone.
console.log(row("border (accent) vs base", ratio(hex("accent"), base), 3));

// The arena tints each panel with its Pokémon's primary type (D-096) — the
// site's oldest visual idea, applied to a whole surface rather than a chip. So
// the eighteen tints are eighteen new backgrounds for the name and the value,
// and they are audited the way the STAB chip's fills are (group 7), which is
// the audit that caught a real AA failure shipping on two surfaces (D-058).
//
// The tint is deliberately much lighter than the chip's 14%: it sits over
// `base` rather than `elevated`, covers a whole panel, and has artwork on top
// of it. That makes these the easiest pairings in this file — which is the
// point of measuring rather than assuming, since "obviously fine" is exactly
// what group 7 was before anyone checked it.
console.log(
  "\n=== 10. Game arena — panel text over the primary-type tint (AA 4.5) ===",
);
for (const t of TYPES) {
  const panel = blend(hex(`type-${t}`), base, PANEL_TINT / 100);
  console.log(row(`${t} — name (primary)`, ratio(primary, panel), 4.5));
  console.log(
    row(`${t} — losing value (secondary)`, ratio(secondary, panel), 4.5),
  );
}

// A dual type's panel is a gradient between two of those tints (D-107), so the
// colours actually behind the text include every point on that line — not just
// the two endpoints group 10 just checked. Intermediate colours OUGHT to sit
// between their endpoints, but "ought to" is not the standard this file exists
// to hold things to, so all 153 pairs are computed at their midpoint, which is
// where a blend is furthest from both ends.
console.log(
  "\n=== 11. Game arena — panel text over a DUAL type's gradient (AA 4.5) ===",
);
let worstPair = null;
for (let i = 0; i < TYPES.length; i++) {
  for (let j = i + 1; j < TYPES.length; j++) {
    const a = blend(hex(`type-${TYPES[i]}`), base, PANEL_TINT / 100);
    const b = blend(hex(`type-${TYPES[j]}`), base, PANEL_TINT / 100);
    const mid = blend(a, b, 0.5);
    for (const [label, colour] of [
      ["primary", primary],
      ["secondary", secondary],
    ]) {
      const r = ratio(colour, mid);
      if (!worstPair || r < worstPair.r)
        worstPair = { r, pair: `${TYPES[i]}/${TYPES[j]}`, label };
      if (r < 4.5)
        fails.push(
          `gradient ${TYPES[i]}/${TYPES[j]} midpoint — ${label} ${r.toFixed(2)}`,
        );
    }
  }
}
console.log(
  `  153 pairs × 2 text colours at their midpoint — worst is ${worstPair.pair} (${worstPair.label})`,
);
console.log(row("worst dual-type midpoint", worstPair.r, 4.5));

// The dex's stat fill is now a whole TYPING rather than a primary type, so a
// dual type paints a gradient between two 28% fills and the number sits on top
// of every colour along it — not just the two endpoints group 5 checks. Same
// argument as group 11, at bar scale: intermediate colours ought to sit between
// their endpoints, but "ought to" is not the standard this file holds things to.
//
// Audited over `surface` rather than `base` for the reason group 5 is: the row
// background is `base` on /dex and `surface` on hover and in Home's preview,
// and the lighter of the two is the harder case for near-white text.
console.log(
  "\n=== 12. Dex stat cell — primary text over a DUAL type's 28% gradient (AA 4.5) ===",
);
let worstBar = null;
for (let i = 0; i < TYPES.length; i++) {
  for (let j = i + 1; j < TYPES.length; j++) {
    const a = blend(hex(`type-${TYPES[i]}`), surface, DEX_FILL);
    const b = blend(hex(`type-${TYPES[j]}`), surface, DEX_FILL);
    const mid = blend(a, b, 0.5);
    const r = ratio(primary, mid);
    if (!worstBar || r < worstBar.r)
      worstBar = { r, pair: `${TYPES[i]}/${TYPES[j]}` };
    if (r < 4.5)
      fails.push(
        `dex bar ${TYPES[i]}/${TYPES[j]} midpoint — primary ${r.toFixed(2)}`,
      );
  }
}
console.log(`  153 pairs at their midpoint — worst is ${worstBar.pair}`);
console.log(row("worst dual-type bar midpoint", worstBar.r, 4.5));

console.log(`\n── ${fails.length} failure(s) ─────────────────────────────`);
for (const f of fails) console.log(`  ✗ ${f}`);
if (!fails.length) console.log("  All pairings pass. ✓");

// **This is what makes it a gate rather than a report.** Every failure above
// was printed and then forgotten: the script fell off its last line with an
// exit code of 0, so `npm run check` and CI went green with WCAG failures on
// screen. It had been advisory-only since D-027 — including through D-058,
// where a real pairing failed AA on 17 of 18 types and was caught by someone
// reading the output rather than by the build.
//
// `exitCode` rather than `exit(1)`, so the whole report still prints first —
// which is the point of a report.
if (fails.length) process.exitCode = 1;
