#!/usr/bin/env node
/**
 * Statmon — documentation link checker
 * ---------------------------------------------------------------------------
 * Validates every relative Markdown link across README.md + docs/:
 *   - the target file exists
 *   - any #fragment resolves to a real heading or an explicit <a id="…"> anchor
 *
 * Anchor slugs are computed the way GitHub does it (github-slugger):
 * lowercase → strip everything outside [\w- ] → spaces become hyphens.
 * Note this does NOT collapse runs of spaces, so a heading containing "—" or
 * "&" yields a DOUBLE hyphen ("A — B" → "a--b"). Getting this wrong produces
 * false positives, which is exactly why this check is scripted rather than eyeballed.
 *
 * Kept as a regression tool alongside `audit:contrast` (D-027, D-031):
 *   npm run check:docs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^\w\- ]+/g, "")
    .replace(/ /g, "-");

const files = [
  "README.md",
  ...fs
    .readdirSync(path.join(ROOT, "docs"))
    .filter((f) => f.endsWith(".md"))
    .map((f) => path.join("docs", f)),
];

// Index every anchor each file offers.
const anchors = {};
for (const rel of files) {
  const text = fs.readFileSync(path.join(ROOT, rel), "utf8");
  const set = new Set();
  const seen = new Map();
  for (const m of text.matchAll(/^#{1,6}\s+(.*)$/gm)) {
    const base = slug(m[1].replace(/`/g, ""));
    const n = seen.get(base) ?? 0;
    set.add(n === 0 ? base : `${base}-${n}`);
    seen.set(base, n + 1);
  }
  for (const m of text.matchAll(/<a id="([^"]+)"><\/a>/g)) set.add(m[1]);
  anchors[rel] = set;
}

const problems = [];
let checked = 0;
for (const rel of files) {
  const text = fs.readFileSync(path.join(ROOT, rel), "utf8");
  for (const m of text.matchAll(/\[([^\]]*)\]\(([^)\s]+)\)/g)) {
    const [, label, href] = m;
    if (/^(https?:|mailto:|#!)/.test(href)) continue;
    checked++;
    const [filePart, frag] = href.split("#");
    const target = filePart
      ? path.normalize(path.join(path.dirname(rel), filePart))
      : rel;
    if (filePart && !fs.existsSync(path.join(ROOT, target))) {
      problems.push(`${rel}  missing file   [${label}](${href})`);
      continue;
    }
    if (!frag) continue;
    const set = anchors[target];
    if (!set) continue; // linking into a non-Markdown file; nothing to verify
    if (!set.has(frag))
      problems.push(`${rel}  broken anchor  [${label}](${href})`);
  }
}

console.log(
  `Checked ${checked} relative link(s) across ${files.length} file(s).`,
);
if (problems.length) {
  console.log(`\n⚠ ${problems.length} problem(s):`);
  for (const p of problems) console.log(`  ✗ ${p}`);
  process.exitCode = 1;
} else {
  console.log("All links and anchors resolve. ✓");
}
