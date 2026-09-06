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
 * Output: src/data/pokemon.json — written in the compact form defined by
 * src/lib/pokemonCodec.js (fields derivable from id/slug are omitted, roughly
 * a third the size), which src/lib/pokemon.js decodes at import. Entries are
 * built and validated below in their full shape; encoding happens only at the
 * final write, so the summary and checks stay readable.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { encodeAll, titleCase } from "../src/lib/pokemonCodec.js";
import { ABILITY_EFFECTS } from "../src/lib/abilities.js";
import { TYPES } from "../src/lib/types.js";
import {
  CHART,
  CHART_ERAS,
  chartAsOf,
  typeExistsIn,
} from "../src/lib/typeChart.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

/* ------------------------------- CONFIG --------------------------------- */
const API = "https://pokeapi.co/api/v2";
const REQUESTS_PER_SECOND = Number(process.env.RPS ?? 5);
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 6);
const MAX_RETRIES = 4;
const USER_AGENT =
  "statmon-data-build/1.0 (https://github.com/noahparknguyen/statmon)";
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
  x: 10,
};
const generationNumber = (name) => ROMAN[name.split("-")[1]] ?? null; // "generation-v" -> 5

const STAT_KEY = {
  hp: "hp",
  attack: "attack",
  defense: "defense",
  "special-attack": "spAtk",
  "special-defense": "spDef",
  speed: "speed",
  // Generation 1's single Special stat (PokéAPI stat id 9). It appears only in
  // `past_stats`, never in the current `stats` array. (D-045)
  special: "special",
};
function extractStats(p) {
  const out = {};
  for (const { base_stat, stat } of p.stats) {
    const key = STAT_KEY[stat.name];
    if (key && key !== "special") out[key] = base_stat;
  }
  return out;
}
const orderedTypes = (p) =>
  [...p.types].sort((a, b) => a.slot - b.slot).map((t) => t.type.name);

/* ------------------------------ ERA HELPERS ------------------------------
   PokéAPI's `past_stats` / `past_types` both use one rule: the `generation` on
   a record is the LAST generation those values applied in. We keep that
   `until` semantics rather than converting it, so the stored data reads the
   same as its source.

   Both extractors walk the records NEWEST-FIRST against a running "resolved"
   value that starts at today's. A record whose value already equals the
   resolved one is dropped: PokéAPI also emits a record when only the EV yield
   (`effort`) changed, and seven Pokémon — Blissey, Roselia, Yanma, Dusclops,
   Duskull, Misdreavus and Slowking — carry such a record with an identical base
   stat. Kept, they would offer the UI an era toggle that changes nothing.
   Comparing against the running value rather than against today's also keeps a
   record that restores an older value correctly. (D-045)
   ---------------------------------------------------------------------- */

const byUntilDesc = (a, b) => b.until - a.until;

function extractStatEras(p, currentStats) {
  const resolved = { ...currentStats };
  const eras = (p.past_stats ?? [])
    .map((e) => ({
      until: generationNumber(e.generation.name),
      stats: e.stats
        .map(({ base_stat, stat }) => [STAT_KEY[stat.name], base_stat])
        .filter(([key]) => key),
    }))
    .filter((e) => e.until)
    .sort(byUntilDesc);

  const out = [];
  for (const { until, stats } of eras) {
    const patch = {};
    for (const [key, value] of stats) {
      // `special` has no modern counterpart to be redundant with: it is the
      // stat Gen 1 had instead of the Sp. Atk / Sp. Def pair, so it is always
      // a real change of shape.
      if (key !== "special" && resolved[key] === value) continue;
      patch[key] = value;
      resolved[key] = value;
    }
    if (Object.keys(patch).length) out.push({ until, stats: patch });
  }
  return out.reverse(); // stored oldest-first
}

function extractTypeEras(p, currentTypes) {
  let resolved = currentTypes;
  const out = [];
  const eras = (p.past_types ?? [])
    .map((e) => ({
      until: generationNumber(e.generation.name),
      types: [...e.types]
        .sort((a, b) => a.slot - b.slot)
        .map((t) => t.type.name),
    }))
    .filter((e) => e.until)
    .sort(byUntilDesc);

  for (const { until, types } of eras) {
    if (sameTypes(types, resolved)) continue;
    out.push({ until, types });
    resolved = types;
  }
  return out.reverse();
}

/* ---------------------------- ABILITY HELPERS ----------------------------
   Same `until` rule again (D-073). Two things make abilities simpler than
   stats: the roster is small and slot-addressed, and across all 1,259 kept
   entries the hidden ability is always slot 3 and there is never more than one
   — so a roster is "slots 1–2, plus maybe slot 3".

   `past_abilities` spells an empty slot as `ability: null`, which is how it
   encodes an ability ARRIVING: 540 of the 568 records say "this Pokémon had no
   hidden ability through Gen N". Only 28 are genuine substitutions (Gengar's
   slot 1 was Levitate through Gen 6). Both are kept; the null ones are what
   stop a Gen 4 board offering a hidden ability that did not exist yet.
   ---------------------------------------------------------------------- */

const extractAbilities = (p) =>
  [...p.abilities]
    .sort((a, b) => a.slot - b.slot)
    .map((a) => ({ slug: a.ability.name, hidden: a.is_hidden }));

function extractAbilityEras(p, current) {
  // Slot → slug today, which the walk below rewinds from.
  const resolved = new Map();
  current.forEach((a, i) => resolved.set(a.hidden ? 3 : i + 1, a.slug));

  const eras = (p.past_abilities ?? [])
    .map((e) => ({
      until: generationNumber(e.generation.name),
      slots: e.abilities.map((a) => [a.slot, a.ability?.name ?? null]),
    }))
    .filter((e) => e.until)
    .sort(byUntilDesc);

  const out = [];
  for (const { until, slots } of eras) {
    const patch = {};
    for (const [slot, slug] of slots) {
      // Same no-op filter as the stat eras: a record that restates the value
      // already in force would become a UI control that changes nothing.
      if ((resolved.get(slot) ?? null) === slug) continue;
      patch[slot] = slug;
      resolved.set(slot, slug);
    }
    if (Object.keys(patch).length) out.push({ until, slots: patch });
  }
  return out.reverse(); // stored oldest-first
}

const sameStats = (a, b) =>
  ["hp", "attack", "defense", "spAtk", "spDef", "speed"].every(
    (k) => a[k] === b[k],
  );
const sameTypes = (a, b) =>
  a.length === b.length && a.every((t, i) => t === b[i]);

/* --------------------------- TYPE CHART CHECK ---------------------------
   The effectiveness chart is hardcoded canonical data (D-018) and its three
   historical eras with it (D-045). Hardcoded is not the same as unverified:
   this reads PokéAPI's `damage_relations` / `past_damage_relations` and asserts
   the shipped chart matches, cell for cell, so a typo in 18×18 of hand-written
   data is caught by the build rather than by a user.

   Comparisons are restricted to the types that existed in the era, since that
   is how the chart is read at runtime — Fire's modern row mentions Steel, but
   in Gen 1 that entry can never be reached.
   ---------------------------------------------------------------------- */

// PokéAPI's defending-side lists → our attacker-row shape.
function apiRow(relations) {
  const row = {};
  for (const t of relations.no_damage_to) row[t.name] = 0;
  for (const t of relations.half_damage_to) row[t.name] = 0.5;
  for (const t of relations.double_damage_to) row[t.name] = 2;
  return row;
}

const restrictRow = (row, gen) =>
  Object.entries(row)
    .filter(([def]) => typeExistsIn(def, gen))
    .sort()
    .map(([def, mult]) => `${def}:${mult}`)
    .join(" ");

async function verifyTypeChart(limit) {
  const byType = new Map(
    await Promise.all(
      TYPES.map((t) =>
        limit(async () => [t, await fetchJson(`${API}/type/${t}`)]),
      ),
    ),
  );
  const mismatches = [];
  // `null` is the current chart; each era is checked at its own last generation.
  for (const gen of [null, ...CHART_ERAS.map((e) => e.until)]) {
    const ours = chartAsOf(gen);
    for (const type of TYPES) {
      if (!typeExistsIn(type, gen)) continue;
      const api = byType.get(type);
      const past = (api.past_damage_relations ?? [])
        .map((p) => ({
          until: generationNumber(p.generation.name),
          relations: p.damage_relations,
        }))
        .sort((a, b) => a.until - b.until)
        .find((p) => gen != null && p.until >= gen);
      const theirs = apiRow(past ? past.relations : api.damage_relations);
      if (restrictRow(theirs, gen) !== restrictRow(ours[type] ?? {}, gen)) {
        mismatches.push(
          `${type} @ ${gen ?? "current"}: PokéAPI [${restrictRow(theirs, gen)}] vs ours [${restrictRow(ours[type] ?? {}, gen)}]`,
        );
      }
    }
  }
  return mismatches;
}

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

  // 1b) Version group → generation. Needed to date an alternate form: a form
  // record carries the version group it debuted in ("x-y"), not a generation.
  console.log(`Fetching version groups…`);
  const vgList = (await fetchJson(`${API}/version-group?limit=100`)).results;
  const vgGeneration = new Map(
    (await Promise.all(vgList.map((v) => limit(() => fetchJson(v.url))))).map(
      (vg) => [vg.name, generationNumber(vg.generation.name)],
    ),
  );

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
      const types = orderedTypes(p);
      const abilities = extractAbilities(p);
      entries.push({
        id: p.id,
        slug: p.name,
        name: titleCase(p.name),
        speciesSlug: sp.name,
        isDefault: p.is_default,
        generation,
        types,
        stats,
        bst: Object.values(stats).reduce((a, b) => a + b, 0),
        // Historical base stats and typings (D-045). Empty for the ~85% of
        // entries that never changed.
        statEras: extractStatEras(p, stats),
        typeEras: extractTypeEras(p, types),
        // The ability roster and its history (D-073). Empty for the 14 entries
        // that carry no abilities at all — every one of them a speculative Mega.
        abilities,
        abilityEras: extractAbilityEras(p, abilities),
        // Filled in below for alternate forms; a default form always debuts
        // with its species.
        introducedIn: generation,
        formUrl: p.is_default ? null : (p.forms?.[0]?.url ?? null),
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

  // 5) Date the alternate forms. An alt form's species generation is not its
  // own: Alolan Raichu is a Gen 1 species introduced in Gen 7, and Mega
  // Alakazam a Gen 1 species introduced in Gen 6. Without this an era selector
  // would offer Gen 1 for a form that did not exist yet. (D-045)
  const altForms = entries.filter((e) => e.formUrl);
  console.log(`\nDating ${altForms.length} alternate forms…`);
  const undated = [];
  await Promise.all(
    altForms.map((e) =>
      limit(async () => {
        const form = await fetchJson(e.formUrl);
        const gen = vgGeneration.get(form.version_group?.name);
        if (gen) e.introducedIn = gen;
        else undated.push(e.slug);
      }),
    ),
  );
  for (const e of entries) delete e.formUrl;

  // 6) Verify the hardcoded effectiveness chart and its eras against PokéAPI.
  console.log(`Verifying the type chart (${TYPES.length} types)…`);
  const chartMismatches = await verifyTypeChart(limit);

  // 6b) Verify as much of the ability effect table as is verifiable (D-073).
  // The MEANING of an entry cannot be checked — PokéAPI states Levitate's
  // effect as the prose "Evades Ground moves." and nowhere as data — but its
  // KEYS can be: every one has to be a real ability slug that some Pokémon in
  // the dex actually has. That catches a typo, a rename, and an ability written
  // down for a Pokémon this dataset does not carry, which is the failure mode a
  // hand-maintained table actually has. The semantics are guarded by
  // abilities.test.js instead. Hardcoded is still not the same as unverified.
  const rostered = new Set(
    entries.flatMap((e) => e.abilities.map((a) => a.slug)),
  );
  const unknownAbilities = Object.keys(ABILITY_EFFECTS).filter(
    (slug) => !rostered.has(slug),
  );

  entries.sort((a, b) => a.id - b.id);
  await writeFile(OUTPUT_FILE, JSON.stringify(encodeAll(entries)));

  /* ----------------------------- VALIDATION ---------------------------- */
  const missingStats = entries.filter((e) => Object.keys(e.stats).length !== 6);
  const missingArtwork = entries.filter((e) => !e.artworkUrl);
  const missingSprite = entries.filter((e) => !e.spriteUrl);
  const withForms = entries.filter((e) => e.forms.length > 1);
  const withStatEras = entries.filter((e) => e.statEras.length);
  const withTypeEras = entries.filter((e) => e.typeEras.length);
  const withGen1Special = entries.filter((e) =>
    e.statEras.some((era) => era.until === 1 && "special" in era.stats),
  );
  const redated = entries.filter((e) => e.introducedIn !== e.generation);
  const withAbilityEras = entries.filter((e) => e.abilityEras.length);
  const noAbilities = entries.filter((e) => !e.abilities.length);
  const typeAffecting = entries.filter((e) =>
    e.abilities.some((a) => a.slug in ABILITY_EFFECTS),
  );
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
  console.log(
    `Stat eras       : ${withStatEras.length} entries, ${withStatEras.reduce((n, e) => n + e.statEras.length, 0)} records (${withGen1Special.length} with a Gen 1 Special)`,
  );
  console.log(`Type eras       : ${withTypeEras.length} entries`);
  console.log(
    `Abilities       : ${rostered.size} distinct, ${withAbilityEras.length} entries with history, ${typeAffecting.length} that bend a matchup${noAbilities.length ? ` (${noAbilities.length} entries have none)` : ""}`,
  );
  console.log(
    `Ability table   : ${unknownAbilities.length ? `⚠ ${unknownAbilities.length} slug(s) no Pokémon has — ${unknownAbilities.join(", ")}` : `all ${Object.keys(ABILITY_EFFECTS).length} slugs are abilities in the dex ✓`}`,
  );
  console.log(
    `Forms re-dated  : ${redated.length}${undated.length ? ` ⚠ undated: ${undated.join(", ")}` : ""}`,
  );
  console.log(`Missing sprite  : ${missingSprite.length}`);
  console.log(`Missing artwork : ${missingArtwork.length}`);
  console.log(
    `⚠ Missing stats : ${missingStats.length}${missingStats.length ? " — " + missingStats.map((e) => e.slug).join(", ") : ""}`,
  );
  console.log(
    `Type chart      : ${chartMismatches.length ? `⚠ ${chartMismatches.length} mismatch(es)\n  ${chartMismatches.join("\n  ")}` : `matches PokéAPI across ${CHART_ERAS.length + 1} eras ✓ (${Object.keys(CHART).length} rows)`}`,
  );
  console.log(`Done in ${((Date.now() - started) / 1000).toFixed(1)}s`);

  if (
    missingStats.length ||
    chartMismatches.length ||
    unknownAbilities.length
  ) {
    // Fail loudly — every entry must have all six stats, the hardcoded chart
    // must agree with its source, and every ability the effect table names must
    // be one a Pokémon in this dex actually has.
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("\nBuild failed:", err);
  process.exit(1);
});
