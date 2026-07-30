#!/usr/bin/env node
/**
 * Statmon — PokéAPI build-time data pipeline (Phase 1)
 * ---------------------------------------------------------------------------
 * Fetches the full National Dex from PokéAPI ONCE and writes a slim local JSON
 * that the app serves directly — no runtime API calls (docs/03_decisions D-001).
 *
 * Good-citizen behaviour (D-016):
 *   - Rate-limited to REQUESTS_PER_SECOND (default 5) — gentle on PokéAPI's
 *     static host, which asks callers to keep request frequency low.
 *   - On-disk cache in .cache/pokeapi — re-runs are near-instant and hit the
 *     network zero times for already-seen URLs.
 *   - Retries with exponential backoff for transient failures.
 *   - Identifying User-Agent.
 *
 * Run once when adding a field/feature or when a new generation ships:
 *   npm run build:data           # 5 req/s
 *   RPS=3 npm run build:data      # override the rate cap
 *
 * Output: src/data/pokemon.json
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

/* ------------------------------- CONFIG --------------------------------- */
const API = "https://pokeapi.co/api/v2";
const REQUESTS_PER_SECOND = Number(process.env.RPS ?? 5);
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 6);
const MAX_RETRIES = 4;
const USER_AGENT = "statmon-data-build/0.1 (https://github.com/noahpn/statmon)";
const CACHE_DIR = path.join(ROOT, ".cache", "pokeapi");
const OUTPUT_FILE = path.join(ROOT, "src", "data", "pokemon.json");

/* ----------------------------- UTILITIES -------------------------------- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Steady request pacing: spaces the START of each request by 1000/rps ms,
 *  regardless of how many are scheduled concurrently. */
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

/** Cache-first, rate-limited, retrying JSON fetch. */
async function fetchJson(url) {
  const cacheFile = path.join(
    CACHE_DIR,
    createHash("sha1").update(url).digest("hex") + ".json",
  );
  if (existsSync(cacheFile)) {
    return JSON.parse(await readFile(cacheFile, "utf8"));
  }
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    await gate();
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      await writeFile(cacheFile, JSON.stringify(json));
      return json;
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES) {
        const backoff = 500 * 2 ** (attempt - 1);
        console.warn(
          `  retry ${attempt}/${MAX_RETRIES - 1} ${url} (${err.message})`,
        );
        await sleep(backoff);
      }
    }
  }
  throw new Error(
    `Failed after ${MAX_RETRIES} attempts: ${url} — ${lastErr?.message}`,
  );
}

/* --------------------------- TRANSFORM HELPERS -------------------------- */
const ROMAN = {
  i: 1,
  ii: 2,
  iii: 3,
  iv: 4,
  v: 5,
  vi: 6,
  vii: 7,
  viii: 8,
  ix: 9,
};
const generationNumber = (name) => ROMAN[name.split("-")[1]] ?? null; // "generation-v" -> 5

const formatName = (slug) =>
  slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const STAT_KEY = {
  hp: "hp",
  attack: "attack",
  defense: "defense",
  "special-attack": "spAtk",
  "special-defense": "spDef",
  speed: "speed",
};
function extractStats(p) {
  const out = {};
  for (const { base_stat, stat } of p.stats) {
    const key = STAT_KEY[stat.name];
    if (key) out[key] = base_stat;
  }
  return out;
}
const orderedTypes = (p) =>
  [...p.types].sort((a, b) => a.slot - b.slot).map((t) => t.type.name);

const sameStats = (a, b) =>
  ["hp", "attack", "defense", "spAtk", "spDef", "speed"].every(
    (k) => a[k] === b[k],
  );
const sameTypes = (a, b) =>
  a.length === b.length && a.every((t, i) => t === b[i]);

/* -------------------------------- MAIN ---------------------------------- */
async function main() {
  const started = Date.now();
  await mkdir(CACHE_DIR, { recursive: true });
  await mkdir(path.dirname(OUTPUT_FILE), { recursive: true });

  console.log(
    `Statmon data build — ${REQUESTS_PER_SECOND} req/s, cache: ${path.relative(ROOT, CACHE_DIR)}`,
  );

  // 1) Full species list (one request).
  const speciesList = (
    await fetchJson(`${API}/pokemon-species?limit=100000&offset=0`)
  ).results;
  console.log(`Species: ${speciesList.length}`);

  const limit = pLimit(CONCURRENCY);

  // 2) Species details (generation + varieties).
  console.log(`Fetching species details…`);
  const species = await Promise.all(
    speciesList.map((s) => limit(() => fetchJson(s.url))),
  );

  // 3) Every variety's /pokemon record (deduped).
  const varietyUrls = [
    ...new Set(species.flatMap((sp) => sp.varieties.map((v) => v.pokemon.url))),
  ];
  console.log(`Fetching ${varietyUrls.length} pokémon varieties…`);
  const pokemonByUrl = new Map();
  await Promise.all(
    varietyUrls.map((url) =>
      limit(async () => pokemonByUrl.set(url, await fetchJson(url))),
    ),
  );

  // 4) Build entries — one per kept variety; skip cosmetic forms.
  const entries = [];
  let skippedCosmetic = 0;

  for (const sp of species) {
    const generation = generationNumber(sp.generation.name);
    const defaultVariety =
      sp.varieties.find((v) => v.is_default) ?? sp.varieties[0];
    const defaultP = pokemonByUrl.get(defaultVariety.pokemon.url);
    const defStats = extractStats(defaultP);
    const defTypes = orderedTypes(defaultP);

    // A non-default variety is "cosmetic" (skip) only if BOTH its base stats
    // and its types match the default — keeps Megas/regionals/battle forms.
    const kept = sp.varieties
      .map((v) => pokemonByUrl.get(v.pokemon.url))
      .filter((p) => {
        if (p.is_default) return true;
        const cosmetic =
          sameStats(extractStats(p), defStats) &&
          sameTypes(orderedTypes(p), defTypes);
        if (cosmetic) skippedCosmetic++;
        return !cosmetic;
      });

    const formSlugs = kept.map((p) => p.name);

    for (const p of kept) {
      const stats = extractStats(p);
      entries.push({
        id: p.id,
        slug: p.name,
        name: formatName(p.name),
        speciesSlug: sp.name,
        isDefault: p.is_default,
        generation,
        types: orderedTypes(p),
        stats,
        bst: Object.values(stats).reduce((a, b) => a + b, 0),
        forms: formSlugs, // sibling variety slugs (incl. self); length > 1 => has alt forms
        // Local asset paths (self-hosted, D-002). Files are produced by
        // `npm run vendor:images`, which downloads/optimizes from PokeAPI/sprites.
        // Fallbacks preserved: no pixel sprite → null; no official artwork →
        // the pixel sprite (so `spriteUrl ?? artworkUrl` still resolves).
        spriteUrl: p.sprites?.front_default ? `/sprites/${p.id}.png` : null,
        artworkUrl: p.sprites?.other?.["official-artwork"]?.front_default
          ? `/artwork/${p.id}.webp`
          : p.sprites?.front_default
            ? `/sprites/${p.id}.png`
            : null,
      });
    }
  }

  entries.sort((a, b) => a.id - b.id);
  await writeFile(OUTPUT_FILE, JSON.stringify(entries));

  /* ----------------------------- VALIDATION ---------------------------- */
  const missingStats = entries.filter((e) => Object.keys(e.stats).length !== 6);
  const missingArtwork = entries.filter((e) => !e.artworkUrl);
  const missingSprite = entries.filter((e) => !e.spriteUrl);
  const withForms = entries.filter((e) => e.forms.length > 1);
  const byGen = entries.reduce(
    (m, e) => ((m[e.generation] = (m[e.generation] ?? 0) + 1), m),
    {},
  );

  console.log(`\n── Summary ─────────────────────────────`);
  console.log(
    `Entries written : ${entries.length}  → ${path.relative(ROOT, OUTPUT_FILE)}`,
  );
  console.log(`Cosmetic skipped: ${skippedCosmetic}`);
  console.log(`Entries w/ alt forms (Mega/regional/etc.): ${withForms.length}`);
  console.log(`By generation   : ${JSON.stringify(byGen)}`);
  console.log(`Missing sprite  : ${missingSprite.length}`);
  console.log(`Missing artwork : ${missingArtwork.length}`);
  console.log(
    `⚠ Missing stats : ${missingStats.length}${missingStats.length ? " — " + missingStats.map((e) => e.slug).join(", ") : ""}`,
  );
  console.log(`Done in ${((Date.now() - started) / 1000).toFixed(1)}s`);

  if (missingStats.length) {
    process.exitCode = 1; // fail loudly — every entry must have all six stats
  }
}

main().catch((err) => {
  console.error("\nBuild failed:", err);
  process.exit(1);
});
