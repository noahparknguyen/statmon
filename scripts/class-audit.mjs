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
 * `src/index.css` at run time — the 22 `@layer components` styles and the
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

import { classStrings } from "./classes.mjs";

// The design system is read out of the stylesheet, and the class strings out of
// src/, by the module this audit shares with `audit:styles` (D-134).

/* -------------------------------------------------------------------------
   The audit.
   ---------------------------------------------------------------------- */

const conflicts = [];
const unclassified = new Map();
const stats = {};

for (const { file, line, chunk, parsed } of classStrings({ stats })) {
  const seen = new Map();
  for (const p of parsed) {
    if (!p.family) {
      unclassified.set(p.base, (unclassified.get(p.base) ?? 0) + 1);
      continue;
    }
    const key = `${p.variant}|${p.family}`;
    if (seen.has(key)) {
      conflicts.push({
        file,
        line,
        family: p.family,
        variant: p.variant,
        first: seen.get(key),
        second: p.token,
        chunk,
      });
    } else {
      seen.set(key, p.token);
    }
  }
}

/* -------------------------------------------------------------------------
   Report.
   ---------------------------------------------------------------------- */

const pad = (s, n) => String(s).padEnd(n);

console.log(
  `\nScanned ${stats.files} file(s): ${stats.literals} string literal(s), ` +
    `${stats.classStrings} of them class strings.\n`,
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
