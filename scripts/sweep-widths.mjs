#!/usr/bin/env node
/**
 * Statmon: responsive width sweep
 * ---------------------------------------------------------------------------
 * Loads every route at every width that matters, and on three phones held
 * sideways, and asserts the page doesn't scroll sideways, and that no page
 * shows its footer before you scroll.
 *
 * A script, because by hand this check gets done incompletely. A layout can be
 * clean at 390, 768, and 1280 and still overflow at 600 or 700, and a bug you
 * can only find at 600px is one you won't find by resizing a window.
 *
 * How it works: `dist/` is served by a throwaway static server with the same
 * SPA fallback Cloudflare uses (wrangler.jsonc), and a harness page loads each
 * route in an iframe sized to the width under test. An iframe has its own
 * viewport, so media queries respond to the iframe's size, which means one
 * browser launch covers every size instead of one launch per size.
 *
 * Reports `scrollHeight` per route too, since how far a phone has to scroll
 * for the answer is the other thing worth watching.
 *
 *   npm run sweep:widths            # after npm run build
 *   npm run sweep:widths -- --json  # machine-readable
 */

import { writeFile, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { requireChrome } from "./chrome.mjs";
import { DIST, serveBuild } from "./serve.mjs";
import { ENTRIES } from "./routes.mjs";

// Every breakpoint boundary, the common device widths, and, on purpose, the
// awkward middles between them, which is where layout bugs hide.
//
// 360, 375, 383, and 384 bracket the `xs` breakpoint (384px), where the
// game bar's name appears: no common device width lands just under it.
const WIDTHS = [
  320, 360, 375, 383, 384, 390, 430, 600, 700, 768, 900, 1024, 1280, 1440,
];

// And three phones held sideways, since a screen that short and wide lays the
// game boards out by its height (the `sideways` variant in index.css): the
// smallest, an iPhone SE's, and a common one's.
const SIDEWAYS = [
  [568, 320],
  [667, 375],
  [844, 390],
];

// Every frame the sweep measures, as [width, height]. The widths are 900px
// tall, as a desktop or a phone held upright would be.
const SIZES = [...WIDTHS.map((w) => [w, 900]), ...SIDEWAYS];

// How a frame is named in the report: its width alone at the usual height.
const sizeLabel = (r) =>
  r.height === 900 ? `${r.width}px` : `${r.width}×${r.height}`;

/* ---- serve dist/ with the production SPA fallback ---- */
const { origin, close } = await serveBuild();

/* ---- harness: one iframe per route, measured at a given width ---- */
const HARNESS = `<!doctype html><meta charset="utf-8"><title>sweep</title>
<style>html,body{margin:0}iframe{border:0;display:block}</style>
<pre id="out">PENDING</pre>
<script>
const ENTRIES = ${JSON.stringify(ENTRIES)};
const SIZES = ${JSON.stringify(SIZES)};
// Tall frames for the widths, so lazy content and sticky elements settle the
// way they would on a real screen, and the frame's height is the screen the
// footer check measures against. The sideways frames are short on purpose:
// there the height changes the layout.
const load = (entry, [width, height]) => new Promise((resolve) => {
  const f = document.createElement("iframe");
  // Width pinned in CSS as well as the attribute. The attribute alone leaves a
  // moment in which the frame is laid out wider, so routes that can't
  // overflow, such as the 404's centred text, would report false overflows.
  f.width = width; f.height = height;
  f.style.width = width + "px"; f.style.height = height + "px";
  f.src = entry.route;
  f.onload = () => {
    // Overlay scrollbars, which is what phones have. Without this, the frame
    // lays out at the requested width but reports a 15px-narrower viewport
    // once a classic scrollbar appears, and every route looks like it
    // overflows by exactly a scrollbar: an artifact of the harness, not the
    // page. (No backticks here: this comment lives inside a template literal.)
    const d = f.contentDocument.documentElement;
    d.style.scrollbarWidth = "none";
    // Read once to force the reflow before measuring.
    void d.clientWidth;
    // Measure only once the layout has stopped moving, and collect the
    // evidence in the same read as the number.
    //
    // A fixed delay isn't enough here: the webfonts change text metrics when
    // they swap, every route but Home is a lazily loaded chunk that renders
    // after load fires, and the type grid briefly reports its uncontained
    // width before paint containment clips it. Each can cause a false failure.
    //
    // Two equal readings close together aren't enough either, since a
    // transient can hold still for longer than that. So it takes three
    // consecutive identical readings, and the offending elements are collected
    // inside the same read as the numbers, so a report can't disagree with
    // itself, such as an overflow with an empty list of offenders.
    //
    // A checker that cries wolf is a checker people learn to ignore.
    const read = () => {
      const doc = f.contentDocument;
      // Force a layout flush before reading. Under Chrome's virtual clock,
      // scrollWidth can hand back a cached value from before the last relayout,
      // while getBoundingClientRect() (which always flushes) reports the
      // settled box, so a report could show an overflow next to an empty list
      // of overflowing elements. Reading a rect first puts both on the same
      // layout.
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
      // is a lazily loaded chunk, so at fonts.ready the page may still be its
      // empty shell. A button that never appears is reported as a failure
      // rather than silently measuring the closed page: a check that quietly
      // tests nothing is worse than no check.
      if (entry.open) {
        let btn = null;
        // 4s, and not more. A longer wait doesn't fix a lost race (the retry in
        // the driver loop below does), and it isn't free: every poll spends
        // virtual time, so a missing button costs this budget twice on each of
        // the fourteen widths, and much more would overrun the harness's
        // virtual-time budget and report "could not read the sweep results"
        // instead of naming the button. The loop exits on the first poll that
        // finds it, so none of this is spent in the normal case.
        //
        // NOTE: every comment from here down to the closing script tag lives
        // inside the HARNESS template literal, so it must not contain a
        // backtick: one would end the string and break the whole file's parse,
        // with an error pointing at the line where HARNESS starts.
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
      // 3.9s of headroom (26 polls of 150ms). Every route settles well inside
      // it, and the cap only stops an unstable page from hanging the sweep.
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

// WCAG 2.5.8 Target Size (Minimum), AA. A target passes if it's at least
// 24x24 CSS px, or if a 24px-diameter circle centred on it doesn't reach any
// other target's circle, meaning every neighbouring centre is at least 24px
// away. The site's compact chips rely on that spacing exception, so it's
// measured here rather than assumed.
const SELECTOR = "a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])";

function targetFailures(doc) {
  // A modal dialog makes the rest of the document inert: nothing behind it can
  // be clicked, tabbed to, or hit by a thumb, so nothing behind it is a target.
  // Without this, the checker would measure a chip inside the open setup panel
  // against a footer link it happens to sit near, and report a spacing failure
  // between two things that can never be touched at the same moment. An
  // over-eager checker is a checker people learn to ignore.
  const modal = doc.querySelector("dialog[open]");
  const root = modal ?? doc;
  const boxes = [...root.querySelectorAll(SELECTOR)]
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter(({ el, r }) => {
      if (r.width === 0 || r.height === 0) return false;
      const cs = doc.defaultView.getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none") return false;
      // Covered where a thumb would land: a fixed bar over the content
      // scrolling under it, such as a phone's tab bar over the row behind it.
      // A tap there hits the bar, so the row isn't a target at this scroll
      // position, any more than the page behind a modal is. Only on screen:
      // off it nothing can be hit, so nothing can be told, and the target
      // stays in.
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const view = doc.documentElement;
      if (cx < 0 || cy < 0 || cx > view.clientWidth || cy > view.clientHeight)
        return true;
      const hit = doc.elementFromPoint(cx, cy);
      return !hit || el.contains(hit) || hit.contains(el);
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
  for (const size of SIZES)
    for (const entry of ENTRIES) {
      let m = await load(entry, size);
      // Re-measure anything that looks like a failure, in a fresh frame.
      // Layout probes in a headless browser are a little racy: a transient
      // caught mid-settle doesn't survive a second, independent measurement,
      // while a page that really overflows fails every time. So a failure has
      // to happen twice to be reported. That's the difference between a
      // checker that's trusted and one that's muted.
      //
      // A disclosure that never opened gets the same second chance, since a
      // single lost race among hundreds of checks would otherwise turn the
      // whole sweep red.
      if (m.scrollWidth > m.clientWidth || m.missing)
        m = await load(entry, size);
      results.push({ width: size[0], height: size[1], route: entry.label, ...m });
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
      // Each route × width settles on its own timers, so this budget scales
      // with ENTRIES.length × SIZES.length, and a missing button spends its
      // poll budget twice on every width. Running out fails silently: the
      // harness never prints its results, and the sweep reports "could not
      // read", which reads like a missing build or a missing Chrome rather
      // than a timeout. Raise it when the route list grows.
      "--virtual-time-budget=720000",
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
close();

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
  `\nSwept ${ENTRIES.length} routes × ${WIDTHS.length} widths and ${SIDEWAYS.length} sideways phones = ${results.length} checks.\n`,
);

// A disclosure whose button never turned up. Reported first and loudly,
// because the failure it guards against is silent: the frame would measure a
// closed page, pass, and claim to have swept a panel it never opened. A
// renamed button is exactly how that happens.
const missing = results.filter((r) => r.missing);
if (missing.length) {
  // Grouped with the widths, because "this route never opened" and "this route
  // never opened at 320px" are different bugs, and the first phrasing hides the
  // second. A disclosure that fails at every width is broken, and one that
  // fails at a single width is a layout or timing fault.
  const byRoute = new Map();
  for (const r of missing) {
    if (!byRoute.has(r.route)) byRoute.set(r.route, []);
    byRoute.get(r.route).push(sizeLabel(r));
  }
  console.log("Disclosures that never opened:");
  for (const [route, sizes] of byRoute)
    console.log(
      `  ✗ ${route} — no button matched at ${sizes.join(", ")}` +
        ` (${sizes.length} of ${SIZES.length} sizes)`,
    );
  console.log();
}

// Each route's page height at 390px, a common phone width: how far a phone
// has to scroll.
const phone = results.filter((r) => r.width === 390 && r.height === 900);
console.log("Page height at 390px (the scroll cost of an answer):");
for (const r of phone.sort((a, b) => b.scrollHeight - a.scrollHeight))
  console.log(`  ${String(r.scrollHeight).padStart(5)}px  ${r.route}`);

// WCAG 2.5.8, measured at the narrowest width, where targets are tightest.
const tooSmall = results
  .filter((r) => r.width === 320 && r.height === 900 && r.targets.length)
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

// The footer stays below the fold, at every width. A failure here is a page
// shorter than the screen that got past `<main>`'s minimum height.
const early = results.filter(
  (r) => r.footerTop != null && r.footerTop < r.viewHeight,
);

console.log("\nThe footer on the first screen:");
if (early.length === 0) {
  console.log("  No page shows its footer before you scroll. ✓");
} else {
  for (const r of early)
    console.log(
      `  ✗ ${r.route} @ ${sizeLabel(r)} — footer at ${r.footerTop}px on a ${r.viewHeight}px screen`,
    );
}

if (missing.length) {
  console.log(`\n── ${missing.length} unopened disclosure(s) ────────────\n`);
  process.exit(1);
}
if (overflow.length === 0 && tooSmall.length === 0 && early.length === 0) {
  console.log("\n── 0 horizontal overflow(s) ─────────────────");
  console.log("  No route scrolls sideways at any size. ✓\n");
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
    `  ✗ ${r.route} @ ${sizeLabel(r)} — scrollWidth ${r.scrollWidth} > ${r.clientWidth}`,
  );
  for (const o of r.offenders ?? [])
    console.log(`      <${o.tag}> "${o.cls}" right=${o.right} w=${o.width}`);
}
console.log();
process.exit(1);
