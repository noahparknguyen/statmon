#!/usr/bin/env node
/**
 * Statmon — regenerate the documentation screenshots (D-064)
 * ---------------------------------------------------------------------------
 * Captures the images the README and the repo's social preview use, plus the
 * Open Graph image, straight from the built site.
 *
 * These went stale because taking them was a manual job. `docs/preview.png` was
 * still the launch image — captured before the dex and the type chart existed,
 * on a site it no longer depicted — and `docs/home.png` predated the type
 * chart's preview landing on Home. A README whose screenshot shows two thirds
 * of the product is worse than one with no screenshot, because it is confidently
 * wrong. So this is a script, and it runs off `dist/`.
 *
 * Requires a build first (`npm run build`) and Chrome; override the binary with
 * CHROME_PATH. The repo root is served, so the app resolves at `/` and the OG
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
// The three app screenshots are **16:9, all at 1600×900**. They were 1280×1000
// and 1280×820, sized per-shot to frame their subject, which left the set
// looking squarish and mismatched side by side in the README. One ratio and one
// size reads as a set. 1600×900 rather than 1280×720 because 720px is not enough
// page for two of the three: it halves the hero board's speed banner, and it
// leaves the dex showing two rows of a table whose whole point is that it holds
// 1,259.
//
// The two social frames are NOT 16:9 and must not be: 1280×640 is the 2:1 GitHub
// requires for a social preview, and 1200×630 is the Open Graph standard. They
// are platform sizes, not aesthetic ones.
const SHOTS = [
  // The repo's social preview (GitHub Settings → Social preview) and the OG
  // image, both rendered from the one generator so they cannot disagree.
  ["/docs/og-image.html?only=gh", 1280, 640, "docs/preview.png"],
  ["/docs/og-image.html?only=og", 1200, 630, "public/og-image.png"],
  // The README's images, one per tool, so it shows the site it describes.
  //
  // Home is captured TALL and cropped, and the arithmetic is the point (D-071).
  // The hero is `72vh`, so at any window height it leaves 28% of the viewport to
  // whatever is below it — there is no window size at which it fills the frame
  // by itself. Solving for one that crops cleanly: header (56) + 0.72H = 900
  // gives H = 1172, so the top 900px of a 1600x1172 shot is exactly the header
  // and the hero, with no bleed and nothing cut off.
  //
  // Doing it here rather than by making the hero `100vh` is deliberate: the
  // crest of the comparison board below the fold is a usability affordance for
  // real visitors, and a documentation image is not a reason to spend it. The
  // whole point of this script (D-064) is that the docs bend to the site.
  ["/", 1600, 1172, "docs/home.png", { cropTo: 900 }],
  // The flagship needs a shot of its own now that home.png is the hero alone —
  // otherwise the README shows two of the three tools, which is the exact
  // failure D-064 exists to prevent.
  ["/compare/volcarona/vs/chandelure", 1600, 900, "docs/compare.png"],
  ["/dex", 1600, 900, "docs/dex.png"],
  ["/types/water/flying", 1600, 900, "docs/types.png"],
];

// The two social frames must come out centred. This check exists because they
// did not: the generator's frame-isolation matched nothing, so both captures
// photographed the 1200px OG frame, and `preview.png` shipped as that frame in a
// 1280px window with the wordmark 40px left of centre. It rendered fine in a
// browser, which is exactly why nobody caught it. (D-066)
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

// Horizontal centre of everything brighter than the near-black background.
// Keep the top of a shot and discard the rest. Written to a buffer first and
// then over the original, because sharp will not read and write the same path
// in one pipeline.
async function cropTop(file, width, height) {
  const { default: sharp } = await import("sharp");
  const buf = await sharp(file)
    .extract({ left: 0, top: 0, width, height })
    .toBuffer();
  await writeFile(file, buf);
}

// sharp is already a devDependency (it resizes the vendored artwork).
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
