#!/usr/bin/env node
/**
 * Statmon: draw the raster icons
 * ---------------------------------------------------------------------------
 * Draws every raster icon from public/favicon.svg: the .ico browsers fall
 * back to, the apple-touch icon, and the manifest's two. Each is drawn from the
 * vector at its own size rather than scaled from another, with sharp, which
 * vendor-images.mjs already uses.
 *
 * Run it after changing the SVG, then `npm run check:icons`.
 *
 *   npm run build:icons
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");
const SVG = await readFile(path.join(PUBLIC, "favicon.svg"));

// The SVG's own size, so a density can scale it to any other.
const VIEWBOX = Number(SVG.toString().match(/\swidth="(\d+)"/)[1]);

// The page background. iOS shows a transparent pixel as black, so the
// home-screen icon is the ball on the site's own base, with 20px around it
// that iOS's rounded corners can't clip.
const BASE = (
  await readFile(path.join(ROOT, "src", "index.css"), "utf8")
).match(/--color-neutral-950:\s*(#[0-9a-f]{6})/i)[1];

// Browsers pick a size from the .ico. The 32 is what `sizes="32x32"` in
// index.html promises, and the 16 is drawn for screens at 100%.
const ICO_SIZES = [16, 32];

// The SVG drawn at `size` pixels, as a sharp pipeline.
function draw(size) {
  return sharp(SVG, { density: (72 * size) / VIEWBOX });
}

// An .ico of 32-bit bitmaps, the format every favicon reader takes. Each entry
// is its colour rows bottom-up in BGRA, then a 1-bit mask (set where a pixel is
// fully transparent) for readers that ignore alpha.
function ico(images) {
  const entries = images.map(({ size, rgba }) => {
    const header = Buffer.alloc(40);
    header.writeUInt32LE(40, 0);
    header.writeInt32LE(size, 4);
    header.writeInt32LE(size * 2, 8); // the colour rows and the mask, stacked
    header.writeUInt16LE(1, 12);
    header.writeUInt16LE(32, 14);
    const pixels = Buffer.alloc(size * size * 4);
    const maskRow = Math.ceil(size / 32) * 4;
    const mask = Buffer.alloc(maskRow * size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const from = (y * size + x) * 4;
        const row = size - 1 - y;
        const to = (row * size + x) * 4;
        pixels[to] = rgba[from + 2];
        pixels[to + 1] = rgba[from + 1];
        pixels[to + 2] = rgba[from];
        pixels[to + 3] = rgba[from + 3];
        if (rgba[from + 3] === 0) {
          mask[row * maskRow + (x >> 3)] |= 0x80 >> (x & 7);
        }
      }
    }
    return Buffer.concat([header, pixels, mask]);
  });
  const dir = Buffer.alloc(6 + 16 * images.length);
  dir.writeUInt16LE(1, 2); // type 1: an icon
  dir.writeUInt16LE(images.length, 4);
  let offset = dir.length;
  images.forEach(({ size }, i) => {
    const at = 6 + 16 * i;
    dir[at] = size;
    dir[at + 1] = size;
    dir.writeUInt16LE(1, at + 4); // colour planes
    dir.writeUInt16LE(32, at + 6); // bits per pixel
    dir.writeUInt32LE(entries[i].length, at + 8);
    dir.writeUInt32LE(offset, at + 12);
    offset += entries[i].length;
  });
  return Buffer.concat([dir, ...entries]);
}

async function write(file, buffer, size) {
  await writeFile(path.join(PUBLIC, file), buffer);
  console.log(`  wrote public/${file} — ${size}`);
}

const touch = await sharp({
  create: { width: 180, height: 180, channels: 4, background: BASE },
})
  .composite([{ input: await draw(140).png().toBuffer(), top: 20, left: 20 }])
  .png()
  .toBuffer();
await write("apple-touch-icon.png", touch, "180x180");

for (const size of [192, 512]) {
  const png = await draw(size).png().toBuffer();
  await write(`android-chrome-${size}x${size}.png`, png, `${size}x${size}`);
}

const frames = [];
for (const size of ICO_SIZES) {
  const { data, info } = await draw(size)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (info.width !== size || info.height !== size) {
    throw new Error(`drew ${info.width}x${info.height} for ${size}x${size}`);
  }
  frames.push({ size, rgba: data });
}
await write("favicon.ico", ico(frames), ICO_SIZES.join(", "));
