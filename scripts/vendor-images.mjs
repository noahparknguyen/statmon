#!/usr/bin/env node
/**
 * Statmon — image vendoring (docs/03_decisions D-002)
 * ---------------------------------------------------------------------------
 * Self-hosts both image types from the PokeAPI/sprites repo (CC0) instead of
 * hotlinking raw.githubusercontent at runtime:
 *   - pixel sprites → public/sprites/{id}.png   (kept as-is; ~1–3 KB each)
 *   - official art  → public/artwork/{id}.webp  (resized ≤475px, WebP)
 * The data file is only READ here. Asset paths are derived from each entry's id
 * by src/lib/pokemonCodec.js, so there is nothing to rewrite — build-data.mjs
 * already records which entries lack a pixel sprite or official artwork, and the
 * app's `spriteUrl ?? artworkUrl` fallback works off those flags.
 *
 * Good-citizen behaviour (mirrors build-data.mjs, D-016): rate-limited,
 * retrying with backoff, identifying User-Agent, and idempotent — files that
 * already exist are skipped, so re-runs only fetch what's missing.
 *
 * Run after build:data (once per data refresh):
 *   npm run vendor:images
 *   RPS=5 npm run vendor:images     # override the rate cap
 *
 * Sources are reconstructed from each entry's id, so this works whether the
 * data currently holds remote URLs or already-local paths.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { decodeAll } from "../src/lib/pokemonCodec.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

/* ------------------------------- CONFIG --------------------------------- */
const DATA_FILE = path.join(ROOT, "src", "data", "pokemon.json");
const SPRITES_DIR = path.join(ROOT, "public", "sprites");
const ARTWORK_DIR = path.join(ROOT, "public", "artwork");
const SPRITE_BASE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
const ARTWORK_BASE = `${SPRITE_BASE}/other/official-artwork`;
const ARTWORK_MAX = 475; // px, longest edge (D-002)
const WEBP_QUALITY = 82;
const REQUESTS_PER_SECOND = Number(process.env.RPS ?? 8);
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 8);
const MAX_RETRIES = 4;
const USER_AGENT =
  "statmon-image-vendor/1.0 (https://github.com/noahparknguyen/statmon)";

/* ----------------------------- UTILITIES -------------------------------- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Steady pacing: spaces the START of each request by 1000/rps ms. */
function makeRateGate(rps) {
  const interval = 1000 / rps;
  let next = 0;
  return async function gate() {
    const now = Date.now();
    const wait = Math.max(0, next - now);
    next = Math.max(now, next) + interval;
    if (wait) await sleep(wait);
  };
}
const gate = makeRateGate(REQUESTS_PER_SECOND);

/** Minimal concurrency limiter. */
function pLimit(max) {
  let active = 0;
  const queue = [];
  const drain = () => {
    if (active >= max || queue.length === 0) return;
    active++;
    const { fn, resolve, reject } = queue.shift();
    fn()
      .then(resolve, reject)
      .finally(() => {
        active--;
        drain();
      });
  };
  return (fn) =>
    new Promise((resolve, reject) => {
      queue.push({ fn, resolve, reject });
      drain();
    });
}

/** Rate-limited, retrying binary fetch → Buffer. */
async function fetchBuffer(url) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    await gate();
    try {
      const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES) await sleep(500 * 2 ** (attempt - 1));
    }
  }
  throw new Error(`Failed after ${MAX_RETRIES}: ${url} — ${lastErr?.message}`);
}

/** True if the entry has real official artwork rather than a pixel-sprite
 *  fallback — the decoder points artworkUrl at /sprites/ for the handful of
 *  entries PokéAPI has no official art for. */
const hasRealArtwork = (a) => typeof a === "string" && a.includes("/artwork/");

/* -------------------------------- MAIN ---------------------------------- */
async function main() {
  const started = Date.now();
  const entries = decodeAll(JSON.parse(await readFile(DATA_FILE, "utf8")));
  await mkdir(SPRITES_DIR, { recursive: true });
  await mkdir(ARTWORK_DIR, { recursive: true });

  const limit = pLimit(CONCURRENCY);
  let sprites = 0;
  let artwork = 0;
  let skipped = 0;
  const failures = [];
  const tasks = [];

  for (const e of entries) {
    const id = e.id;

    if (e.spriteUrl != null) {
      const target = path.join(SPRITES_DIR, `${id}.png`);
      if (existsSync(target)) {
        skipped++;
      } else {
        tasks.push(
          limit(async () => {
            try {
              await writeFile(
                target,
                await fetchBuffer(`${SPRITE_BASE}/${id}.png`),
              );
              sprites++;
            } catch (err) {
              failures.push(`sprite ${id}: ${err.message}`);
            }
          }),
        );
      }
    }

    if (hasRealArtwork(e.artworkUrl)) {
      const target = path.join(ARTWORK_DIR, `${id}.webp`);
      if (existsSync(target)) {
        skipped++;
      } else {
        tasks.push(
          limit(async () => {
            try {
              const buf = await fetchBuffer(`${ARTWORK_BASE}/${id}.png`);
              await sharp(buf)
                .resize(ARTWORK_MAX, ARTWORK_MAX, {
                  fit: "inside",
                  withoutEnlargement: true,
                })
                .webp({ quality: WEBP_QUALITY })
                .toFile(target);
              artwork++;
            } catch (err) {
              failures.push(`artwork ${id}: ${err.message}`);
            }
          }),
        );
      }
    }
  }

  console.log(
    `Vendoring — ${tasks.length} files to fetch, ${skipped} already present ` +
      `(${REQUESTS_PER_SECOND} req/s)…`,
  );
  await Promise.all(tasks);

  console.log(`\n── Summary ─────────────────────────────`);
  console.log(`Sprites downloaded : ${sprites}`);
  console.log(`Artwork downloaded : ${artwork}`);
  console.log(`Skipped (existing) : ${skipped}`);
  if (failures.length) {
    console.log(`\n⚠ ${failures.length} failure(s):`);
    for (const f of failures.slice(0, 20)) console.log(`  ${f}`);
    if (failures.length > 20)
      console.log(`  …and ${failures.length - 20} more`);
    process.exitCode = 1; // re-run to retry the missing files
  }
  console.log(`Done in ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

main().catch((err) => {
  console.error("\nVendor failed:", err);
  process.exit(1);
});
