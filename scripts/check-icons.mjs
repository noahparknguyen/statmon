#!/usr/bin/env node
/**
 * Statmon: icon check
 * ---------------------------------------------------------------------------
 * Checks the favicons, which nothing else opens. A broken one looks fine in the
 * repo and wrong only in a tab, a search result, or on a home screen.
 *   - public/favicon.svg sets a width and height, and uses only colour tokens
 *     from src/index.css.
 *   - index.html links the .ico as 32x32 and the SVG as the only other icon,
 *     and every icon file it or the manifest names exists.
 *   - Every raster is the size it claims, and its drawing is centred and fills
 *     the square. The apple-touch icon has no transparent pixels.
 *
 * `npm run build:icons` redraws the rasters from the SVG.
 *
 *   npm run check:icons
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file, encoding) => readFileSync(path.join(ROOT, file), encoding);
const problems = [];
const notes = [];

// An attribute's value. The leading space keeps `width` from matching
// `stroke-width`.
const attr = (tag, name) =>
  tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1] ?? null;

async function decodePng(buf) {
  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, rgba: data };
}

// Each entry of an .ico: a PNG, or a 32-bit bitmap stored bottom-up in BGRA.
async function decodeIco(buf) {
  const entries = [];
  for (let i = 0; i < buf.readUInt16LE(4); i++) {
    const size = buf.readUInt32LE(6 + 16 * i + 8);
    const offset = buf.readUInt32LE(6 + 16 * i + 12);
    const data = buf.subarray(offset, offset + size);
    if (data.readUInt32BE(0) === 0x89504e47) {
      entries.push(await decodePng(data));
      continue;
    }
    const width = data.readInt32LE(4);
    const height = data.readInt32LE(8) / 2;
    if (data.readUInt16LE(14) !== 32) {
      throw new Error(`unsupported .ico entry (${data.readUInt16LE(14)}-bit)`);
    }
    const rgba = Buffer.alloc(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const from = 40 + ((height - 1 - y) * width + x) * 4;
        const to = (y * width + x) * 4;
        rgba[to] = data[from + 2];
        rgba[to + 1] = data[from + 1];
        rgba[to + 2] = data[from];
        rgba[to + 3] = data[from + 3];
      }
    }
    entries.push({ width, height, rgba });
  }
  return entries;
}

// The drawing's margins: how far its mostly opaque pixels sit from each edge.
function margins({ width, height, rgba }) {
  let left = width;
  let right = -1;
  let top = height;
  let bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (rgba[(y * width + x) * 4 + 3] < 128) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  return { left, right: width - 1 - right, top, bottom: height - 1 - bottom };
}

// A raster is the size it claims, its drawing is centred to within a pixel and
// spans at least three quarters of the square, and, where asked, it is opaque.
function checkRaster(name, image, size, { opaque = false } = {}) {
  if (image.width !== size || image.height !== size) {
    problems.push(
      `${name} is ${image.width}x${image.height}, not ${size}x${size}`,
    );
    return;
  }
  const m = margins(image);
  const spanX = size - m.left - m.right;
  const spanY = size - m.top - m.bottom;
  if (spanX < size * 0.75 || spanY < size * 0.75) {
    problems.push(
      `${name}'s drawing fills only ${spanX}x${spanY} of its ${size}x${size}`,
    );
  }
  if (Math.abs(m.left - m.right) > 1 || Math.abs(m.top - m.bottom) > 1) {
    problems.push(
      `${name}'s drawing is off centre (margins ${m.left} left, ${m.right} right, ` +
        `${m.top} top, ${m.bottom} bottom)`,
    );
  }
  if (opaque) {
    for (let i = 3; i < image.rgba.length; i += 4) {
      if (image.rgba[i] < 255) {
        problems.push(
          `${name} has transparent pixels, which iOS shows as black`,
        );
        break;
      }
    }
  }
}

// --- The SVG: sized, and drawn in the palette.
const svg = read("public/favicon.svg", "utf8");
const root = svg.match(/<svg\b[^>]*>/)[0];
const [, , boxWidth, boxHeight] = (attr(root, "viewBox") ?? "")
  .trim()
  .split(/[\s,]+/);
if (attr(root, "width") !== boxWidth || attr(root, "height") !== boxHeight) {
  problems.push(
    `public/favicon.svg needs a width and height equal to its viewBox's ` +
      `(${boxWidth} by ${boxHeight}). Without them, an image converter draws it ` +
      `at 300x150 and pads it into a square.`,
  );
}
const tokens = new Map();
for (const m of read("src/index.css", "utf8").matchAll(
  /--color-([a-z0-9-]+)\s*:\s*(#[0-9a-f]{6})\b/gi,
)) {
  const hex = m[2].toLowerCase();
  if (!tokens.has(hex)) tokens.set(hex, m[1]);
}
const colours = [
  ...new Set(
    [...svg.matchAll(/#[0-9a-f]{6}\b/gi)].map((m) => m[0].toLowerCase()),
  ),
];
for (const hex of colours) {
  if (!tokens.has(hex)) {
    problems.push(
      `public/favicon.svg uses ${hex}, which isn't a colour token in src/index.css`,
    );
  }
}
if (/gradient/i.test(svg)) {
  problems.push(
    "public/favicon.svg has a gradient. The flame gradient is for the BST delta and the speed banner only",
  );
}
notes.push(
  `favicon.svg's colours are tokens: ${colours.map((h) => tokens.get(h) ?? h).join(", ")}`,
);

// --- index.html: the two icons, and every linked file present.
const links = [...read("index.html", "utf8").matchAll(/<link\b[^>]*>/g)].map(
  (m) => m[0],
);
const rels = (link) => (attr(link, "rel") ?? "").split(/\s+/);
const icons = links.filter((l) => rels(l).includes("icon"));
const icoLink = icons.find((l) => attr(l, "href")?.endsWith(".ico"));
const svgLink = icons.find((l) => attr(l, "type") === "image/svg+xml");
if (
  icons.length !== 2 ||
  !svgLink ||
  attr(icoLink ?? "", "sizes") !== "32x32"
) {
  problems.push(
    `index.html should link two icons: the .ico with sizes="32x32" and the SVG. ` +
      `Otherwise Chrome can draw the .ico instead of the SVG.`,
  );
}
const linked = (rel) =>
  links.filter((l) => rels(l).includes(rel)).map((l) => attr(l, "href"));
const file = (href) => path.join("public", href);
const exists = (href) => existsSync(path.join(ROOT, file(href)));
for (const href of [
  ...linked("icon"),
  ...linked("apple-touch-icon"),
  ...linked("manifest"),
]) {
  if (!exists(href))
    problems.push(`index.html links ${href}, which isn't in public/`);
}

// --- Every raster.
let checked = 0;
if (icoLink && exists(attr(icoLink, "href"))) {
  const entries = await decodeIco(read(file(attr(icoLink, "href"))));
  if (!entries.some((e) => e.width === 32)) {
    problems.push("favicon.ico has no 32x32 entry");
  }
  for (const e of entries) {
    checkRaster(`favicon.ico's ${e.width}x${e.height}`, e, e.width);
    checked++;
  }
}
for (const href of linked("apple-touch-icon")) {
  if (!exists(href)) continue;
  checkRaster(href.slice(1), await decodePng(read(file(href))), 180, {
    opaque: true,
  });
  checked++;
}
for (const href of linked("manifest")) {
  if (!exists(href)) continue;
  for (const icon of JSON.parse(read(file(href), "utf8")).icons ?? []) {
    if (!exists(icon.src)) {
      problems.push(
        `${href.slice(1)} names ${icon.src}, which isn't in public/`,
      );
      continue;
    }
    const size = Number(icon.sizes.split("x")[0]);
    checkRaster(icon.src.slice(1), await decodePng(read(file(icon.src))), size);
    checked++;
  }
}
notes.push(`checked ${checked} raster icons for size, centring, and fill`);

for (const n of notes) console.log(`  ok  ${n}`);
if (problems.length) {
  console.error(`\n  ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  ✗  ${p}`);
  process.exit(1);
}
console.log("\n  every icon checks out");
