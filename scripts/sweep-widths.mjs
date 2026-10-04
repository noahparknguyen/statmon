#!/usr/bin/env node
/**
 * Statmon — responsive width sweep
 * ---------------------------------------------------------------------------
 * Loads every route at every width that has ever mattered and asserts the page
 * does not scroll sideways, and that no page shows its footer before you
 * scroll (D-142).
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
  // The widest ability roster in the dex (38 characters over three chips) and
  // the era case that renders a corrected STAB chip — the two shapes the card's
  // 88px controls band has to hold (D-073, D-080).
  "/compare/hydrapple/vs/happiny",
  "/compare/krookodile/vs/gengar?asof=6",
  "/dex",
  "/dex?asof=1",
  "/types",
  "/types/water/flying",
  "/types/electric?as=eelektross",
  "/games",
  // The bare routes are the start screen now (D-108), so the boards need
  // parameterised routes of their own to stay measured.
  "/games/higher?stats=speed",
  "/games/higher",
  // Four contenders is the widest a round gets, and it is the layout that
  // stacks into a 2x2 below `lg` — the case the verdict card has to sit
  // between rather than on top of (D-097).
  "/games/higher?stats=speed&n=4",
  // A heavily filtered game: the narrowest pool the setup panel can produce
  // that still plays, and a Gen 1 lens, which changes the stat chips under it.
  "/games/higher?stats=speed&gen=1&type=water",
  "/games/higher?asof=1",
  // One route per tier: the answer rail changes width with the tier, and the
  // hard board is the only one carrying artwork and an ability pill (D-104).
  "/games/effective",
  "/games/effective?tier=easy",
  "/games/effective?tier=medium",
  "/games/effective?tier=hard",
  "/games/effective?tier=hard&type=ghost&asof=5",
  // Two DISCLOSURES, measured for the first time. A panel that only exists
  // after a click has never been swept, so the games' setup dialog and — the
  // one this closes retroactively — the dex's own mobile filter panel were both
  // unmeasured surfaces (D-099).
  // The setup dialog, opened from a game in progress — so it needs a
  // parameterised URL now that a bare one is the start screen (D-108). Both
  // games, because their panels hold different groups.
  ["/games/higher?stats=speed", "Setup"],
  ["/games/effective?tier=hard", "Setup"],
  // And from the start screen, which is the other way in.
  ["/games/higher", "Customise"],
  ["/dex", "Filters"],
  "/credits",
  "/style",
  "/no-such-page",
];

// A route is either a path, or a path plus the visible text of a button to
// click before measuring — which is how a disclosure or a modal gets swept at
// all. The label keeps the two apart in the report.
const ENTRIES = ROUTES.map((r) =>
  Array.isArray(r)
    ? { route: r[0], open: r[1], label: `${r[0]} [${r[1]}]` }
    : { route: r, open: null, label: r },
);

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
const ENTRIES = ${JSON.stringify(ENTRIES)};
const WIDTHS = ${JSON.stringify(WIDTHS)};
// A tall frame so lazy content and sticky elements settle the way they would on
// a real screen; height does not affect the horizontal question being asked.
// It is also the screen the footer check measures against. One height is
// enough for that: the rule is written in viewport units (D-142), so it holds
// at every height or at none.
const HEIGHT = 900;

const load = (entry, width) => new Promise((resolve) => {
  const f = document.createElement("iframe");
  // Width pinned in CSS as well as the attribute. The attribute alone left a
  // window in which the frame was laid out wider, which is how routes that
  // cannot overflow — the 404 is centred text — reported ~1000px scroll widths.
  f.width = width; f.height = HEIGHT;
  f.style.width = width + "px"; f.style.height = HEIGHT + "px";
  f.src = entry.route;
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
      // Where the footer starts, against the bottom of the first screen. A
      // game board has no footer, and reads as null.
      const foot = doc.querySelector("footer");
      return {
        scrollWidth,
        clientWidth,
        scrollHeight: d.scrollHeight,
        offenders,
        footerTop: foot
          ? Math.round(foot.getBoundingClientRect().top + f.contentWindow.scrollY)
          : null,
        viewHeight: d.clientHeight,
      };
    };
    const same = (a, b) =>
      a.scrollWidth === b.scrollWidth &&
      a.clientWidth === b.clientWidth &&
      a.scrollHeight === b.scrollHeight;

    f.contentDocument.fonts.ready.then(async () => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      await wait(150);
      // Open the disclosure or modal under test, if this entry names one. The
      // button is polled for rather than assumed present: every route but Home
      // is a lazily-imported chunk (D-060), so at fonts.ready the page may
      // still be its empty shell. A button that never appears is reported as a
      // failure rather than silently measuring the closed page — a check that
      // quietly tests nothing is worse than no check.
      if (entry.open) {
        let btn = null;
        // 4s, and deliberately not more. Raising this was the first thing
        // tried against the intermittent failure and it did not fix it — the
        // retry in the driver loop below is what did. It also is not free:
        // every poll spends VIRTUAL time, so a genuinely missing button costs
        // this budget twice on each of fourteen widths, and at 6s that was
        // enough to overrun the harness's virtual-time budget and report
        // "could not read the sweep results" instead of naming the button.
        // The loop exits on the first poll that finds it, so none of this is
        // spent in the normal case.
        //
        // NOTE: every comment from here down to the closing script tag lives
        // inside the HARNESS template literal, so it must not contain a
        // backtick. One did, twice, and each time it ended the string and broke
        // the whole file's parse in a way that points at line 146.
        for (let i = 0; i < 40 && !btn; i++) {
          btn = [...f.contentDocument.querySelectorAll("button")].find(
            (b) => (b.textContent || "").trim().startsWith(entry.open));
          if (!btn) await wait(100);
        }
        if (!btn) {
          resolve({ scrollWidth: 0, clientWidth: 0, scrollHeight: 0,
            offenders: [], targets: [], missing: entry.open });
          f.remove();
          return;
        }
        btn.click();
        await wait(150);
      }
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
  // A modal dialog makes the rest of the document INERT: nothing behind it can
  // be clicked, tabbed to or hit by a thumb, so nothing behind it is a target.
  // Without this the checker measures a chip inside the open setup panel
  // against a footer link it happens to sit 20px from, and reports a spacing
  // failure between two things that can never be touched in the same moment.
  // Modelling inertness is what makes "measured, not asserted" honest here —
  // an over-eager checker is a checker people learn to ignore.
  const modal = doc.querySelector("dialog[open]");
  const root = modal ?? doc;
  const boxes = [...root.querySelectorAll(SELECTOR)]
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
    for (const entry of ENTRIES) {
      let m = await load(entry, width);
      // Re-measure anything that looks like a failure, in a fresh frame.
      // Layout probes in a headless browser are inherently a little racy — a
      // transient caught mid-settle does not survive a second, independent
      // measurement, while a page that genuinely overflows fails every time. So
      // a failure has to happen twice to be reported. This is the difference
      // between a checker that is trusted and one that is muted.
      //
      // **A disclosure that never opened is the same kind of failure and was
      // not getting the same treatment.** The rule above was written for
      // overflow and applied only to overflow, so a single lost race among 406
      // checks was reported as a hard failure with no second chance — which is
      // exactly what made this check intermittently red. Twice observed across
      // separate runs, on a different route each time and once on a single
      // width out of fourteen, which is the signature of a race rather than a
      // broken page.
      if (m.scrollWidth > m.clientWidth || m.missing)
        m = await load(entry, width);
      results.push({ width, route: entry.label, ...m });
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
      // Raised with the route list (D-108), and again for the disclosure retry:
      // a genuinely missing button now spends its poll budget twice on every
      // width, which overran 300s and surfaced as the "could not read" message
      // below rather than as the real fault. Each route × width settles on its
      // own timers, so the budget scales with ENTRIES.length × WIDTHS.length —
      // and the failure mode when it runs out is silent: the harness never
      // prints its results and the sweep reports "could not read", which reads
      // like a missing build or a missing Chrome rather than a timeout.
      "--virtual-time-budget=600000",
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
  `\nSwept ${ENTRIES.length} routes × ${WIDTHS.length} widths = ${results.length} checks.\n`,
);

// A disclosure whose button never turned up. Reported first and loudly,
// because the failure mode it guards against is silent: the frame would
// measure a closed page, pass, and claim to have swept a panel it never
// opened. A renamed button is exactly how that happens (D-099).
const missing = results.filter((r) => r.missing);
if (missing.length) {
  // Grouped WITH THE WIDTHS, because "this route never opened" and "this route
  // never opened at 320px" are different bugs and the first phrasing hides the
  // second. A disclosure that fails at every width is broken; one that fails at
  // a single width is a layout or a timing fault, and the widths say which.
  const byRoute = new Map();
  for (const r of missing) {
    if (!byRoute.has(r.route)) byRoute.set(r.route, []);
    byRoute.get(r.route).push(r.width);
  }
  console.log("Disclosures that never opened:");
  for (const [route, widths] of byRoute)
    console.log(
      `  ✗ ${route} — no button matched at ${widths.sort((a, b) => a - b).join(", ")}px` +
        ` (${widths.length} of ${WIDTHS.length} widths)`,
    );
  console.log();
}

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

// The footer stays below the fold, at every width (D-142). A failure here is a
// page shorter than the screen that got past `<main>`'s floor.
const early = results.filter(
  (r) => r.footerTop != null && r.footerTop < r.viewHeight,
);

console.log("\nThe footer on the first screen:");
if (early.length === 0) {
  console.log("  No page shows its footer before you scroll. ✓");
} else {
  for (const r of early)
    console.log(
      `  ✗ ${r.route} @ ${r.width}px — footer at ${r.footerTop}px on a ${r.viewHeight}px screen`,
    );
}

if (missing.length) {
  console.log(`\n── ${missing.length} unopened disclosure(s) ────────────\n`);
  process.exit(1);
}
if (overflow.length === 0 && tooSmall.length === 0 && early.length === 0) {
  console.log("\n── 0 horizontal overflow(s) ─────────────────");
  console.log("  No route scrolls sideways at any width. ✓\n");
  process.exit(0);
}
if (overflow.length === 0) {
  if (tooSmall.length)
    console.log(`\n── ${tooSmall.length} target-size failure(s) ──────────`);
  if (early.length)
    console.log(
      `\n── ${early.length} footer(s) on the first screen ──────────`,
    );
  console.log();
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
