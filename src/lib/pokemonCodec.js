// Encode/decode for the on-disk dataset format.
//
// `src/data/pokemon.json` ships inside the JS bundle, so its size is download
// size for every visitor. The stored rows therefore omit everything that can be
// rebuilt from `id` and `slug` — which was more than half the file:
//
//   name        always titlecase(slug)          (1259/1259)
//   bst         always sum(stats)               (1259/1259)
//   spriteUrl   always /sprites/{id}.png        (1256/1259, flagged otherwise)
//   artworkUrl  always /artwork/{id}.webp       (1257/1259, flagged otherwise)
//   forms       usually just [slug]             ( 845/1259, stored otherwise)
//   speciesSlug usually equals slug             ( 988/1259, stored otherwise)
//
// Keys are single letters and stats are a fixed-order array. Decoding happens
// once at import and produces the exact same objects the app used before, so no
// component or lib consumer changed. (D-036)
//
// Stored shape:
//   i  id                       s  slug            g  generation
//   t  [types]                  st [6 base stats, STAT_ORDER order]
//   p  speciesSlug   — only when it differs from slug
//   f  [form slugs]  — only when there is more than one
//   d  0            — present only for non-default forms
//   ns 1            — present only when there is no pixel sprite
//   na 1            — present only when there is no official artwork
//   se [stat eras]  — only for the 193 entries whose base stats ever changed
//   te [type eras]  — only for the 29 entries whose typing ever changed
//   in introducedIn — only when it differs from the species generation
//
// The three era fields are the D-045 addition. `se`/`te` store one record per
// change as [until, payload], where `until` is the LAST generation those values
// applied in — PokéAPI's own `past_stats` semantics, kept rather than converted
// so the stored data reads the same as its source. Stat keys are indices into
// ERA_STAT_KEYS, which is STAT_ORDER plus Gen 1's `special` at the end; the
// six-stat `st` array above is untouched by that extension.
//
// Explicit .js extension (unlike the rest of src/, which relies on Vite's
// resolver) because scripts/*.mjs import this module under plain Node ESM.
import { STAT_ORDER, SPECIAL } from "./stats.js";

// Index space for era stat patches only. Appending `special` here rather than
// to STAT_ORDER keeps the modern six — and every consumer that maps over them —
// exactly as they were. Module-private: it is an encoding detail, and the
// decoded objects hand consumers real stat keys.
const ERA_STAT_KEYS = [...STAT_ORDER, SPECIAL];

// Canonical slug → display-name derivation. Exported because the same rule has
// to hold in three places: the decoder, form-chip labels, and the build script.
export const titleCase = (slug) =>
  slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export function encodeEntry(e) {
  const row = {
    i: e.id,
    s: e.slug,
    g: e.generation,
    t: e.types,
    st: STAT_ORDER.map((k) => e.stats[k]),
  };
  if (e.speciesSlug !== e.slug) row.p = e.speciesSlug;
  if (e.forms.length > 1) row.f = e.forms;
  if (!e.isDefault) row.d = 0;
  if (e.spriteUrl == null) row.ns = 1;
  // "No official artwork" means artworkUrl fell back to the pixel sprite.
  if (e.artworkUrl !== `/artwork/${e.id}.webp`) row.na = 1;
  if (e.statEras?.length)
    row.se = e.statEras.map(({ until, stats }) => [
      until,
      Object.entries(stats).map(([k, v]) => [ERA_STAT_KEYS.indexOf(k), v]),
    ]);
  if (e.typeEras?.length)
    row.te = e.typeEras.map(({ until, types }) => [until, types]);
  if (e.introducedIn !== e.generation) row.in = e.introducedIn;
  return row;
}

export function decodeEntry(r) {
  const stats = {};
  STAT_ORDER.forEach((k, i) => (stats[k] = r.st[i]));
  const spriteUrl = r.ns ? null : `/sprites/${r.i}.png`;
  return {
    id: r.i,
    slug: r.s,
    name: titleCase(r.s),
    speciesSlug: r.p ?? r.s,
    isDefault: r.d !== 0,
    generation: r.g,
    types: r.t,
    stats,
    bst: r.st.reduce((a, b) => a + b, 0),
    forms: r.f ?? [r.s],
    spriteUrl,
    artworkUrl: r.na ? spriteUrl : `/artwork/${r.i}.webp`,
    // Decoded to empty arrays rather than left undefined, so every consumer can
    // map over them without a guard — the same reason `forms` always includes
    // self. Encoding drops them again, so the round trip is unaffected.
    statEras: (r.se ?? []).map(([until, patch]) => ({
      until,
      stats: Object.fromEntries(patch.map(([i, v]) => [ERA_STAT_KEYS[i], v])),
    })),
    typeEras: (r.te ?? []).map(([until, types]) => ({ until, types })),
    // The generation this exact entry first existed in. Equal to the species
    // generation for every default form, later for alt forms: Alolan Raichu is
    // a Gen 1 species introduced in Gen 7, and Mega Alakazam in Gen 6.
    introducedIn: r.in ?? r.g,
  };
}

export const encodeAll = (entries) => entries.map(encodeEntry);
export const decodeAll = (rows) => rows.map(decodeEntry);
