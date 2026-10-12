// Access to and search over the local dataset, which scripts/build-data.mjs
// generates.
//
// The JSON ships in a compact form (see pokemonCodec for why, and for the field
// map). It's decoded once, here, at import, so everything else sees full
// objects.
import { decodeAll, titleCase } from "./pokemonCodec";
import ROWS from "../data/pokemon.json";

const DATA = decodeAll(ROWS);

export const ALL_POKEMON = DATA;

const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// The pixel sprite for search rows, falling back to artwork for the three
// entries that have no pixel sprite: pikachu-starter, eevee-starter, and
// zygarde-mega.
export const spriteFor = (p) => p.spriteUrl ?? p.artworkUrl;
export const artworkFor = (p) => p.artworkUrl ?? p.spriteUrl;

// Indexed rather than searched: the dex table looks up a form group for each of
// its 1,259 rows on every sort, which would be about 1.5 million comparisons as
// a .find(). Built once at import, alongside the decode.
const BY_SLUG = new Map(DATA.map((p) => [p.slug, p]));

export const getBySlug = (slug) => BY_SLUG.get(slug);

// A Pokémon's selectable forms (its base form, Megas, regional forms, and battle
// forms), from its `forms` slug list, with the base form first.
export function formsOf(pokemon) {
  return pokemon.forms
    .map(getBySlug)
    .filter(Boolean)
    .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
}

// A short chip label for a form: "Base" for the default, otherwise what follows
// the species name ("charizard-mega-x" gives "Mega X").
export function formLabel(form) {
  if (form.isDefault) return "Base";
  const prefix = form.speciesSlug + "-";
  const rest = form.slug.startsWith(prefix)
    ? form.slug.slice(prefix.length)
    : form.slug;
  return titleCase(rest);
}

// Search as you type: names that start with the query rank above names that
// only contain it.
export function searchPokemon(query, limit = 8) {
  const q = normalize(query);
  if (!q) return [];
  const prefix = [];
  const contains = [];
  for (const p of DATA) {
    const name = normalize(p.name);
    const slug = normalize(p.slug);
    if (name.startsWith(q) || slug.startsWith(q)) prefix.push(p);
    else if (name.includes(q) || slug.includes(q)) contains.push(p);
  }
  return [...prefix, ...contains].slice(0, limit);
}
