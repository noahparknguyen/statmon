#!/usr/bin/env node
/**
 * Statmon — responsive width sweep
 * ---------------------------------------------------------------------------
 * Loads every route at every width that has ever mattered and asserts the page
 * does not scroll sideways.
 *
 * This exists because that check kept being done by hand and kept being done
 * incompletely. The type grid leaked its overflow into the document for as long
 * as it had shipped, and three rounds of width testing missed it because 390,
 * 768 and 1280 are all clean while 600 and 700 are not (D-052/D-055). A bug you
 * can only find at 600px is a bug you will not find by resizing a window.
 *
 * How it works: `dist/` is served by a throwaway static server with the same
 * SPA fallback Cloudflare uses (wrangler.jsonc), and a harness page loads each
 * route in an iframe sized to the width under test. An iframe establishes its
 * own viewport, so media queries respond to the iframe's width — which means
 * one browser launch covers every width instead of one launch per width.
 *
 * Reports `scrollHeight` per route too, since "how far does a phone have to
 * scroll for the answer" is the other thing worth watching (D-057).
 *
 *   npm run sweep:widths            # after npm run build
 *   npm run sweep:widths -- --json  # machine-readable
 */

import { createServer } from "node:http";
import { readFile, writeFile, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { requireChrome } from "./chrome.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");

// Every breakpoint boundary, the common device widths, and — deliberately — the
// awkward middles between them, which is where the bugs have actually been.
//
// 360 / 375 / 383 / 384 bracket the `xs` wordmark boundary specifically: the
// header overflowed on every width in [360, 374] for as long as xs was 360,
// and no round device width lands in that range to catch it (D-062).
const WIDTHS = [
  320, 360, 375, 383, 384, 390, 430, 600, 700, 768, 900, 1024, 1280, 1440,
];

const ROUTES = [
  "/",
  "/compare",
  "/compare/volcarona/vs/chandelure",
  "/compare/charizard/vs/blastoise?asof=1",
  "/dex",
  "/dex?asof=1",
  "/types",
  "/types/water/flying",
  "/credits",
  "/style",
  "/no-such-page",
];

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

/* ---- serve dist/ with the production SPA fallback ---- */
const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const file = path.join(DIST, decodeURIComponent(url.pathname));
  // Resolve inside dist only; anything else falls through to index.html.
  const safe = file.startsWith(DIST) ? file : DIST;
  for (const candidate of [safe, path.join(DIST, "index.html")]) {
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

/* ---- harness: one iframe per route, measured at a given width ---- */
const HARNESS = `<!doctype html><meta charset="utf-8"><title>sweep</title>
<style>html,body{margin:0}iframe{border:0;display:block}</style>
<pre id="out">PENDING</pre>
<script>
const ROUTES = ${JSON.stringify(ROUTES)};
const WIDTHS = ${JSON.stringify(WIDTHS)};
// A tall frame so lazy content and sticky elements settle the way they would on
// a real screen; height does not affect the horizontal question being asked.
const HEIGHT = 900;

const load = (src, width) => new Promise((resolve) => {
  const f = document.createElement("iframe");
  // Width pinned in CSS as well as the attribute. The attribute alone left a
  // window in which the frame was laid out wider, which is how routes that
  // cannot overflow — the 404 is centred text — reported ~1000px scroll widths.
  f.width = width; f.height = HEIGHT;
  f.style.width = width + "px"; f.style.height = HEIGHT + "px";
  f.src = src;
  f.onload = () => {
    // Overlay scrollbars, which is what phones actually have. Without this the
    // frame lays out at the requested width but reports a 15px-narrower
    // viewport once a classic scrollbar appears, and every route looks like it
    // overflows by exactly a scrollbar — an artifact of the harness, not the
    // page. (Backticks are deliberately absent: this comment lives inside a
    // template literal.)
    const d = f.contentDocument.documentElement;
    d.style.scrollbarWidth = "none";
    // Read once to force the reflow before measuring.
    void d.clientWidth;
    // Measure only once the layout has stopped moving, and capture the evidence
    // in the same breath as the number.
    //
    // A fixed delay is not good enough here, and the reasons stacked up: the
    // webfonts change text metrics when they swap, every route but Home is a
    // lazily-imported chunk that renders after load fires (D-060), and the type
    // grid briefly reports its uncontained width before paint containment clips
    // it. Each produced its own phantom failure on roughly one run in six.
    //
    // Two equal readings 120ms apart was not enough either — a transient can sit
    // still for longer than that. So: three consecutive identical readings, and
    // the offending elements are collected inside the same read as the numbers,
    // so a report can never disagree with itself the way an earlier version did
    // (it printed a 1035px overflow with an empty offender list, because the
    // page had settled between measuring and inspecting).
    //
    // A checker that cries wolf is a checker people learn to ignore.
    const read = () => {
      const doc = f.contentDocument;
      // Force a layout flush before reading. Under Chrome's virtual clock,
      // scrollWidth can hand back a cached value from before the last relayout
      // while getBoundingClientRect() (which always flushes) reports the settled
      // box — which is how an earlier version printed a 1016px overflow next to
      // an empty list of overflowing elements. Reading a rect first puts both on
      // the same layout.
      d.getBoundingClientRect();
      const scrollWidth = d.scrollWidth;
      const clientWidth = d.clientWidth;
      const offenders =
        scrollWidth > clientWidth
          ? [...doc.querySelectorAll("*")]
              .map((el) => ({ el, r: el.getBoundingClientRect() }))
              .filter(({ r }) => r.right > clientWidth + 0.5)
              .sort((a, b) => b.r.right - a.r.right)
              .slice(0, 3)
              .map(({ el, r }) => ({
                tag: el.tagName,
                cls: String(el.className || "").slice(0, 70),
                right: Math.round(r.right),
                width: Math.round(r.width),
              }))
          : [];
      return {
        scrollWidth,
        clientWidth,
        scrollHeight: d.scrollHeight,
        offenders,
      };
    };
    const same = (a, b) =>
      a.scrollWidth === b.scrollWidth &&
      a.clientWidth === b.clientWidth &&
      a.scrollHeight === b.scrollHeight;

    f.contentDocument.fonts.ready.then(async () => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      await wait(150);
      let prev = read();
      let agreed = 0;
      // ~4s of headroom. Every route settles well inside it; the cap only stops
      // a genuinely unstable page from hanging the sweep.
      for (let i = 0; i < 26 && agreed < 2; i++) {
        await wait(150);
        const next = read();
        agreed = same(prev, next) ? agreed + 1 : 0;
        prev = next;
      }
      resolve({ ...prev, targets: targetFailures(f.contentDocument) });
      f.remove();
    });
  };
  document.body.appendChild(f);
});

// WCAG 2.5.8 Target Size (Minimum), AA. A target passes if it is at least
// 24x24 CSS px, OR if a 24px-diameter circle centred on it does not reach any
// other target's circle — i.e. every neighbouring centre is at least 24px away.
// 04_design §9 states this as the binding standard, so it is measured here
// rather than asserted: the doc has carried a "likely failure" for FormChips
// since D-042 without anyone putting a number on it.
const SELECTOR = "a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])";

function targetFailures(doc) {
  const boxes = [...doc.querySelectorAll(SELECTOR)]
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter(({ el, r }) => {
      if (r.width === 0 || r.height === 0) return false;
      const cs = doc.defaultView.getComputedStyle(el);
      return cs.visibility !== "hidden" && cs.display !== "none";
    });
  const out = [];
  for (const b of boxes) {
    if (b.r.width >= 24 && b.r.height >= 24) continue;
    const cx = b.r.left + b.r.width / 2, cy = b.r.top + b.r.height / 2;
    let nearest = Infinity;
    for (const o of boxes) {
      if (o === b) continue;
      const ox = o.r.left + o.r.width / 2, oy = o.r.top + o.r.height / 2;
      nearest = Math.min(nearest, Math.hypot(cx - ox, cy - oy));
    }
    if (nearest < 24)
      out.push({
        tag: b.el.tagName,
        text: (b.el.textContent || "").trim().slice(0, 24),
        w: Math.round(b.r.width),
        h: Math.round(b.r.height),
        nearest: Math.round(nearest),
      });
  }
  return out;
}

(async () => {
  const results = [];
  for (const width of WIDTHS)
    for (const route of ROUTES) {
      let m = await load(route, width);
      // Re-measure anything that looks like a failure, in a fresh frame.
      // Layout probes in a headless browser are inherently a little racy — a
      // transient caught mid-settle does not survive a second, independent
      // measurement, while a page that genuinely overflows fails every time. So
      // a failure has to happen twice to be reported. This is the difference
      // between a checker that is trusted and one that is muted.
      if (m.scrollWidth > m.clientWidth) m = await load(route, width);
      results.push({ width, route, ...m });
    }
  document.getElementById("out").textContent =
    "SWEEP_JSON:" + JSON.stringify(results);
})();
</script>`;

const harnessPath = path.join(DIST, "__sweep.html");
await writeFile(harnessPath, HARNESS);

/* ---- drive headless Chrome and read the harness back out ---- */
const CHROME = await requireChrome("sweep:widths");

const dom = await new Promise((resolve, reject) => {
  const child = spawn(
    CHROME,
    [
      "--headless",
      "--disable-gpu",
      "--no-sandbox",
      "--virtual-time-budget=180000",
      "--dump-dom",
      `${origin}/__sweep.html`,
    ],
    { stdio: ["ignore", "pipe", "ignore"] },
  );
  let out = "";
  child.stdout.on("data", (d) => (out += d));
  child.on("error", reject);
  child.on("close", () => resolve(out));
});

await rm(harnessPath, { force: true });
server.close();

const match = dom.match(/SWEEP_JSON:(\[.*?\])<\/pre>/s);
if (!match) {
  console.error(
    "Could not read the sweep results. Is dist/ built (npm run build) and is\n" +
      "Chrome available? Override with CHROME_PATH=/path/to/chrome.",
  );
  process.exit(1);
}
const results = JSON.parse(match[1].replace(/&quot;/g, '"'));

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(results, null, 2));
  process.exit(results.some((r) => r.scrollWidth > r.clientWidth) ? 1 : 0);
}

/* ---- report ---- */
const overflow = results.filter((r) => r.scrollWidth > r.clientWidth);

console.log(
  `\nSwept ${ROUTES.length} routes × ${WIDTHS.length} widths = ${results.length} checks.\n`,
);

// Tallest page per route, at the narrowest width — the "how far does a phone
// scroll" number.
const phone = results.filter((r) => r.width === 390);
console.log("Page height at 390px (the scroll cost of an answer):");
for (const r of phone.sort((a, b) => b.scrollHeight - a.scrollHeight))
  console.log(`  ${String(r.scrollHeight).padStart(5)}px  ${r.route}`);

// WCAG 2.5.8, measured at the narrowest width, where targets are tightest.
const tooSmall = results
  .filter((r) => r.width === 320 && r.targets.length)
  .flatMap((r) => r.targets.map((t) => ({ route: r.route, ...t })));

console.log("\nWCAG 2.5.8 target size at 320px:");
if (tooSmall.length === 0) {
  console.log("  Every target is 24x24 or clears its neighbours by 24px. ✓");
} else {
  for (const t of tooSmall)
    console.log(
      `  ✗ ${t.route} — <${t.tag}> "${t.text}" ${t.w}x${t.h}, nearest centre ${t.nearest}px`,
    );
}

if (overflow.length === 0 && tooSmall.length === 0) {
  console.log("\n── 0 horizontal overflow(s) ─────────────────");
  console.log("  No route scrolls sideways at any width. ✓\n");
  process.exit(0);
}
if (overflow.length === 0) {
  console.log(`\n── ${tooSmall.length} target-size failure(s) ──────────\n`);
  process.exit(1);
}

console.log(`\n── ${overflow.length} horizontal overflow(s) ─────────────────`);
for (const r of overflow) {
  console.log(
    `  ✗ ${r.route} @ ${r.width}px — scrollWidth ${r.scrollWidth} > ${r.clientWidth}`,
  );
  for (const o of r.offenders ?? [])
    console.log(`      <${o.tag}> "${o.cls}" right=${o.right} w=${o.width}`);
}
console.log();
process.exit(1);
