#!/usr/bin/env node
/**
 * Statmon: WCAG contrast audit
 * ---------------------------------------------------------------------------
 * Reads the real `--color-*` tokens from src/index.css (resolving var() chains)
 * and computes WCAG 2.1 contrast ratios for every pairing that carries meaning:
 *   1. semantic text (primary, secondary, tertiary, accent) on each surface
 *   2. type colour as text on `surface`: the comparison's difference numbers
 *   3. type badge labels: the badge's text colour on the filled type colour
 *   4. stat-bar fill against the `elevated` track: non-text contrast
 *   5. dex stat-cell text over its proportional type fill
 *   6. type-chart grid cells: the multiplier text on each cell fill
 *   7. STAB chip: the type name and multiplier on the chip's own type fill
 *   8. Home hero: text on the scrim over a worst-case sprite pixel
 *   9. the correct answer's accent-muted fill
 *  10. game arena: panel text over the primary-type tint
 *  11. the flame: the speed banner's text, and the BST numeral set in it
 *  12. non-text (1.4.11): field edges, the focus ring, a selected chip
 *  13. type names on a game panel's tint, at the board's large size
 *
 * A panel and a dex bar are each one colour, the primary type's, so groups 5
 * and 10 cover them, with no gradient midpoints to check.
 *
 * Thresholds: AA normal text 4.5, AA large text 3.0, non-text (1.4.11) 3.0.
 * Statmon's difference, badge, and label text is small, so 4.5 applies.
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

// Every share this file blends with is read from the stylesheet, never
// restated. A copy here could drift silently: change the app's value, and this
// would keep checking a colour the site no longer paints, and pass. Each one
// is a token in index.css, the place the browser paints it from, and a token
// this file can't find is a hard failure rather than a default.
const readPct = (name) => {
  const m = raw.match(new RegExp(`--${name}:\\s*([\\d.]+)%`));
  if (!m) {
    console.error(`Could not read --${name} from index.css. It is audited here
and owned there; this file must not guess it.`);
    process.exit(1);
  }
  return Number(m[1]) / 100;
};

// The dex stat cell's proportional fill (DexRow).
const DEX_FILL = readPct("mix-dex-fill");
// How much of a type sits over the page background on a game panel.
const PANEL_TINT = readPct("mix-panel-tint");
// The type chart's 2× cell, and the wash over a selected column (TypeGrid).
const GRID_STRONG = readPct("mix-grid-strong");
const GRID_WASH = readPct("mix-grid-wash");
// The STAB chip's type fill over elevated (StabChip).
const STAB_FILL = readPct("mix-stab-fill");
// How far into the flame the speed banner's text may reach (SpeedBanner).
const FLAME_INSET = readPct("flame-text-inset");

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

// All badges use near-black (base) text: see typeTextVar in lib/types.js.
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
// type colour at 28%, composited on the row background. The hover background
// (surface) is the lighter of the two, and so the worse case for light text,
// so that's what is audited.
console.log(
  `\n=== 5. Dex stat cell — primary text on a ${Math.round(DEX_FILL * 100)}% type fill over the row (AA 4.5) ===`,
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

// The type chart's grid tints a cell by what it does, and prints the
// multiplier on top. The fills themselves aren't audited against the panel, on
// purpose: they repeat what the text says, so 1.4.11 doesn't apply, the same
// reading as for the stat-bar fills. The text is what has to pass.
console.log(
  "\n=== 6. Type chart grid cell — multiplier text on its fill (AA 4.5) ===",
);
// 2× is a 55% blend of accent into elevated, so it is composited the same way
// the dex stat cell is above rather than read straight from a token.
const strongFill = blend(hex("accent"), hex("elevated"), GRID_STRONG);
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
// A selected column lays a 12% accent wash over whatever fill is beneath it.
// 12% isn't an aesthetic choice: it's the most that keeps the text on top
// above AA, which is why the column's edges carry the highlight and the wash
// only helps.
const washed = (fill) => blend(hex("accent"), fill, GRID_WASH);
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

// The fills also have to be told apart at a glance, which is the point of the
// scale, so their separation is checked too.
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
// at 14% over `elevated`, and prints the type name and its multiplier on that.
// It looks like decoration, but it's text on a fill, so it's held to AA.
//
// Two rows per type: the name always takes `primary`, while the multiplier
// takes the tier colour, of which `secondary` (everything below 2×) is the
// faintest, and so the only one worth testing. This group is why that tier is
// `secondary` rather than `tertiary`.
console.log(
  `\n=== 7. STAB chip — text on a ${Math.round(STAB_FILL * 100)}% type fill over elevated (AA 4.5) ===`,
);
const secondary = hex("secondary");
for (const t of TYPES) {
  const fill = blend(hex(`type-${t}`), elevated, STAB_FILL);
  console.log(row(`${t} — name (primary)`, ratio(primary, fill), 4.5));
  console.log(row(`${t} — resisted (secondary)`, ratio(secondary, fill), 4.5));
}

// Home's hero puts the wordmark and tagline on a scrim over a wall of sprites.
// Unlike every group above, the backdrop isn't a token: it's whatever pixel
// happens to be behind the text, which changes with the dataset. So this
// audits the worst backdrop a sprite can produce, a pure-white pixel under
// `--hero-scrim` of base. Anything that passes here passes everywhere on that
// wall, for any sample.
//
// The scrim percentage is read from the stylesheet rather than restated, so the
// number this proves and the number the browser paints can't drift. This group
// is why the tagline is `primary` on the hero and `secondary` everywhere else:
// at 65%, the secondary token lands around 2.8:1 and fails.
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

// The type game marks its correct answer with `--color-accent-muted`, a fill
// that carries text, so its pairings are audited.
//
// Three things sit on it. The multiplier is `primary`. The check mark is
// `accent`, and it's an icon rather than text, so it's held to 1.4.11's 3.0 for
// non-text contrast rather than to 4.5, the same threshold as the stat-bar
// fills in group 4.
console.log("\n=== 9. The correct answer's accent fill (D-093) ===");
const accentMuted = hex("accent-muted");
console.log(row("multiplier (primary)", ratio(primary, accentMuted), 4.5));
console.log(
  row("check icon (accent, non-text)", ratio(hex("accent"), accentMuted), 3),
);
// The card's border is the other half of the marking, and it has to be visible
// against the page it sits on or the fill is doing the work alone.
console.log(row("border (accent) vs base", ratio(hex("accent"), base), 3));

// The arena tints each panel with its Pokémon's primary type: the site's
// oldest visual idea, applied to a whole surface rather than a chip. So the 18
// tints are 18 backgrounds for the name and the value, audited the way the
// STAB chip's fills are (group 7).
//
// The tint sits over `base` rather than `elevated`, so these pass easily. They
// are measured anyway, because "obviously fine" is an assumption, and a
// palette change could break it.
console.log(
  "\n=== 10. Game arena — panel text over the primary-type tint (AA 4.5) ===",
);
for (const t of TYPES) {
  const panel = blend(hex(`type-${t}`), base, PANEL_TINT);
  console.log(row(`${t} — name (primary)`, ratio(primary, panel), 4.5));
  console.log(
    row(`${t} — losing value (secondary)`, ratio(secondary, panel), 4.5),
  );
}

// The flame carries text in two places, and each is held to its own threshold.
// The speed banner's verdict is 14px, normal text, so 4.5. The BST difference
// set in the flame is 36 to 48px, large text, so 3.0.
//
// The banner's near-black text sits on the gradient wherever the words land,
// and the gradient's dark end is 3.61:1 against it, under AA, so a long name
// could cross into it. The text is held inside `--flame-text-inset` from each
// end, and this checks the worst point it can reach, which is the inset
// itself. Interpolated in sRGB, the space the browser draws the gradient in.
console.log("\n=== 11. The flame — text on and in the gradient ===");
const flameAt = (t) => {
  const core = hex("accent-core"),
    mid = hex("accent"),
    end = hex("accent-blue");
  return t <= 0.5 ? blend(mid, core, t * 2) : blend(end, mid, (t - 0.5) * 2);
};
const onFlame = hex("accent-contrast");
console.log(
  row(
    `banner text at the ${Math.round(FLAME_INSET * 100)}% inset (AA 4.5)`,
    ratio(onFlame, flameAt(FLAME_INSET)),
    4.5,
  ),
);
console.log(
  `  (at the flame's very end it would be ${ratio(onFlame, flameAt(0)).toFixed(2)} — why the inset exists)`,
);
console.log(
  row(
    "BST numeral, darkest stop vs surface (large 3.0)",
    ratio(flameAt(0), surface),
    3.0,
  ),
);

// WCAG 1.4.11 asks 3:1 of what identifies a control and its state, against
// what's next to it. A field's edge is the one thing that says "type here", so
// it has a token of its own: border-subtle would be 1.33:1 against the panel.
// The focus ring and the selected chip pass easily, and are here so a palette
// change can't make them fail without saying so.
console.log(
  "\n=== 12. Non-text contrast — field edges, focus, selection (1.4.11, 3.0) ===",
);
const field = hex("border-field");
for (const [bn, bg] of [
  ["base", base],
  ["surface", surface],
  ["elevated (the field's own fill)", elevated],
]) {
  console.log(row(`field edge vs ${bn}`, ratio(field, bg), 3.0));
}
for (const [bn, bg] of [
  ["base", base],
  ["surface", surface],
  ["elevated", elevated],
]) {
  console.log(
    row(`focus ring (accent) vs ${bn}`, ratio(hex("accent"), bg), 3.0),
  );
}
console.log(
  row(
    "selected chip (accent) vs unselected (elevated)",
    ratio(hex("accent"), elevated),
    3.0,
  ),
);

// The type game's panels print a typing as coloured text over the panel's own
// tint: the attacker its type over that type's tint, and a dual defender both
// of its types over its primary's. On a board the typing is `text-display`,
// 36px bold, which is large text, so the floor is 3.0. All 18 × 18 pairings
// are checked, because a defender's second type sits on its first type's tint.
// The thumbnails are pictures, hidden from assistive tech, and decoration has
// no floor.
console.log(
  "\n=== 13. Type names on a game panel's tint — large text (AA 3.0) ===",
);
let worstName = null;
let worstNameRatio = Infinity;
for (const t of TYPES) {
  for (const p of TYPES) {
    const r = ratio(
      hex(`type-${t}`),
      blend(hex(`type-${p}`), base, PANEL_TINT),
    );
    if (r < worstNameRatio) {
      worstNameRatio = r;
      worstName = `${t} on ${p}`;
    }
  }
}
console.log(`  324 pairings — worst is ${worstName}`);
console.log(row("worst type name on a tint", worstNameRatio, 3.0));

console.log(`\n── ${fails.length} failure(s) ─────────────────────────────`);
for (const f of fails) console.log(`  ✗ ${f}`);
if (!fails.length) console.log("  All pairings pass. ✓");

// This is what makes it a gate rather than a report. Without a failing exit
// code, `npm run check` and CI would go green with WCAG failures on screen.
//
// `exitCode` rather than `exit(1)`, so the whole report still prints first,
// which is the point of a report.
if (fails.length) process.exitCode = 1;
