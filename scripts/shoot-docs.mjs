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
import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

// Each shot is [url, width, height, output]. Heights are chosen to frame the
// thing the shot is *about* — the hero board, the table, the tier readout —
// rather than to capture a whole page, which at 1,259 rows is not a screenshot.
const SHOTS = [
  // The repo's social preview (GitHub Settings → Social preview) and the OG
  // image, both rendered from the one generator so they cannot disagree.
  ["/docs/og-image.html?only=gh", 1280, 640, "docs/preview.png"],
  ["/docs/og-image.html?only=og", 1200, 630, "public/og-image.png"],
  // The README's images, one per tool, so it shows the site it describes.
  ["/", 1280, 1000, "docs/home.png"],
  ["/dex", 1280, 820, "docs/dex.png"],
  ["/types/water/flying", 1280, 1000, "docs/types.png"],
];

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

const CHROME = process.env.CHROME_PATH ?? "/usr/bin/google-chrome";

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

for (const [url, width, height, out] of SHOTS) {
  await shoot(url, width, height, out);
  const { size } = await import("node:fs/promises").then((fs) =>
    fs.stat(path.join(ROOT, out)),
  );
  console.log(
    `  ${out.padEnd(22)} ${width}×${height}  ${(size / 1024).toFixed(0)} kB`,
  );
}

server.close();
console.log(`\n${SHOTS.length} screenshots regenerated ✓`);
