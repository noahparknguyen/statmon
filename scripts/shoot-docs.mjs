#!/usr/bin/env node
/**
 * Statmon: regenerate the documentation screenshots
 * ---------------------------------------------------------------------------
 * Captures the images the README and the repo's social preview use, plus the
 * Open Graph image, straight from the built site.
 *
 * A script rather than a manual job, because manual screenshots go stale, and
 * a README whose screenshot shows two thirds of the product is worse than one
 * with no screenshot: it's confidently wrong. So this runs off `dist/`.
 *
 * Needs a build first (`npm run build`) and Chrome. Override the binary with
 * CHROME_PATH. The repo root is served, so the app resolves at `/`, and the OG
 * generator at `/docs/og-image.html` with its `../public/fonts` references
 * intact.
 *
 *   npm run build && npm run shoot:docs
 */

import { createServer } from "node:http";
import { readFile, stat, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { requireChrome } from "./chrome.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

// Each shot is [url, width, height, output].
//
// The app screenshots are all 16:9, at 1600×900, so they read as a set side by
// side in the README. 1600×900 rather than 1280×720, because 720px isn't
// enough page for two of them: it halves the comparison board's speed banner,
// and leaves the dex showing two rows of a table whose point is that it holds
// 1,259.
//
// The two social frames aren't 16:9, and mustn't be: 1280×640 is the 2:1 GitHub
// requires for a social preview, and 1200×630 is the Open Graph standard. They
// are platform sizes, not aesthetic ones.
const SHOTS = [
  // The repo's social preview (GitHub Settings → Social preview) and the OG
  // image, both rendered from the one generator so they can't disagree.
  ["/docs/og-image.html?only=gh", 1280, 640, "docs/preview.png"],
  ["/docs/og-image.html?only=og", 1200, 630, "public/og-image.png"],
  // The README's images, one per tool, so it shows the site it describes.
  //
  // Home is captured tall and cropped, and the arithmetic is the point. The
  // hero is 72% of the viewport's height, so at any window height it leaves 28%
  // to whatever is below it, and there's no window size at which it fills the
  // frame by itself. Solving for one that crops cleanly: header (56) + 0.72H =
  // 900 gives H = 1172, so the top 900px of a 1600×1172 shot is exactly the
  // header and the hero, with no bleed and nothing cut off.
  //
  // Done here rather than by making the hero full height, on purpose: the top
  // of the comparison board peeking above the fold tells real visitors there's
  // more below, and a documentation image isn't a reason to give that up. The
  // docs bend to the site.
  ["/", 1600, 1172, "docs/home.png", { cropTo: 900 }],
  // The comparison needs a shot of its own, since home.png is the hero alone,
  // or the README would show two of the three tools.
  ["/compare/volcarona/vs/chandelure", 1600, 900, "docs/compare.png"],
  ["/dex", 1600, 900, "docs/dex.png"],
  // Bronzong rather than a bare typing: it's Steel/Psychic with Levitate, so
  // one frame shows the dual-type readout the tool exists for, the Pokémon
  // search that reaches it, and Ground dropping from 2× to 0× because of an
  // ability.
  ["/types/psychic/steel?as=bronzong", 1600, 900, "docs/types.png"],
  // Four contenders and a fixed stat, because that's the question the game
  // asks ("which of these four moves first?"), and because four cards show the
  // controls, the prompt, and the round in one frame, where two leave half of
  // it empty.
  //
  // This shot isn't reproducible, on purpose: the round is drawn at random, so
  // re-running `shoot:docs` gives a different four Pokémon every time. That's a
  // true picture of the page, since there's no canonical round, and pinning a
  // seed here would mean shipping a capture mode the game itself doesn't have.
  ["/games/higher?stat=speed&n=4", 1600, 900, "docs/games.png"],
  // The hard tier, because it's the one with something to show: a Pokémon whose
  // typing is hidden and whose ability is the question. Random like the shot
  // above, for the same reason.
  ["/games/effective?tier=hard", 1600, 900, "docs/effective.png"],
];

// The two social frames must come out centred, and that's measured rather than
// trusted: a frame can be off-centre in the capture while rendering fine in a
// browser.
const CENTRED = new Set(["docs/preview.png", "public/og-image.png"]);
const CENTRE_TOLERANCE = 2; // px

/* ---- serve the repo root, with the app's SPA fallback under it ---- */
const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const pathname = decodeURIComponent(url.pathname);

  // /docs/... and /public/... come from the repo; everything else is the built
  // app, falling back to index.html the way Cloudflare does (wrangler.jsonc).
  const fromRepo =
    pathname.startsWith("/docs/") || pathname.startsWith("/public/");
  const candidates = fromRepo
    ? [path.join(ROOT, pathname)]
    : [path.join(DIST, pathname), path.join(DIST, "index.html")];

  for (const candidate of candidates) {
    if (!candidate.startsWith(ROOT)) continue; // no traversal out of the repo
    try {
      const body = await readFile(candidate);
      res.writeHead(200, {
        "Content-Type": MIME[path.extname(candidate)] ?? "text/plain",
      });
      return res.end(body);
    } catch {
      /* try the fallback */
    }
  }
  res.writeHead(404).end("not found");
});

const port = await new Promise((resolve) => {
  server.listen(0, "127.0.0.1", () => resolve(server.address().port));
});
const origin = `http://127.0.0.1:${port}`;

const CHROME = await requireChrome("shoot:docs");

const shoot = (url, width, height, out) =>
  new Promise((resolve, reject) => {
    const child = spawn(
      CHROME,
      [
        "--headless",
        "--disable-gpu",
        "--no-sandbox",
        "--hide-scrollbars",
        `--screenshot=${path.join(ROOT, out)}`,
        `--window-size=${width},${height}`,
        // Generous: the app has to boot, resolve a lazy route, decode artwork
        // and settle the webfonts before the frame is worth keeping.
        "--virtual-time-budget=15000",
        `${origin}${url}`,
      ],
      { stdio: ["ignore", "ignore", "ignore"] },
    );
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`chrome exited ${code}`)),
    );
  });

try {
  await readFile(path.join(DIST, "index.html"));
} catch {
  console.error("dist/ is missing — run `npm run build` first.");
  process.exit(1);
}

// Keep the top of a shot and discard the rest. Written to a buffer first and
// then over the original, because sharp won't read and write the same path in
// one pipeline.
async function cropTop(file, width, height) {
  const { default: sharp } = await import("sharp");
  const buf = await sharp(file)
    .extract({ left: 0, top: 0, width, height })
    .toBuffer();
  await writeFile(file, buf);
}

// The horizontal centre of everything brighter than the near-black background,
// as an offset from the frame's centre. sharp is already a devDependency (it
// resizes the vendored artwork).
async function contentOffset(file) {
  const { default: sharp } = await import("sharp");
  const { data, info } = await sharp(file)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  let minX = width;
  let maxX = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const lum =
        0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      if (lum <= 60) continue; // background
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }
  }
  if (maxX < 0) return null; // nothing rendered at all
  return (minX + maxX) / 2 - width / 2;
}

const problems = [];

for (const [url, width, height, out, opts = {}] of SHOTS) {
  await shoot(url, width, height, out);
  const file = path.join(ROOT, out);
  if (opts.cropTo) await cropTop(file, width, opts.cropTo);
  const { size } = await stat(file);

  let note = "";
  if (CENTRED.has(out)) {
    const offset = await contentOffset(file);
    if (offset === null) {
      problems.push(`${out} is blank — did the frame fail to render?`);
      note = "  ✗ blank";
    } else if (Math.abs(offset) > CENTRE_TOLERANCE) {
      problems.push(
        `${out} content is ${offset.toFixed(1)}px off centre (tolerance ±${CENTRE_TOLERANCE})`,
      );
      note = `  ✗ ${offset.toFixed(1)}px off centre`;
    } else {
      note = "  centred ✓";
    }
  }

  console.log(
    `  ${out.padEnd(22)} ${String(width).padStart(4)}×${opts.cropTo ?? height}  ${(size / 1024).toFixed(0).padStart(4)} kB${note}`,
  );
}

server.close();

if (problems.length) {
  console.error(`\n── ${problems.length} problem(s) ──────────────`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}

console.log(`\n${SHOTS.length} screenshots regenerated ✓`);
