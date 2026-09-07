#!/usr/bin/env node
/**
 * Statmon — vendor the webfonts (D-061)
 * ---------------------------------------------------------------------------
 * Downloads the two families into `public/fonts/` and writes the matching
 * `@font-face` rules to `src/fonts.css`, which `src/index.css` imports.
 *
 * Why self-host. The rest of the site makes **zero** runtime requests — the
 * dataset is bundled and every sprite is committed (D-002, D-025) — and then
 * index.html opened two `preconnect`s and a render-blocking stylesheet to a
 * third party before the first paint. That is one external dependency standing
 * between a user and a page that otherwise has none, and it is on the critical
 * path: the browser cannot paint text until Google's CSS arrives and tells it
 * which font files to fetch. Self-hosted, the `@font-face` rules are in the
 * stylesheet the page already downloads, so the fetch starts a round trip
 * earlier and no third party sees the request at all.
 *
 * Same shape as `vendor:images` (scripts/vendor-images.mjs): run on demand,
 * commit the output, never fetch at runtime.
 *
 * Only **latin** and **latin-ext** are kept. Google serves ten subsets per
 * weight (cyrillic, greek, vietnamese…); the UI is English and the widest
 * character it has to render is the é in "Pokémon", which is latin-1.
 *
 *   npm run vendor:fonts
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public", "fonts");
const CSS_OUT = path.join(ROOT, "src", "fonts.css");

// Must match the families and weights in src/index.css's --font-* tokens and
// --font-weight-* ramp (06_style_guide §4.1-4.2).
const HREF =
  "https://fonts.googleapis.com/css2" +
  "?family=Space+Grotesk:wght@500;700" +
  "&family=Inter:wght@400;500;600" +
  "&display=swap";

// A modern desktop UA, or Google serves the TTF fallback stylesheet instead of
// the woff2 one — the whole point of vendoring these is to get woff2.
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const KEEP = new Set(["latin", "latin-ext"]);

// **The licences are vendored with the fonts, not beside them by hand.**
// Both families are SIL OFL 1.1, which requires the licence text to be
// distributed with the font software — and ten .woff2 files shipped in this
// repository for months with no OFL anywhere in it. Fetching them here is what
// stops that being true again after the next re-vendor: if upstream moves, this
// throws rather than quietly writing fonts without their terms (D-120).
const LICENSES = [
  {
    file: "OFL-Inter.txt",
    url: "https://raw.githubusercontent.com/rsms/inter/master/LICENSE.txt",
  },
  {
    file: "OFL-SpaceGrotesk.txt",
    url: "https://raw.githubusercontent.com/floriankarsten/space-grotesk/master/OFL.txt",
  },
];

const LICENSE_DIR = path.join(ROOT, "licenses");
await mkdir(LICENSE_DIR, { recursive: true });
for (const { file, url } of LICENSES) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${file}: ${res.status} from ${url}`);
  const text = await res.text();
  // A 404 page is a 200 from some hosts; an OFL that does not say so is not one.
  if (!text.includes("SIL OPEN FONT LICENSE"))
    throw new Error(`${file}: fetched text is not an OFL licence`);
  await writeFile(path.join(LICENSE_DIR, file), text);
  console.log(`  licence  ${file}`);
}

const css = await (await fetch(HREF, { headers: { "User-Agent": UA } })).text();

// The stylesheet is a flat list of `/* subset */` comments each followed by one
// @font-face. Parsed rather than regex-replaced in place so the output is our
// own file with our own paths, not a rewritten copy of theirs.
const blocks = [
  ...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g),
];

await mkdir(OUT_DIR, { recursive: true });

const rules = [];
let downloaded = 0;

for (const [, subset, block] of blocks) {
  if (!KEEP.has(subset)) continue;

  const family = block.match(/font-family:\s*'([^']+)'/)?.[1];
  const weight = block.match(/font-weight:\s*(\d+)/)?.[1];
  const url = block.match(/src:\s*url\(([^)]+)\)/)?.[1];
  const range = block.match(/unicode-range:\s*([^;]+);/)?.[1];
  if (!family || !weight || !url) continue;

  const slug = family.toLowerCase().replace(/\s+/g, "-");
  const file = `${slug}-${weight}-${subset}.woff2`;

  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${file}: ${res.status} from ${url}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  await writeFile(path.join(OUT_DIR, file), bytes);
  downloaded++;

  rules.push(
    [
      `/* ${family} ${weight} — ${subset} */`,
      `@font-face {`,
      `  font-family: "${family}";`,
      `  font-style: normal;`,
      `  font-weight: ${weight};`,
      // swap, not the default block: the fallback stack in --font-display /
      // --font-body renders immediately and is replaced when the file lands.
      // A dark UI with invisible text for 3s is worse than one reflow.
      `  font-display: swap;`,
      `  src: url("/fonts/${file}") format("woff2");`,
      ...(range ? [`  unicode-range: ${range};`] : []),
      `}`,
    ].join("\n"),
  );

  console.log(`  ${file.padEnd(34)} ${(bytes.length / 1024).toFixed(1)} kB`);
}

if (downloaded === 0) throw new Error("No faces matched — did the CSS change?");

await writeFile(
  CSS_OUT,
  [
    "/* GENERATED by scripts/vendor-fonts.mjs — do not edit by hand.",
    " * Run `npm run vendor:fonts` to regenerate. Imported by src/index.css.",
    " * Files live in public/fonts/ and are committed (D-061). */",
    "",
    ...rules,
    "",
  ].join("\n"),
);

console.log(`\n${downloaded} faces → public/fonts/, rules → src/fonts.css ✓`);
