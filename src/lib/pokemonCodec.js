// Encoding and decoding for the dataset's stored format.
//
// `src/data/pokemon.json` ships inside the JavaScript bundle, so its size is
// download size for every visitor. The stored rows leave out everything that
// can be rebuilt from `id` and `slug`, more than half the file:
//
//   name        always titlecase(slug)          (1259/1259)
//   bst         always sum(stats)               (1259/1259)
//   spriteUrl   always /sprites/{id}.png        (1256/1259, flagged otherwise)
//   artworkUrl  always /artwork/{id}.webp       (1257/1259, flagged otherwise)
//   forms       usually just [slug]             ( 845/1259, stored otherwise)
//   speciesSlug usually equals slug             ( 988/1259, stored otherwise)
//
// Keys are single letters and stats are a fixed-order array. Decoding happens
// once, at import, and gives the full objects the rest of the app reads.
//
// Stored shape:
//   i  id                       s  slug            g  generation
//   t  [types]                  st [6 base stats, STAT_ORDER order]
//   p  speciesSlug   (only when it differs from slug)
//   f  [form slugs]  (only when there's more than one)
//   d  0             (only for non-default forms)
//   ns 1             (only when there's no pixel sprite)
//   na 1             (only when there's no official artwork)
//   se [stat eras]   (only for the 193 entries whose base stats ever changed)
//   te [type eras]   (only for the 29 entries whose typing ever changed)
//   in introducedIn  (only when it differs from the species generation)
//   ab [ability slugs]  the normal abilities, slots 1 and 2, in slot order
//   ah ability slug     the hidden ability (slot 3), when there is one
//   ae [ability eras]   (only for the 464 entries whose abilities ever changed)
//
// `se` and `te` store one record per change as [until, payload], where `until`
// is the last generation those values applied in. That's PokéAPI's own
// `past_stats` meaning, kept so the stored data reads the same as its source.
// Stat keys are indices into ERA_STAT_KEYS, which is STAT_ORDER with Gen 1's
// `special` added at the end. The six-stat `st` array doesn't use it.
//
// The ability fields follow the same `until` rule. `ab` and `ah` are separate
// rather than one list with a flag because the data allows it: in all 1,259
// entries the hidden ability is always slot 3, there's never more than one,
// and there are never more than two normal ones. Two flat fields carry the
// same information as slot tuples, and cost less.
//
// `ae` stores slot patches, [until, [[slot, slug], …]], where `0` means the
// slot was empty then. 540 of its 566 records are a single empty slot ("no
// hidden ability yet"), so patching is smaller than restating every list:
// 1.5 kB less, gzipped. `0` rather than `null` because it's one byte instead
// of four, on the field that occurs most.
//
// The import below names its .js extension, unlike the rest of src/, because
// scripts/*.mjs load this module under plain Node.
import { STAT_ORDER, SPECIAL } from "./stats.js";

// Index space for era stat patches only. Adding `special` here rather than to
// STAT_ORDER leaves the six stats, and everything that maps over them, as they
// are. Private to this module, because it's an encoding detail: the decoded
// objects use real stat keys.
const ERA_STAT_KEYS = [...STAT_ORDER, SPECIAL];

// The one rule for turning a slug into a display name. Exported because it has
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
  const normal = (e.abilities ?? []).filter((a) => !a.hidden);
  const hidden = (e.abilities ?? []).find((a) => a.hidden);
  if (normal.length) row.ab = normal.map((a) => a.slug);
  if (hidden) row.ah = hidden.slug;
  if (e.abilityEras?.length)
    row.ae = e.abilityEras.map(({ until, slots }) => [
      until,
      // Integer-like object keys enumerate in ascending order, so this is stable
      // without sorting, which the round-trip test relies on.
      Object.entries(slots).map(([slot, slug]) => [Number(slot), slug ?? 0]),
    ]);
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
    // Empty arrays rather than undefined, so every consumer can map over them
    // without a guard, as `forms` always includes the entry itself. Encoding
    // drops them again, so the round trip is unaffected.
    statEras: (r.se ?? []).map(([until, patch]) => ({
      until,
      stats: Object.fromEntries(patch.map(([i, v]) => [ERA_STAT_KEYS[i], v])),
    })),
    typeEras: (r.te ?? []).map(([until, types]) => ({ until, types })),
    // Slot order, normal then hidden: the order the chips are shown in, and the
    // order `defaultAbility` reads slot 1 from.
    abilities: [
      ...(r.ab ?? []).map((slug) => ({ slug, hidden: false })),
      ...(r.ah ? [{ slug: r.ah, hidden: true }] : []),
    ],
    abilityEras: (r.ae ?? []).map(([until, patch]) => ({
      until,
      slots: Object.fromEntries(
        patch.map(([slot, slug]) => [slot, slug || null]),
      ),
    })),
    // The generation this exact entry first existed in. Equal to the species
    // generation for every default form, later for alt forms: Alolan Raichu is
    // a Gen 1 species introduced in Gen 7, and Mega Alakazam in Gen 6.
    introducedIn: r.in ?? r.g,
  };
}

export const encodeAll = (entries) => entries.map(encodeEntry);
export const decodeAll = (rows) => rows.map(decodeEntry);
