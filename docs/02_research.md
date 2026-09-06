# Statmon — Research (Step 2)

_Answers to the open questions from [00_brainstorm](00_brainstorm.md) and external findings that inform the build. Each section states the finding, the source, and a recommendation the [03_decisions](03_decisions.md) log can adopt. Researched July 2026._

---

## 1. PokéAPI — Shape, Endpoints & Fair Use

**What it is.** PokéAPI v2 is a free, open, no-auth REST API (also a GraphQL beta) covering the full canonical Pokémon dataset across ~60 endpoints. It's the de facto standard source and is licensed permissively (BSD-3-Clause), making it safe to build on.

**Endpoints I care about:**

- `GET /api/v2/pokemon/{id|name}` — the workhorse. Returns `id`, `name`, `types` (array of `{slot, type:{name}}`), and `stats` (array of `{base_stat, effort, stat:{name}}` for the six stats: `hp`, `attack`, `defense`, `special-attack`, `special-defense`, `speed`), plus `sprites`, `abilities`, `forms`, `species`, and `cries`.
- `GET /api/v2/pokemon-species/{id|name}` — dex-level info: `varieties` (the list of forms including Megas), `generation`, `color`, `evolution_chain`, flavor text.
- `GET /api/v2/type/{id|name}` — type data including damage relations (for future matchup features).

**Sprites.** Inside `/pokemon`, `sprites.front_default` is the pixel art; `sprites.other["official-artwork"].front_default` is the high-res art. There's also a dedicated **sprites GitHub repo** (`PokeAPI/sprites`) that can be downloaded wholesale — the intended path for bulk image use rather than hammering image URLs.

**Fair use.** Rate limiting was **removed in November 2018** when PokéAPI moved to static hosting, but the fair-use policy still stands and non-compliance risks a permanent IP ban. The binding asks: **cache locally**, keep request frequency low, be a good neighbor, report vulnerabilities responsibly.

**→ Recommendation.** Build-time fetch, never runtime. A Node script hits `/pokemon` + `/pokemon-species` once per Pokémon in scope, transforms to my slim schema ([01_spec §4](01_spec.md)), and writes local JSON. **Self-host sprites** by pulling from the `PokeAPI/sprites` repo (official art for the hero view, pixel sprites for search) rather than hotlinking — more reliable and maximally fair-use-friendly. This makes runtime PokéAPI dependency zero.

---

## 2. Mega Evolutions & Alternate Forms

**Finding.** PokéAPI models a **species** (Pokédex identity) separately from a **Pokémon** (a specific gameplay variety). A species' `varieties` array lists every form — base, Mega, regional, battle-only — and each variety is its own `/pokemon` entry with its own stat block. The `pokemon-form` resource carries flags like `is_default`, `is_battle_only`, and `is_mega`. Megas and Gigantamax are **not** separate evolution-chain nodes (the chain is species-level).

**→ Recommendation.** Treat each Mega/form as its **own selectable entry** in my data (its own id/slug/stats), and give every entry a `forms` array referencing its counterparts plus an `isDefault` flag. This directly satisfies the brainstorm's "reference its counterpart so search can switch between versions" idea, keeps the comparison logic uniform (a Mega is just another stat block), and lets search optionally group or filter forms. For launch I can include Megas but **defer** the long tail of exotic battle-only forms if they add noise.

---

## 3. Generation 1 "Special" Stat

**Finding.** Gen 1 used a single **Special** stat governing both special offense and defense. Gen 2 split it into **Sp. Attack** and **Sp. Defense**, and every returning Gen-1 Pokémon was assigned two distinct values. PokéAPI reports the **modern six-stat** values for all Pokémon, including Gen-1 species — it does not serve the historical single-Special number.

**→ Recommendation.** **Normalize to the modern six-stat schema** everywhere; it's what PokéAPI gives me, what current players expect, and what keeps every comparison apples-to-apples. The single-Special quirk becomes, at most, a `[Someday]` trivia footnote — not a data-model concern. This resolves the brainstorm's Gen-1 open question cleanly.

> **Revisited 2026-09-03 — the finding above was wrong on one point, and the recommendation is now superseded.** PokéAPI _does_ serve the historical Special, in `pokemon.past_stats` (stat id 9, `special`), for all 151 Gen 1 species. See [§12](#12-historical-stats-types-and-charts-past_-fields) for what is actually available; the six-stat schema remains the canonical shape, with history layered on top rather than replacing it ([D-045](03_decisions.md#d-045)).

---

## 4. React Router v7 on Cloudflare Workers

**Finding.** As of 2026, **React Router v7 (the merged successor to Remix) is officially supported on Cloudflare Workers**, with an official Cloudflare template and the Cloudflare Vite plugin generally available. Cloudflare now recommends **Workers over Pages** for new full-stack apps, and Workers supports SSR (server-rendered HTML on request, then client hydration).

**→ Recommendation.** React Router v7 + SSR on Cloudflare Workers is the confirmed **end-state** target (great for meta tags, OG images, direct-linked comparisons, and the multi-page suite). **Sequencing note:** I do **not** scaffold from the combined template up front — per [D-013](03_decisions.md#d-013) I start with a plain Vite + React (JavaScript) app and add React Router (Phase 3.5) and the Cloudflare/Wrangler layer (Phase 4) when each is actually needed. The finding (official support + template exist) still holds for when I add that layer. Decisions: [D-005](03_decisions.md#d-005), [D-013](03_decisions.md#d-013).

---

## 5. Typography for a Stat UI

**Finding.** For data/numeric UIs the consensus favors clean sans-serifs with **tabular figures** (equal-width digits so columns align). Top Google-Fonts-available picks: **Inter** (the frequent #1 — tabular figures, great small-size legibility, consistent rendering), with IBM Plex Sans, Source Sans, Roboto, and Lato as solid alternates. For a more architectural/minimalist feel, **Urbanist** is a clean modern option. Sans-serif is preferred over serif for numeric tables.

**→ Recommendation (decided).** A two-font system: **Inter** as the workhorse for body and — critically — for the **stat numbers with tabular figures enabled** (`font-feature-settings: "tnum"`), so digits line up in the difference column; paired with **Space Grotesk** for the logo/wordmark, headers, and titles (a geometric grotesque with a modern "calm-tech" character that complements Inter's neutrality). Finalize exact weights, sizes, and the type-color palette in [04_design](04_design.md). See [D-008](03_decisions.md#d-008).

---

## 6. Summary of Recommendations

| Open question           | Recommendation                                                                                                                                           |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data source & fair use  | Build-time fetch → local JSON; self-host sprites; zero runtime API calls                                                                                 |
| Megas / forms           | Each form is its own entry with `forms` counterpart refs + `isDefault`                                                                                   |
| Gen-1 Special           | Normalize to modern six stats (PokéAPI already does)                                                                                                     |
| Routing / deploy        | React Router **v8**, data mode, client-side now ([§10](#10-react-router--mode--version-phase-35)); framework mode + SSR on Cloudflare Workers at Phase 4 |
| Fonts                   | ✅ Inter (tabular figures) for body/stats + Space Grotesk for display/headers. See [D-008](03_decisions.md#d-008)                                        |
| Launch generation scope | ✅ All generations — full National Dex (1,025 Pokémon); pipeline parameterized. See [D-009](03_decisions.md#d-009)                                       |

---

## 7. Chandelure Brand Palette (accent sourcing)

**Finding.** Chandelure's official artwork palette, per extracted color sources, centers on: soft periwinkle purple **#757CBB**, deep flame-core purples **#7352E6 / #5941BF**, pastel blue **#A8C3DD**, pale blue-white highlight **#D2DEF1**, near-black frame/body **#070808 / #2F2F2F**, and a small yellow flame tip **#FBD13D**. (Note: the _shiny_ form flames orange, not purple — I use the standard purple.)

**→ Recommendation (decided).** Build the brand accent from the purple→blue flame: a pastel periwinkle `#9AA0E8` primary accent (lifted from #757CBB for dark-bg contrast), a `#A8C3DD` blue secondary/gradient stop, and a `#7352E6` deep-purple core for the hero flame gradient. Keep the accent bluer/lighter than the purple-family type colors so it never reads as a type. Full token table in [04_design §2](04_design.md); logged as [D-012](03_decisions.md#d-012).

---

## 8. Image Hosting on Cloudflare Free Tier (self-host cost check)

**Question.** Is self-hosting ~2,500 images (pixel sprites + official artwork) free on Cloudflare's free plan?

**Finding (confirmed July 2026).** Yes.

- **Static-asset requests are free and unlimited** and do **not** count against the Worker's free 100,000 requests/day; **bandwidth is unlimited** on the free plan (fair-use).
- Free-plan caps are **20,000 files per deploy** and **25 MiB per file**. My footprint (~1,259 sprites + ~1,259 artworks ≈ 2,500 files, each ≤ ~150 KB) is well within both.
- Cloudflare **Images** (their paid transformation/delivery product) is a different thing and is **not** needed — plain static assets suffice.

**→ Recommendation (decided).** Self-host both image types as Cloudflare Workers static assets; optimize artwork to WebP (~475px); lazy-load everything. Cost: **$0**; only trade-off is deploy storage. Locked in [D-002](03_decisions.md#d-002).

---

## 9. UI/UX Best Practices (spacing & typography)

Research that drove the design-system rules in [06_style_guide](06_style_guide.md) and the spacing/hierarchy pass ([D-019](03_decisions.md#d-019)).

### Spacing

- **8pt grid.** Size dimensions, padding, and margins in multiples of 8 (occasionally 4) for a consistent, scalable rhythm that divides cleanly across screens. Statmon's card bands and rows follow this (rows 36, footer 56, card 568).
- **Proximity / grouping (Gestalt).** Elements close together are read as a group; **every spacing decision is a grouping decision.** The **`internal ≤ external`** rule: use _tighter_ space inside a group and _looser_ space between groups. Uniform gaps make everything read as one undifferentiated block ("claustrophobic") — the tight/loose contrast is what creates hierarchy and breathing room.
- **Vertical rhythm.** Keep band/row heights (and ideally line-heights) on the base unit so rows align predictably across components.
- **Don't crowd dividers/edges.** Give content adjacent to a border or edge padding on both sides.

### Typographic hierarchy

- Hierarchy is built from **size + weight + color + spacing**, and it **collapses when everything sits too close** — spacing is as important as the type roles themselves.
- Keep to **3–4 clearly differentiated levels** (heading / subhead / body / caption-label). More levels muddy the scan.
- **Labels vs. values:** labels are smaller, muted, medium-weight, often with slightly wider tracking; values are larger and higher-contrast. Using body text where a label style belongs flattens hierarchy.
- For **numeric/data UIs**, use **tabular figures** so digits align in columns (Statmon: Inter with `tnum` for all stats).

**→ Applied in Statmon:** the proximity rule and 8pt rhythm are codified in [06_style_guide §6](06_style_guide.md); labels are muted tracked overlines, values are prominent; the comparison "claustrophobia" was fixed by grouping tightly and separating generously, and by moving content off the dividers.

---

## 10. React Router — Mode & Version (Phase 3.5)

Research behind the routing decision ([D-022](03_decisions.md#d-022)); revisits the [§4](#4-react-router-v7-on-cloudflare-workers) finding at implementation time.

**Three modes.** React Router (v7+) ships one library (`react-router`; React Native and the `react-router-dom` split are gone) with three modes: **declarative** (`<BrowserRouter>`/`<Routes>` — simplest, SPA-only, no data APIs), **data** (`createBrowserRouter` — adds loaders/actions and the data lifecycle; client-side, with an optional DIY SSR path), and **framework** (data mode packaged as a full-stack framework: file routes, typesafety, built-in SSR — the Remix successor). **Framework mode is data mode packaged up**, so choosing data mode now makes the eventual migration to the framework/SSR end-state ([D-005](03_decisions.md#d-005)) the smoothest — a synchronous slug lookup today becomes a route **loader** under SSR with no restructuring.

**Version — v8 is current.** As of July 2026 the current major is **React Router v8** (v7's `react-router` targeted in [D-005](03_decisions.md#d-005) is superseded). v8 is an intentionally "boring," near-non-breaking release: all v7 `future.*` flags become defaults, middleware is baseline, it's **ESM-only**, and baselines rise to **Node 22+, React 19.2.7+, Vite 7+**. Statmon already satisfies these (React 19.2.7, Vite 8), and the data-mode APIs used (`createBrowserRouter`, `RouterProvider`, `Link`/`NavLink`, `useParams`, `useSearchParams`, `useNavigate`) are unchanged across v7→v8.

**URL as source of truth.** Best practice for routed, shareable state is to derive it from the URL rather than mirror it in local state — this makes back/forward, deep links, and manual edits correct by construction and avoids desync bugs. Statmon derives the comparison selection from the path deep link (`/compare/<p1>/vs/<p2>`) or a query param (partial state) on every render.

**→ Recommendation (decided).** React Router **v8**, **data mode**, client-side, URL-as-source-of-truth; framework mode + Cloudflare/SSR deferred to Phase 4 as planned. See [D-022](03_decisions.md#d-022).

---

## 11. Sprite/Artwork Licensing (redistribution check)

Checked before committing the vendored images ([D-025](03_decisions.md#d-025)).

**Finding.** The `PokeAPI/sprites` repo ships a `LICENCE.txt` that reads: _"All image contents within are Copyright The Pokémon Company. This repository is distributed under **CC0 1.0 Universal.**"_ CC0 is a public-domain dedication — the affirmer waives all copyright and related rights and grants use "for any purpose whatsoever, including … commercial," with reproduction, distribution, and adaptation explicitly enumerated. So **PokéAPI expressly permits self-hosting, redistribution (incl. committing to my repo), and modification (my WebP conversion).** Its fair-use policy independently _encourages_ local caching/self-hosting over hotlinking.

**Caveat.** The same license opens by noting the images are **© The Pokémon Company**, and §4 clarifies CC0 waives only the _affirmer's_ (PokéAPI's) rights — it does **not** clear TPC's underlying copyright or any trademarks, and PokéAPI "disclaims responsibility for clearing rights of other persons." In practice this is the standard fan-project posture: game assets used under de-facto tolerance, with clear attribution and an "unofficial fan project" disclaimer (Statmon carries both in the footer + Credits). _This is a summary of the license text, not legal advice._

**→ Recommendation (decided).** Vendor + commit both image types (they're static, so no git-history churn); keep the PokéAPI attribution + fan-project disclaimer. Locked in [D-025](03_decisions.md#d-025).

---

## 12. Historical Stats, Types and Charts (`past_*` fields)

Researched 2026-09-03, before building generation-accurate comparisons ([D-045](03_decisions.md#d-045)).

**Finding.** PokéAPI exposes history through three fields that all share one rule: **a record's `generation` is the last generation those values applied in**, and only the values that differ are listed.

| Field                   | Where                | Coverage in our 1,259 entries                  |
| ----------------------- | -------------------- | ---------------------------------------------- |
| `past_stats`            | `/pokemon/{id}`      | **193** entries, 213 records                   |
| `past_types`            | `/pokemon/{id}`      | **29** entries                                 |
| `past_damage_relations` | `/type/{name}`       | 8 of 18 types, with Gen 1 and Gen 5 boundaries |
| `version_group`         | `/pokemon-form/{id}` | the debut of every alternate form              |

**Gen 1 Special is real data, not a formula.** Every one of the 151 Gen 1 species carries a `generation-i` record holding a `special` stat. This matters more than it looks: the folk rule "Gen 1 Special became Sp. Attack in Gen 2" is **wrong for 43 of the 151** — Chansey 105 → 35, Gyarados 100 → 60, Hypno 115 → 73, Charizard 85 → 109. Deriving it would have been confidently wrong for 28% of the generation.

**Two traps.** (1) PokéAPI also emits a `past_stats` record when only the **EV yield** (`effort`) changed; seven Pokémon carry one whose base stat is identical, and they must be filtered or they become UI controls that do nothing. (2) A species' generation is not its forms' — Alolan Raichu is a Gen 1 species introduced in Gen 7 — so alternate forms need dating from `pokemon-form.version_group`, via a version-group → generation map.

**Type charts.** Three have existed: Gen 1, Gen 2–5, Gen 6+. Once types that did not exist yet are excluded, only four attacking rows differ in Gen 1 and two in Gen 2–5. PokéAPI encodes Gen 1's Ghost-vs-Psychic as 0× — the bug the games shipped, rather than the printed chart's 2×.

**→ Recommendation (decided).** Take all of it from PokéAPI at build time and store it as `until` records without converting the semantics; keep the effectiveness chart hardcoded but **verify** it against `/type` on every data build. Locked in [D-045](03_decisions.md#d-045) and [D-047](03_decisions.md#d-047).

---

## 13. Abilities (for the planned abilities feature)

Researched 2026-09-04, ahead of the work itself — the point is to know what the data can and cannot do before designing around it.

**What PokéAPI gives us, for free.**

- `pokemon.abilities` — the roster per Pokémon, each with `is_hidden` and `slot`, so the two-or-three-way choice a Pokémon has is machine-readable.
- `pokemon.past_abilities` — **the same `until` shape as `past_stats` and `past_types`** ([§12](#12-historical-stats-types-and-charts-past_-fields)), so the era machinery in `lib/eras.js` already covers abilities changing hands between generations.
- `ability.generation` — and this is the one that shapes the feature: abilities were introduced in **Generation III**. In a Gen 1 or Gen 2 view there are no abilities at all, which the existing `?asof=` lens can express without inventing anything.
- `ability.effect_changes` — abilities whose behaviour was revised later (Flash Fire has one).

**What it does not give us, which is the whole difficulty.** The mechanical effect is **prose only**. Levitate's entry reads _"Evades Ground moves."_ — there is no structured field anywhere on the resource saying "immune to Ground". So the part Statmon actually needs for the matchup maths has to be **hardcoded**, the way `lib/typeChart.js` is.

**And unlike the type chart, it cannot be verified against PokéAPI.** [D-047](03_decisions.md#d-047) hardcodes the chart but `npm run build:data` re-checks every cell against `damage_relations`; there is no equivalent for "Levitate ⇒ Ground 0×". Roughly twenty of the 374 abilities alter type effectiveness (Levitate, Flash Fire, Water/Volt Absorb, Lightning Rod, Storm Drain, Motor Drive, Sap Sipper, Dry Skin, Thick Fat, Heatproof, Water Bubble, Fluffy, Purifying Salt, Earth Eater, Well-Baked Body, Wind Rider, Wonder Guard, Delta Stream…), so the table is small — but it is a hand-maintained list with no automated guard behind it, and that should be a conscious decision rather than a surprise.

**→ Recommendation (for the future session).** Take the roster and its history from the API; hardcode the ~20 effectiveness-modifying abilities as a small table beside the type chart, with unit tests standing in for the verification the chart gets from the build. Scope the mechanic to type effectiveness only — damage calc, weather and stat-stage abilities are a different and much larger feature.

> **Built 2026-09-05 ([D-073](03_decisions.md#d-073)). The recommendation held; the candidate list above did not.** Four corrections and three measurements, recorded here because this section is what the next reader will trust.
>
> **The list was wrong about Wind Rider.** It grants immunity to _wind_ moves — Tailwind, Bleakwind Storm — and **not** to Flying-type ones. It is out, alongside Bulletproof, Soundproof and Queenly Majesty, which are the same category: move properties, not types. Fluffy is in for one clause only (it doubles Fire, a real type relation) and out for the other (halving _contact_ moves is not).
>
> **The list was also over-inclusive on multipliers.** Dry Skin's Fire **×1.25** and Filter / Solid Rock / Prism Armor's **×0.75** are outside the chart's own vocabulary (0, ¼, ½, 1, 2, 4) and would create a 2.5× tier with no row to put it in. Dry Skin's Water immunity is in; its Fire clause is not. The rule that replaced the list: _an ability is in the table when its effect is `defending type → multiplier` within that vocabulary._ Wonder Guard is the single documented exception, being a rule over the final product.
>
> **Two abilities needed a date the roster could not supply.** Lightning Rod and Storm Drain only _redirected_ until Gen 5; the immunity came later. Rhyhorn and Electrike have carried Lightning Rod in an ordinary slot since Gen 3, and Gastrodon has had Storm Drain since Gen 4, so a Gen 3 board reading either as an immunity would have been wrong about a real Pokémon. Each table entry therefore carries a `since`.
>
> **And `past_abilities` is only half a record of when hidden abilities exist.** They arrived in **Gen 5**, which the 540 empty-slot records mostly say — but **not where the hidden slot was later replaced**. Zapdos is stored as a single substitution, `{until: 5, slots: {3: "lightning-rod"}}`, whose `until` reaches back to Gen 3 with nothing to stop it. Read literally that hands 21 entries a hidden ability in Ruby and Sapphire, five of them one that bends a matchup. So `HIDDEN_FROM_GEN = 5` is stated in `lib/abilities.js` the same way the Gen 3 floor is: **the API records which hidden ability was held, never that one could be held at all.** ([D-078](03_decisions.md#d-078))
>
> **`ability: null` is the shape that matters most.** Of the 568 `past_abilities` records across 466 entries, **540 say a slot was empty then** — that is how PokéAPI encodes an ability _arriving_, and it is why `/ability/{name}` never had to be fetched for generation metadata. Only **28** are one ability replacing another; the best of them is **Gengar's Levitate, held through Gen 6**.
>
> **What it cost, measured:** **zero new network requests** (the roster was already in the build cache for all 1,259 entries) and **+8.2 kB gzip**, of which era history is only 0.8 kB. A slug dictionary would have saved another 0.8 kB and was not worth a container-format change.
>
> **And the verification gap is narrower than this section assumed.** The semantics genuinely cannot be checked against PokéAPI — but the **keys** can, and `npm run build:data` now fails if any slug in the table is not a real ability some Pokémon in the dex has. Unit tests carry the rest.

---

## Sources

- [PokeAPI/sprites — LICENCE.txt (CC0 1.0)](https://github.com/PokeAPI/sprites/blob/master/LICENCE.txt)
- [PokéAPI — official docs (v2)](https://pokeapi.co/docs/v2)
- [PokéAPI — home](https://pokeapi.co/)
- [PokeAPI/sprites — sprite repository](https://github.com/PokeAPI/sprites)
- [pokeapi-js-wrapper — caching approach](https://github.com/PokeAPI/pokeapi-js-wrapper)
- [PokéAPI issue #401 — forms vs. varieties](https://github.com/PokeAPI/pokeapi/issues/401)
- [PokéCommunity — Sp. Atk / Sp. Def split (Gen 1)](https://www.pokecommunity.com/threads/sp-attack-sp-def-split-gen-1.475621/)
- [The New Leaf Journal — the Special split in Gen 2](https://thenewleafjournal.com/the-pokemon-special-split-in-generation-2-statistics-and-analysis/)
- [Cloudflare Workers — React Router framework guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/react-router/)
- [Cloudflare Blog — full-stack development on Workers](https://blog.cloudflare.com/full-stack-development-on-cloudflare-workers/)
- [React Router v7 + Vite + Cloudflare Workers (Jamie.sh)](https://jamie.sh/posts/cloudflare-workers-react-router-deployment/)
- [Choosing the right React Router v7 mode (LogRocket)](https://blog.logrocket.com/react-router-v7-modes/)
- [React Router v8 announcement (Remix blog)](https://remix.run/blog/react-router-v8)
- [Highlights from React Router v8 (Medium)](https://medium.com/@onix_react/highlights-from-react-router-v8-7bd43781a74a)
- [Updating from v7 → v8 (React Router docs)](https://reactrouter.com/upgrading/v7)
- [Best fonts for dense dashboards & data-heavy interfaces](https://fontalternatives.com/blog/best-fonts-dense-dashboards/)
- [Best fonts for tables (wpDataTables)](https://wpdatatables.com/best-fonts-for-tables/)
- [Chandelure color palette (color-hex #40426)](https://www.color-hex.com/color-palette/40426)
- [Chandelure color palette (color-hex #17413)](https://www.color-hex.com/color-palette/17413)
- [Chandelure official artwork (Pokémon Database)](https://pokemondb.net/artwork/chandelure)
- [Cloudflare Workers — pricing (static assets free/unlimited)](https://developers.cloudflare.com/workers/platform/pricing/)
- [Cloudflare changelog — increased static asset limits (20k free / 25 MiB)](https://developers.cloudflare.com/changelog/2025-09-02-increased-static-asset-limits/)
- [Cloudflare Pages — pricing (unlimited bandwidth)](https://developers.cloudflare.com/pages/functions/pricing/)
- [Spacing best practices — 8pt grid & internal ≤ external](https://cieden.com/book/sub-atomic/spacing/spacing-best-practices)
- [The 8pt grid system](https://www.rejuvenate.digital/news/designing-rhythm-power-8pt-grid-ui-design)
- [Proximity principle in design](https://glow.team/blog/proximity-principle-design)
- [Typography hierarchy — beginner's guide (Uxcel)](https://uxcel.com/blog/beginners-guide-to-typographic-hierarchy)
- [Why your UI feels messy — typography hierarchy](https://medium.com/@temoyinloye/why-your-ui-feels-messy-and-how-typography-hierarchy-can-fix-it-ececafb0516c)
- [Best fonts for dense dashboards & data-heavy interfaces](https://fontalternatives.com/blog/best-fonts-dense-dashboards/)
