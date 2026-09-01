# Statmon

A simple set of Pokémon tools, built for myself. Two so far: a head-to-head comparison of two Pokémon's base stats, and a full-dex table of every Pokémon sortable by any stat.

**Live at [statmon.noahparknguyen.workers.dev](https://statmon.noahparknguyen.workers.dev/).**

![Statmon comparing Volcarona and Chandelure](docs/home.png)

## Why

Sometimes I go on a nostalgia trip and play a ton of old childhood games. One summer that turned into playing every mainline Pokémon game end to end, generation 1 through 5. Every playthrough I'd hit a fork in the road where I had to pick between two Pokémon, and what mattered most to me was speed and attack. The sites I found for comparing them either looked a little outdated or were cluttered with features I didn't need, so I built a lighter version of my own — minimal, quick, and clear, with all the bloat and fluff stripped out.

The dex table came next, for the other half of the same question: not "which of these two", but "who has the highest Speed in the whole game". All 1,259 entries in one sortable table, filterable by any combination of types and generations, with the sort and filters kept in the URL so a view is a link you can send someone.

## How it works

Everything comes from PokéAPI, pulled once at build time into a local JSON file; the sprites and artwork are downloaded and committed to the repo. So the site makes zero API calls at runtime — it's just static files. Search, the stat math, and the type matchups all run against that local dataset.

## Stack

React + Vite, Tailwind (CSS-first tokens), React Router, plain JavaScript. Deployed on Cloudflare Workers as static assets.

## Run it

```bash
npm install
npm run dev
```

`npm run build:data` regenerates the dataset from PokéAPI and `npm run vendor:images` fetches the images — both only needed when a new generation ships, and both cache aggressively so re-runs are free.

The checks that keep things honest are `lint`, `format:check`, `test:run` (Vitest — the stat math, the dataset codec round-trip, the dex sort/filter logic, and a server-render smoke test of every route), `audit:contrast` (WCAG AA across all 18 type colours, in five pairing groups) and `check:docs` (every link and anchor in `docs/`).

## Docs

I keep my working notes in [`docs/`](docs/) — the original brainstorm, the design system, and a dated decision log for why things are built the way they are. If you want to see how I think through a project, start with the [decision log](docs/03_decisions.md).

## Credits

Data and images from [PokéAPI](https://pokeapi.co) (sprites are CC0). Pokémon is © Nintendo / Game Freak / The Pokémon Company; Statmon is an unofficial fan project. My code is MIT — see [`LICENSE`](LICENSE).
