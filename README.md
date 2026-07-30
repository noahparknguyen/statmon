# Statmon

A simple set of Pokémon tools, built for myself. The first is a head-to-head comparison of two Pokémon's base stats.

**Live at [statmon.noahparknguyen.workers.dev](https://statmon.noahparknguyen.workers.dev/).**

![Statmon comparing Volcarona and Chandelure](docs/home.png)

## Why

I was playing through the mainline Pokémon games and wanted a quick way to see which of two Pokémon had the better stats. The sites I found for it were either a bit slow and clunky, or bloated with more than I needed for a simple comparison. So I built a lighter version of my own — minimal, quick, and clear.

## How it works

Everything comes from PokéAPI, pulled once at build time into a local JSON file; the sprites and artwork are downloaded and committed to the repo. So the site makes zero API calls at runtime — it's just static files. Search, the stat math, and the type matchups all run against that local dataset.

## Stack

React + Vite, Tailwind (CSS-first tokens), React Router, plain JavaScript. Deployed on Cloudflare Workers as static assets.

## Docs

I keep my working notes in [`docs/`](docs/) — the original brainstorm, the design system, and a dated decision log for why things are built the way they are. If you want to see how I think through a project, start with the [decision log](docs/03_decisions.md).

## Credits

Data and images from [PokéAPI](https://pokeapi.co) (sprites are CC0). Pokémon is © Nintendo / Game Freak / The Pokémon Company; Statmon is an unofficial fan project. My code is MIT — see [`LICENSE`](LICENSE).
