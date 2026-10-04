# Third-party notices

Statmon's own code is MIT — see [`LICENSE`](../LICENSE). This file covers what
it redistributes or depends on, and it exists because two of these are
obligations rather than courtesies.

## Fonts — redistributed in this repository

`public/fonts/` contains ten `.woff2` files pulled from Google Fonts by
`npm run vendor:fonts`. Both families are under the **SIL Open Font License
1.1**, which requires the licence text to travel with the font files. The two
texts are beside this one, and the script fetches them alongside the fonts so a
re-vendor cannot quietly drop them again.

| Font              | Copyright                              | Licence                                                      |
| ----------------- | -------------------------------------- | ------------------------------------------------------------ |
| **Inter**         | 2016 The Inter Project Authors         | SIL OFL 1.1 — [`OFL-Inter.txt`](OFL-Inter.txt)               |
| **Space Grotesk** | 2020 The Space Grotesk Project Authors | SIL OFL 1.1 — [`OFL-SpaceGrotesk.txt`](OFL-SpaceGrotesk.txt) |

## Icons — bundled at build time

Icons come through [`react-icons`](https://github.com/react-icons/react-icons)
(MIT), which is a wrapper: each icon keeps its original project's licence.

| Set                                         | Used for                                          | Licence                                                                              |
| ------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Lucide** (`react-icons/lu`)               | Almost every icon on the site                     | [ISC](https://github.com/lucide-icons/lucide/blob/main/LICENSE)                      |
| **Font Awesome 6 Free** (`react-icons/fa6`) | The comparison board's and the dex table's carets | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — **attribution required** |

Font Awesome Free is CC BY 4.0, so it is credited in the site footer rather than
only here. Lucide's ISC needs no on-site notice; it is listed for completeness.

## Data and images — fetched at build time, committed to this repository

| Source                                                | What                                         | Terms                                                           |
| ----------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------- |
| [PokéAPI](https://pokeapi.co/)                        | Names, types, base stats, abilities, history | Free to use; fetched once at build time per its fair-use policy |
| [PokéAPI/sprites](https://github.com/PokeAPI/sprites) | Pixel sprites and official artwork           | CC0                                                             |

## Runtime dependencies — compiled into the shipped bundle

These are not redistributed as files, but their code is compiled into
`dist/assets/*.js`, and MIT asks for its notice to travel with substantial
portions. Minifiers drop the banners, so this is where they live.

| Package                        | Licence                                            |
| ------------------------------ | -------------------------------------------------- |
| react, react-dom               | MIT                                                |
| react-router                   | MIT                                                |
| tailwindcss, @tailwindcss/vite | MIT                                                |
| react-icons                    | MIT (see Icons above for the icon sets themselves) |

Build-only tooling (Vite, ESLint, Prettier, Vitest, Wrangler, sharp) ships
nothing to the browser and is not listed.

## Reference, not redistributed

The ~20 abilities that change type effectiveness are a hand-written table in
`src/lib/typeChart.js`, because PokéAPI describes what an ability does only in
prose. Their multipliers were checked against **Bulbapedia**. No Bulbapedia
content is copied into this repository — it is a source that was read, and the
credit is a courtesy rather than a requirement.

## Trademarks

Pokémon and Pokémon character names are trademarks of Nintendo, Game Freak, and
The Pokémon Company. Statmon is an unofficial fan project and is not affiliated
with, endorsed by, or sponsored by any of them.
