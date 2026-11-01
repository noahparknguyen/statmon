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

import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { requireChrome } from "./chrome.mjs";
import { ROOT, DIST, serveBuild } from "./serve.mjs";

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
  ["/games/higher?stats=speed&n=4", 1600, 900, "docs/games.png"],
  // The hard tier, because it's the one with something to show: a Pokémon whose
  // typing is hidden and whose ability is the question. Random like the shot
  // above, for the same reason.
  ["/games/effective?tier=hard", 1600, 900, "docs/effective.png"],
];

// A phone's view of the three tools, in one 16:9 frame like the shots above,
// since the README is mostly read on a desktop, where one phone screen would
// be a strip down the middle of it. Each is captured at 390×844, an iPhone's
// size, at 2x, and fitted into the frame with the screen's own rounded corners.
// The same pages as the desktop shots, so the two can be compared.
const PHONE = {
  out: "docs/phone.png",
  routes: [
    "/compare/volcarona/vs/chandelure",
    "/dex",
    "/types/psychic/steel?as=bronzong",
  ],
};

// The two social frames must come out centred, and that's measured rather than
// trusted: a frame can be off-centre in the capture while rendering fine in a
// browser.
const CENTRED = new Set(["docs/preview.png", "public/og-image.png"]);
const CENTRE_TOLERANCE = 2; // px

/* ---- serve the built app, with /docs/ and /public/ from the repo ---- */
// The generator at /docs/og-image.html loads the fonts from ../public/fonts, so
// both prefixes come from the repo, and everything else is the built app.
const { origin, close } = await serveBuild({
  fromRepo: ["/docs/", "/public/"],
});

const CHROME = await requireChrome("shoot:docs");

const shoot = (url, width, height, out, scale = 1) =>
  new Promise((resolve, reject) => {
    const child = spawn(
      CHROME,
      [
        "--headless",
        "--disable-gpu",
        "--no-sandbox",
        "--hide-scrollbars",
        `--screenshot=${path.resolve(ROOT, out)}`,
        `--window-size=${width},${height}`,
        `--force-device-scale-factor=${scale}`,
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

// The phone frame: three screens on the page's own background, each with its
// corners rounded and a hairline round it, as a phone's screen would sit.
{
  const { default: sharp } = await import("sharp");
  const dir = await mkdtemp(path.join(tmpdir(), "statmon-docs-"));
  try {
    const [W, H, PAD, GAP, RADIUS] = [1600, 900, 40, 60, 28];
    const h = H - 2 * PAD;
    const w = Math.round((h * 390) / 844);
    const left = Math.round((W - (3 * w + 2 * GAP)) / 2);
    const corners = Buffer.from(
      `<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${RADIUS}"/></svg>`,
    );
    const layers = [];
    for (const [i, url] of PHONE.routes.entries()) {
      const file = path.join(dir, `${i}.png`);
      await shoot(url, 390, 844, file, 2);
      const screen = await sharp(file)
        .resize(w, h)
        .composite([{ input: corners, blend: "dest-in" }])
        .png()
        .toBuffer();
      layers.push({ input: screen, left: left + i * (w + GAP), top: PAD });
    }
    // The hairlines, drawn over the screens' edges: border-subtle on base.
    const frames = PHONE.routes
      .map(
        (_, i) =>
          `<rect x="${left + i * (w + GAP) + 0.5}" y="${PAD + 0.5}" width="${w - 1}" height="${h - 1}" rx="${RADIUS}" fill="none" stroke="#2a2e37"/>`,
      )
      .join("");
    layers.push({
      input: Buffer.from(`<svg width="${W}" height="${H}">${frames}</svg>`),
      left: 0,
      top: 0,
    });
    await sharp({
      create: { width: W, height: H, channels: 3, background: "#0b0c0f" },
    })
      .composite(layers)
      .png()
      .toFile(path.join(ROOT, PHONE.out));
    const { size } = await stat(path.join(ROOT, PHONE.out));
    console.log(
      `  ${PHONE.out.padEnd(22)} ${W}×${H}  ${(size / 1024).toFixed(0).padStart(4)} kB  three phones`,
    );
  } finally {
    await rm(dir, { recursive: true, force: true, maxRetries: 5 });
  }
}

close();

if (problems.length) {
  console.error(`\n── ${problems.length} problem(s) ──────────────`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}

console.log(`\n${SHOTS.length + 1} screenshots regenerated ✓`);
