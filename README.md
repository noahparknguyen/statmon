# Statmon

A simple set of Pokémon tools, built for myself. Three so far — and each of them can be read **as of any generation**:

- **[Compare](https://statmon.noahparknguyen.workers.dev/compare)** — two Pokémon's base stats head to head, with the type matchup and a straight answer about who moves first.
- **[Dex](https://statmon.noahparknguyen.workers.dev/dex)** — all 1,259 entries in one table, sortable by any stat and filterable by type and generation.
- **[Types](https://statmon.noahparknguyen.workers.dev/types)** — the full effectiveness chart, and a dual-type readout on the same page.

**Live at [statmon.noahparknguyen.workers.dev](https://statmon.noahparknguyen.workers.dev/).**

![Statmon's home page: a live Volcarona vs Chandelure comparison board](docs/home.png)

## Why

Sometimes I go on a nostalgia trip and play a ton of old childhood games. One summer that turned into playing every mainline Pokémon game end to end, generation 1 through 5. Every playthrough I'd hit a fork in the road where I had to pick between two Pokémon, and what mattered most to me was speed and attack. The sites I found for comparing them either looked a little outdated or were cluttered with features I didn't need, so I built a lighter version of my own — minimal, quick, and clear, with all the bloat and fluff stripped out.

Playing the old games again also turned up something the site was quietly getting wrong. Generation 1 has no Sp. Attack or Sp. Defense — one **Special** stat covers both — and plenty of Pokémon have had their stats or typing revised since. So a comparison can now be read **as of an earlier generation**: five stats and a Special for Gen 1, the base stats and typings that were actually in the game then, and that generation's own type chart, so Gen 1 Ghost does nothing to Psychic the way it really did. The control offers every generation the two you picked both existed in, with a dot on the ones where something actually changed — so pairing a Gen 1 Pokémon with a Gen 5 one visibly starts at 5, and the generation is in the URL like everything else.

That reading applies to the dex too, where it does a bit more: pick a generation and the table becomes the dex _as it was_ — Gen 3 is 392 Pokémon with their Gen 3 stats, and Gen 1 is 151 with five stat columns and a Special you can actually sort by. It filters as well as re-reads, because a table headed "Gen 3" that lists Pokémon which didn't exist yet is just wrong.

The dex table came next, for the other half of the same question: not "which of these two", but "who has the highest Speed in the whole game". All 1,259 entries in one sortable table, filterable by any combination of types and generations, with the sort and filters kept in the URL so a view is a link you can send someone.

![The Statmon dex: every Pokémon in one sortable, filterable table](docs/dex.png)

The type chart came from the same itch. Every other one I found either stops at single types or gives each dual-type pairing its own page, so answering "what beats Water/Flying" means going somewhere else. Here you pick up to two types and the eighteen attacking types sort themselves into tiers, with the full grid still on screen underneath. It's generation-aware too — the chart really has changed, six times, and Gen 1 is a 15×15 grid where Ghost does nothing to Psychic.

![The Statmon type chart answering Water / Flying, with the full grid below it](docs/types.png)

## How it works

Everything comes from PokéAPI, pulled once at build time into a local JSON file; the sprites and artwork are downloaded and committed to the repo, and so are the two webfonts. So the site makes **zero** network requests to anyone at runtime — it's just static files. Search, the stat math, and the type matchups all run against that local dataset.

## Stack

React + Vite, Tailwind (CSS-first tokens), React Router, plain JavaScript. Deployed on Cloudflare Workers as static assets.

## Run it

```bash
npm install
npm run dev
```

`npm run build:data` regenerates the dataset from PokéAPI, `npm run vendor:images` fetches the sprites and artwork, and `npm run vendor:fonts` fetches the two webfonts — all three only needed when something upstream changes, and all three cache or commit their output so re-runs are free. The data build also re-checks the hardcoded type chart against PokéAPI across all three of its historical eras, so a typo in 18×18 of hand-written data fails the build instead of reaching a user.

The checks that keep things honest, all seven of which run in CI:

- `lint`, `format:check`, `build`
- `test:run` — Vitest: the stat math, the dataset codec round-trip, the dex sort/filter logic, the generation-era resolution, a server-render smoke test of every route, and a set of accessibility regressions
- `audit:contrast` — WCAG AA across all 18 type colours, in seven pairing groups
- `check:docs` — every link and anchor in `docs/`
- `sweep:widths` — headless Chrome across 11 routes × 14 widths, asserting no page ever scrolls sideways and every touch target meets WCAG 2.5.8

That last one exists because I kept doing it by hand and kept doing it wrong: the type grid leaked horizontal overflow onto every page for as long as it had shipped, and I missed it three times because 390, 768 and 1280 are all clean while 600 and 700 are not. It has since caught a breakpoint that broke the header on every width between 360 and 383, and disproved a WCAG failure I had been asserting in two documents without ever measuring it.

`npm run shoot:docs` regenerates the screenshots in this README from the built site, for the same reason.

## Docs

I keep my working notes in [`docs/`](docs/) — the original brainstorm, the design system, and a dated decision log for why things are built the way they are. If you want to see how I think through a project, start with the [decision log](docs/03_decisions.md).

## Credits

Data and images from [PokéAPI](https://pokeapi.co) (sprites are CC0). Pokémon is © Nintendo / Game Freak / The Pokémon Company; Statmon is an unofficial fan project. My code is MIT — see [`LICENSE`](LICENSE).
