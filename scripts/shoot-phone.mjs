#!/usr/bin/env node
/**
 * Statmon: phone screenshots
 * ---------------------------------------------------------------------------
 * Photographs every route as a phone shows it, a screen at a time, and joins
 * each page's screens side by side into one image, for reviewing phone layouts
 * by eye. It checks nothing: `sweep:widths` is the check. This is for the
 * questions a measurement can't answer, like whether a page reads well.
 *
 * A screen at a time, because a full-page capture needs a window as tall as the
 * page. That changes every height written in viewport units, so Home's sprite
 * wall and the game boards would come out the wrong size. Each screen starts
 * where the last one ended, below whatever stays pinned to the top or bottom,
 * so nothing hides behind a sticky bar at a join.
 *
 * Each page loads as it would on a phone, over the DevTools protocol. It gets a
 * touch screen, so `hover` and `pointer` media queries answer as a phone's do,
 * and 2x pixel density. Reduced motion is on, so the bars and the games' clash
 * are photographed finished rather than halfway.
 *
 * The routes are `routes.mjs`, the same list the sweep measures. The games
 * draw their rounds at random, so their shots differ on every run.
 *
 *   npm run build && npm run shoot:phone
 *   npm run shoot:phone -- --only /compare --screens 6
 *   npm run shoot:phone -- --out shots/before --sizes 390x844
 *
 * Writes `<out>/<width>x<height>/<route>.png`, overwriting what is there, into
 * `shots/phone` by default. `shots/` is ignored by git.
 */

import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
import sharp from "sharp";
import { requireChrome } from "./chrome.mjs";
import { ROOT, DIST, serveBuild } from "./serve.mjs";
import { ENTRIES } from "./routes.mjs";

const { values: args } = parseArgs({
  options: {
    out: { type: "string", default: "shots/phone" },
    // 390x844 is an iPhone 12 to 14, and 360x780 a common narrow Android size.
    sizes: { type: "string", default: "390x844,360x780" },
    only: { type: "string" },
    screens: { type: "string", default: "4" },
  },
});

const SIZES = args.sizes.split(",").map((s) => {
  const m = /^(\d+)x(\d+)$/.exec(s.trim());
  if (!m) {
    console.error(`--sizes takes WIDTHxHEIGHT pairs, like 390x844, not "${s}"`);
    process.exit(1);
  }
  return { width: Number(m[1]), height: Number(m[2]) };
});
const MAX_SCREENS = Number(args.screens);
const OUT = path.resolve(ROOT, args.out);
const entries = ENTRIES.filter(
  (e) => !args.only || e.label.includes(args.only),
);

try {
  await readFile(path.join(DIST, "index.html"));
} catch {
  console.error("dist/ is missing — run `npm run build` first.");
  process.exit(1);
}
if (!entries.length) {
  console.error(`No route matches --only "${args.only}".`);
  process.exit(1);
}

/* ---- the page side: these run in the browser, not in Node ---- */
/* global document, getComputedStyle, innerHeight, requestAnimationFrame, scrollTo, scrollY */

// Ready means the page has replaced the app's loading shell, the fonts have
// arrived, and the height has held still for three readings in a row. A lazily
// loaded page renders after the load event, and a late webfont changes every
// line's height.
async function pageReady() {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  let prev = -1;
  let same = 0;
  for (let i = 0; i < 60 && same < 2; i++) {
    await wait(150);
    const main = document.querySelector("main#main");
    const h = document.documentElement.scrollHeight;
    const ready =
      main?.childElementCount > 0 && document.fonts.status === "loaded";
    same = ready && h === prev ? same + 1 : 0;
    prev = h;
  }
  return same >= 2;
}

// Clicks the button whose text starts with `label`, waiting for it to appear,
// since the page may still be arriving. False if it never does.
async function openPanel(label) {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let i = 0; i < 40; i++) {
    const button = [...document.querySelectorAll("button")].find((b) =>
      (b.textContent ?? "").trim().startsWith(label),
    );
    if (button) {
      button.click();
      await wait(300);
      return true;
    }
    await wait(100);
  }
  return false;
}

// How much of the screen is covered by things pinned to its top and bottom
// edges at this scroll position: the site header, and a sticky row of column
// headers once it has stuck. A sticky element still in the flow is content.
// Anything taller than a third of the screen is an overlay, not a bar.
function chromeInsets() {
  const vh = innerHeight;
  let top = 0;
  let bottom = 0;
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el);
    if (cs.position !== "fixed" && cs.position !== "sticky") continue;
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    if (r.height === 0 || r.height > vh / 3 || r.bottom <= 0 || r.top >= vh)
      continue;
    const fixed = cs.position === "fixed";
    if (fixed ? r.top < vh / 2 : Math.abs(r.top - parseFloat(cs.top)) < 1)
      top = Math.max(top, r.bottom);
    else if (fixed || Math.abs(vh - r.bottom - parseFloat(cs.bottom)) < 1)
      bottom = Math.max(bottom, vh - r.top);
  }
  return { top: Math.round(top), bottom: Math.round(bottom) };
}

// Scrolls, lets two frames paint, and waits for the images now on screen,
// since the ones below the fold load lazily as they arrive.
async function showAt(y) {
  scrollTo(0, y);
  await new Promise((r) =>
    requestAnimationFrame(() => requestAnimationFrame(r)),
  );
  const onScreen = () =>
    [...document.images].filter((img) => {
      const r = img.getBoundingClientRect();
      return r.width > 0 && r.bottom > 0 && r.top < innerHeight;
    });
  const deadline = Date.now() + 3000;
  while (Date.now() < deadline && !onScreen().every((img) => img.complete))
    await new Promise((r) => setTimeout(r, 100));
  return {
    y: scrollY,
    scrollHeight: document.documentElement.scrollHeight,
    ...chromeInsets(),
  };
}

const PAGE = [pageReady, openPanel, chromeInsets, showAt].join("\n");

/* ---- the Node side: a headless Chrome, driven over its DevTools socket ---- */

const CHROME = await requireChrome("shoot:phone");
const profile = await mkdtemp(path.join(tmpdir(), "statmon-phone-"));
const chrome = spawn(
  CHROME,
  [
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--hide-scrollbars",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    "about:blank",
  ],
  { stdio: ["ignore", "ignore", "pipe"] },
);

// Chrome prints the socket's address on stderr once it's listening.
const socketUrl = await new Promise((resolve, reject) => {
  let log = "";
  const timer = setTimeout(
    () => reject(new Error(`Chrome never opened its DevTools socket:\n${log}`)),
    15000,
  );
  chrome.stderr.on("data", (d) => {
    log += d;
    const m = /ws:\/\/\S+/.exec(log);
    if (m) {
      clearTimeout(timer);
      resolve(m[0]);
    }
  });
  chrome.on("error", reject);
});

const socket = new WebSocket(socketUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

// The protocol is JSON messages matched by id. Events arrive on the same
// socket without one, and nothing here needs them, so they're dropped.
let lastId = 0;
const pending = new Map();
socket.addEventListener("message", (e) => {
  const msg = JSON.parse(e.data);
  const call = pending.get(msg.id);
  if (!call) return;
  pending.delete(msg.id);
  if (msg.error) call.reject(new Error(`${call.method}: ${msg.error.message}`));
  else call.resolve(msg.result);
});
const send = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    const id = ++lastId;
    pending.set(id, { resolve, reject, method });
    socket.send(JSON.stringify({ id, method, params, sessionId }));
  });

const { origin, close } = await serveBuild();

// Joins a page's screens left to right, on a grey that shows where each
// screen's edge is against the site's near-black.
async function joinScreens(screens, file) {
  const meta = await sharp(screens[0]).metadata();
  const gap = 24;
  await sharp({
    create: {
      width: screens.length * (meta.width + gap) - gap,
      height: meta.height,
      channels: 3,
      background: "#5c6170",
    },
  })
    .composite(
      screens.map((input, i) => ({
        input,
        left: i * (meta.width + gap),
        top: 0,
      })),
    )
    .png()
    .toFile(file);
}

async function shoot(entry, { width, height }) {
  const { targetId } = await send("Target.createTarget", {
    url: "about:blank",
  });
  const { sessionId } = await send("Target.attachToTarget", {
    targetId,
    flatten: true,
  });
  const page = (method, params) => send(method, params, sessionId);
  const run = async (call) => {
    const { result, exceptionDetails } = await page("Runtime.evaluate", {
      expression: `(() => { ${PAGE}\n return ${call}; })()`,
      awaitPromise: true,
      returnByValue: true,
    });
    if (exceptionDetails)
      throw new Error(
        exceptionDetails.exception?.description ?? exceptionDetails.text,
      );
    return result.value;
  };

  try {
    await page("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await page("Emulation.setTouchEmulationEnabled", {
      enabled: true,
      maxTouchPoints: 5,
    });
    await page("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
    await page("Page.navigate", { url: origin + entry.route });

    const problems = [];
    if (!(await run("pageReady()"))) problems.push("never settled");
    if (entry.open) {
      if (!(await run(`openPanel(${JSON.stringify(entry.open)})`))) {
        return { problems: [`no "${entry.open}" button to open`] };
      }
      await run("pageReady()");
    }

    // Each screen starts where the one before stopped being visible, measured
    // under the next screen's own top bar, since a sticky header row may only
    // stick once the page has scrolled.
    const screens = [];
    let view = await run("showAt(0)");
    let atEnd = false;
    for (;;) {
      const { data } = await page("Page.captureScreenshot", { format: "png" });
      screens.push(Buffer.from(data, "base64"));
      atEnd = view.y + height >= view.scrollHeight - 1;
      if (atEnd || screens.length === MAX_SCREENS) break;
      const seenTo = view.y + height - view.bottom;
      const probe = await run(`showAt(${seenTo - view.top})`);
      const next = Math.max(
        view.y + Math.round(height / 4),
        seenTo - probe.top,
      );
      view = await run(`showAt(${next})`);
    }

    const dir = path.join(OUT, `${width}x${height}`);
    await mkdir(dir, { recursive: true });
    const slug =
      entry.label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "home";
    await joinScreens(screens, path.join(dir, `${slug}.png`));

    return {
      problems,
      scrollHeight: view.scrollHeight,
      shot: screens.length,
      // How far down the screens reached, when the page is longer than
      // --screens allows: a count of screens left would assume each one moves
      // a full screen, and under a sticky bar none does.
      reached: atEnd ? null : view.y + height,
    };
  } finally {
    await send("Target.closeTarget", { targetId });
  }
}

const failures = [];
try {
  for (const size of SIZES) {
    console.log(`\n${size.width}x${size.height}`);
    for (const entry of entries) {
      const r = await shoot(entry, size);
      for (const p of r.problems)
        failures.push(`${entry.label} @ ${size.width}px: ${p}`);
      if (r.shot === undefined) {
        console.log(`  ✗ ${entry.label}: ${r.problems.join(", ")}`);
        continue;
      }
      const screens =
        `${r.shot} screen${r.shot === 1 ? "" : "s"}` +
        (r.reached ? `, to ${r.reached}px` : "");
      console.log(
        `  ${String(r.scrollHeight).padStart(6)}px tall  ${screens.padEnd(22)}${entry.label}`,
      );
    }
  }
} finally {
  socket.close();
  close();
  // Chrome keeps writing to its profile for a moment after it's told to stop,
  // so the folder is removed only once it has exited.
  if (chrome.exitCode === null && chrome.signalCode === null) {
    const exited = new Promise((r) => chrome.once("exit", r));
    chrome.kill();
    await exited;
  }
  await rm(profile, { recursive: true, force: true });
}

console.log(`\nWrote to ${path.relative(ROOT, OUT) || "."}/`);
if (failures.length) {
  console.error(`\n── ${failures.length} problem(s) ──────────────`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
