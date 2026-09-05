# Statmon — Roadmap (Step 5)

_The phased build plan / task checklist: what to implement, in order. Sequenced from the [01_spec](01_spec.md) scope and grounded in the [03_decisions](03_decisions.md) log. Phases 0–4 get to a polished MVP launch; Phases 5+ are the fast-follow and the suite. Check items off as they land._

> Legend: `[x]` done · `[~]` partially done (the remainder is spelled out inline) · `[ ]` not started. Each phase lists an **exit criterion** — the concrete thing that's true when the phase is done.

---

## Current status (2026-09-04 — Session 15, the consistency & accessibility sweep)

**Done — the site is one system again, and its claims are measured.** A full pass
over consistency, accessibility, responsiveness and the writing.

- **Consistency.** Six page rhythms became two (`pageChrome.jsx`) behind one
  `PageHeader`; `/compare` gained the controls panel the other two tools had; the
  dex's filter chip and the type picker became one `FilterChip`; the two STAB
  pills became one `StabChip`; the dex's real and preview header rows now share
  their geometry. ([D-058](03_decisions.md#d-058))
- **A real AA failure**, found only because merging the two STAB pills put their
  colour pairing in front of `audit:contrast`: the resisted/immune multiplier was
  below AA on **17 of 18 types** and had shipped that way on both surfaces since
  the chip was written. Fixed, and added as group 7 of the audit.
  ([D-058](03_decisions.md#d-058))
- **Three accessibility defects**: the type grid could not be scrolled from a
  keyboard, the nav links had a ~17px hit box, and the dex's controls force-zoomed
  iOS. Plus three `title` tooltips removed, duplicate alt text, and a live region
  for search results. Five regression tests. ([D-065](03_decisions.md#d-065))
- **The comparison board no longer repeats itself on a phone** — one stats
  surface instead of three, verdict first: 2,727px → 2,343px, and the answer moves
  from ~1,550px down the page to ~450px. ([D-057](03_decisions.md#d-057))
- **`npm run sweep:widths`** replaces the manual browser pass: 11 routes × 14
  widths, asserting no horizontal overflow, plus WCAG 2.5.8 target sizes. It
  proved `FormChips` **passes** 2.5.8 (27.1px against 24px needed) — a "likely
  failure" this repo had asserted without measuring for three sessions — and it
  caught the `xs` breakpoint being wrong. ([D-059](03_decisions.md#d-059),
  [D-062](03_decisions.md#d-062))
- **Routes are code-split** and **the fonts are self-hosted**, so the site now
  genuinely makes zero third-party requests. Home: 140.3 → 128.7 kB gzipped.
  ([D-060](03_decisions.md#d-060), [D-061](03_decisions.md#d-061))
- **The writing caught up with the product.** Title, description, OG/Twitter,
  `package.json` and the manifest all named a stat-comparison site with a dex
  bolted on; the type chart appeared in none of them. Plus `robots.txt`,
  `sitemap.xml`, and screenshots that are now **generated** rather than taken by
  hand — `docs/preview.png` was still the launch image, from before two of the
  three tools existed. Scripting that capture then shipped a **wrong** social
  preview (the 1200px OG frame inside a 1280px window, wordmark 40px off centre),
  which is now fixed and, more usefully, **asserted**: `shoot:docs` measures the
  rendered PNG and fails if either social frame is off centre.
  ([D-063](03_decisions.md#d-063), [D-064](03_decisions.md#d-064),
  [D-066](03_decisions.md#d-066))
- **CI**: GitHub Actions runs every check on push and PR.

Vitest is at **213 tests**.

## Session 12–13 (the grid made readable)

**Done — the type chart reads at a glance.** The grid's four cell states had measured 1.00–1.42 apart as fills, so it had to be read rather than scanned; the scale is now one loud state for 2× and three quiet ones, every cell is filled, both axes are colour-coded and square off into the grid, and hovering lights a cell's row and column ([D-052](03_decisions.md#d-052), [D-053](03_decisions.md#d-053)). Marking a selected column is done at its edges rather than with a wash, because a wash strong enough to see puts the multiplier under AA. Fixing it also uncovered a page-level horizontal scroll the grid had leaked since it shipped, which only `contain: paint` stops — the browser sweep now runs **ten widths** instead of three, because 390 / 768 / 1280 were all clean while 600 and 700 were not. Vitest is at **206 tests**.

## Session 11 (the type chart)

**Done — Statmon is a three-tool site.** `/types` ships the full 18×18 effectiveness matrix **and** a dual-type readout in one page ([D-051](03_decisions.md#d-051)), the thing other sites split across a page per pairing. It carries the same `?asof=` lens — the chart itself changed six times, so a Gen 1 chart is 15×15 with Ghost doing nothing to Psychic. Home's tools chip is live and the tool ships with its preview (Bug/Fire — the mascot's 4× Rock).

## Session 10 (layout polish)

**Done — the generation strip is always on screen.** It used to appear with the first selection, which pushed the comparison board down the page ([D-050](03_decisions.md#d-050)); it is now unconditional on both tools, and on the dex it leads the controls panel above a divider instead of floating on the background. The dex's origin filter is renamed **"Introduced in"** — two generation controls in one panel needed distinguishing — and hides when a lens leaves it one option. A smoke assertion across every route now catches a prop that quietly stopped being passed — which is how `/style` was found still handing the strip its pre-rename prop names.

## Session 9 (the dex as of a generation)

**Done — both tools read history.** `/dex` now takes the same generation lens as the comparison board, and on a table it does more: **"as of Gen 3" caps the rows too** ([D-049](03_decisions.md#d-049)), so it is a 392-row dex of what existed then, ranked on that generation's values. Gen 1 is 151 rows with five stat columns and a sortable **Special**. The filters narrow with the lens, and the lens is `?asof=` on **both** tools — `/dex`'s `?gen=` keeps meaning the origin filter, which is a different axis.

**Done — one chip vocabulary, and the playground stops keeping copies.** The colour half of a toggle chip lives once in `components/chipStyles.jsx`; the three chip families keep only their geometry ([D-048](03_decisions.md#d-048)). `/style` renders all three side by side, and imports `TYPES` instead of restating it — it had been carrying a fourth hand-written copy of the 18, which a test now makes impossible.

**Done — the comparison tool reads history.** `/compare` can now be read **as of an earlier generation** ([D-045](03_decisions.md#d-045)–[D-047](03_decisions.md#d-047)): Generation 1's five stats with a single **Special**, historical base stats and typings, and that generation's own type chart. One control covers both cases — a strip of numbered chips beside Swap, one per generation the two selected Pokémon **both existed in**, with a dot marking the generations that differ from today ([D-046](03_decisions.md#d-046)). The generation lives in the URL (`?asof=`) like every other view on this site. The dataset gained `statEras` / `typeEras` / `introducedIn` (+1.1 kB gzipped) from PokéAPI's `past_*` fields, and `npm run build:data` now verifies the hardcoded type chart against PokéAPI across all three eras.

**Done — Statmon is a two-tool site, and Home advertises both.** Every feature now ships with a live preview on Home ([D-043](03_decisions.md#d-043)) — a rule, a `FeaturePreview` component, and a line in each tool's checklist below. The **full-dex stats table** shipped at `/dex` ([D-039](03_decisions.md#d-039)): all 1,259 entries, sortable on every stat, multi-select filterable by type and generation ([D-040](03_decisions.md#d-040)), with alternate forms toggleable (hidden by default since [D-056](03_decisions.md#d-056)) — windowed so only ~26 rows are ever in the DOM. The foundation work it depended on landed first ([D-038](03_decisions.md#d-038)): scroll + focus reset on navigation (closing the last [D-024](03_decisions.md#d-024) item), per-route `<title>`s, and **Vitest** with 94 tests.

**Done — the MVP is live.** Phases 0–4 are complete: a polished, multi-page, self-contained, WCAG-AA site, responsive from phone to desktop, deployed on Cloudflare Workers at **https://statmon.noahparknguyen.workers.dev/**. The one Phase-4 item intentionally left for later is the optional SSR/framework-mode upgrade (per-route meta).

- **Phases 0–2:** plain Vite + React (JS) + Tailwind v4 CSS-first tokens; build-time data pipeline → **1,259 entries**; design-system primitives (22 named text styles, shared `Button` / `CmpRow` / `CmpStatCard` / `SpeedBanner`).
- **Phase 3 — comparison tool:** search, two hero cards with form switching, the comparison card (BST summary, STAB matchup, mirrored **type-colored** diffs, speed banner), swap.
- **Phase 3.5 — routing:** React Router **v8** (data mode); shared `Layout` (header/nav/footer + `main`); routes `/` Home, `/compare` (+ `/compare/<p1>/vs/<p2>`), `/dex`, `/credits`, `/style`, `*` 404; **URL is the single source of truth** ([D-022](03_decisions.md#d-022), `src/lib/compareUrl.js`).
- **Phase 4:** **Home** product-as-hero (live Volcarona-vs-Chandelure board, blunt suite copy, corner mascot sprites, tools row) + blunt **Credits** ([D-023](03_decisions.md#d-023)); **image vendoring** — 2,513 sprites/artwork self-hosted + committed ([D-025](03_decisions.md#d-025)); **meta/favicons/OG** incl. the HTML-rendered OG generator `docs/og-image.html` ([D-026](03_decisions.md#d-026)); **accessibility** — skip link + landmarks ([D-024](03_decisions.md#d-024)) and a full **WCAG-AA contrast audit** with a reproducible checker ([D-027](03_decisions.md#d-027)); **mobile per-stat layout** — `ComparisonCard` + `FeaturedComparison` collapse to stacked per-stat cards below 768px ([D-010](03_decisions.md#d-010), [D-029](03_decisions.md#d-029)); the MIT `LICENSE` and a personal-credit footer line are in ([D-029](03_decisions.md#d-029)); **deployed** to Cloudflare Workers as static assets, with absolute OG URLs set ([D-030](03_decisions.md#d-030)).

**Deferred (optional, post-MVP):** the React Router **framework/SSR mode** upgrade ([D-005](03_decisions.md#d-005), [D-022](03_decisions.md#d-022)) — the data-mode config migrates cleanly. It would add **per-route `<title>`/meta**; the site-level OG/meta is already set with absolute URLs. Not required for the MVP — revisit if per-comparison social unfurls become worth it.

**Launch-pass leftovers:** all done — personal-credit line + `LICENSE` ([D-029](03_decisions.md#d-029)), the OG image (`public/og-image.png`), and the production deploy ([D-030](03_decisions.md#d-030)). _(The 1280×640 GitHub social frame is already exported to `docs/preview.png`; it still needs uploading by hand at repo Settings → Social preview, which is a GitHub-side setting and not something the repo can carry.)_

**npm scripts:** `dev` · `build` · `test` / `test:run` · `build:data` · `vendor:images` (after `build:data`) · `vendor:fonts` · `audit:contrast` · `check:docs` · `sweep:widths` · `shoot:docs` · `lint` · `format` · `format:check` · `preview` · `deploy` (`build` + `wrangler deploy`).

**The seven checks that must stay green:** `npm run lint && npm run format:check && npm run test:run && npm run build && npm run audit:contrast && npm run check:docs && npm run sweep:widths`. All seven run in CI on every push and PR (`.github/workflows/ci.yml`); the sweep needs `build` first and a Chrome binary (`CHROME_PATH` to override).

**Reading a past generation (D-045, D-049):** all of the resolution logic is pure functions in `src/lib/eras.js` — `eraView(pokemon, gen)` returns `{ gen, keys, stats, bst, types }`, `generationOptions([p1, p2])` returns the generations both existed in (each flagged for whether it differs from today), and `dexGenerations()` is the dex's plainer equivalent. The dex layers `statKeysFor` / `sortKeysFor` / `typesFor` / `generationsFor` / `setAsOf` on top in `lib/dexTable.js`, so the columns, the sort keys and the filter chips all narrow together. The lens is `?asof=` on both tools; the dex's `?gen=` is the unrelated origin filter. Home and `/style` stay current-generation. `STAT_ORDER` is still exactly the modern six; Gen 1's `special` lives outside it because the stored stat array's order depends on it. The dex, Home and `/style` are all deliberately current-generation.

**Notes:** `StatBar.jsx` is **deleted**. It was kept "for the future stats table", but the dex table did not use it — a table cell is not a label·bar·value row ([D-039](03_decisions.md#d-039)) — leaving it a playground specimen with no claimant, which is what this note flagged. Its `/style` section went with it. The dataset ships in the compact form defined by `src/lib/pokemonCodec.js` and is decoded at import ([D-036](03_decisions.md#d-036)) — read/write it through the codec, never as raw JSON. Shared primitives as of [D-032](03_decisions.md#d-032): `CmpRow` (desktop mirrored row + diff cell) and `CmpStatCard` (mobile per-stat card) are used by **both** `ComparisonCard` and Home's `FeaturedComparison`; `SpeedBanner` and `Button` are shared across the site. The dex adds `DexRow` (used by both the table and Home's preview) with its geometry in `components/dexColumns.jsx`, and `FeaturePreview` — the shell every Home preview is built from ([D-043](03_decisions.md#d-043)). Shared _styling_ constants live in their own `.jsx` modules for the reasons in [D-048](03_decisions.md#d-048): `components/dexColumns.jsx` (table geometry) and `components/chipStyles.jsx` (the one colour pair behind all three chip families). New tools should build on these rather than re-rolling them.

---

## Phase 0 — Foundation & Scaffolding

_Goal: a minimal, running local app with the styling system wired up. Start simple — no Cloudflare, no router yet. ([D-013](03_decisions.md#d-013))_

- [x] Scaffold a **plain Vite + React (JavaScript)** app: `npm create vite@latest statmon -- --template react`. ([D-013](03_decisions.md#d-013), [D-014](03_decisions.md#d-014))
- [x] Add **Tailwind** (v4, `@tailwindcss/vite`).
- [x] Finalize the **style guide** ([06_style_guide](06_style_guide.md)) and translate it into the **Tailwind theme + design tokens** in `src/index.css` (colors, 11-step type scale, named text styles — 17 at the time, 22 today, radii, breakpoints, motion) — everything token-driven from here on.
- [x] Wire fonts (Space Grotesk + Inter) and page meta in `index.html`.
- [x] Confirm local dev + build run clean (`npm run dev` / `npm run build`).
- [x] Set up the repo: `.gitignore`, license (MIT), README, commit hygiene; published to GitHub.

**Exit:** a blank, on-brand Statmon app runs locally with the full token system available in Tailwind. (Cloudflare deploy + routing come later — see Phase 3.5 and Phase 4.)

---

## Phase 1 — Data Pipeline

_Goal: a local JSON dataset + sprites, generated on command. No UI yet._

- [x] Write the **build-time fetch script** (`scripts/build-data.mjs`) hitting `/pokemon-species` + `/pokemon`, rate-limited + cached + retrying. ([D-001](03_decisions.md#d-001), [D-016](03_decisions.md#d-016))
- [x] Transform to the slim schema from [01_spec §4](01_spec.md): id, slug, name, types, six stats, bst, generation, `forms`, `isDefault`, sprite/artwork URLs.
- [x] Cover **all generations — the full National Dex** — via the species list (no hardcoded gen cap). ([D-009](03_decisions.md#d-009))
- [x] Handle **Megas/regional/battle forms** as first-class entries with counterpart refs; skip cosmetic (stat+type-identical) forms. ([D-003](03_decisions.md#d-003))
- [x] Normalize to the **six-stat schema**; precompute BST. ([D-004](03_decisions.md#d-004))
- [x] Built-in **validation summary** (counts per generation, missing stats/sprites, form groups).
- [x] **Run** `npm run build:data` — verified: 1,259 entries, 0 missing stats, gen counts sum correctly, 414 with alt-forms (incl. the new Legends Z-A Megas). 3 entries lack a pixel sprite (pikachu-starter, eevee-starter, zygarde-mega) but have artwork → search thumbnail falls back to `spriteUrl ?? artworkUrl`.
- [x] **Vendor images** from `PokeAPI/sprites` — self-hosted **both** pixel sprites (`public/sprites/{id}.png`) and official artwork (`public/artwork/{id}.webp`, ≤475px); URL fields rewritten to local paths with `spriteUrl ?? artworkUrl` fallback; committed. Run via `npm run vendor:images` (`scripts/vendor-images.mjs`). ([D-002](03_decisions.md#d-002), [D-025](03_decisions.md#d-025))
- [x] ~~Generate the **type → color** map (18 types)~~ — **not built, by design.** The 18 colors ship as `--color-type-*` CSS tokens read through `typeColorVar()`; a parallel JSON copy would be a second source of truth for zero gain. Closed as won't-do ([04_design §3](04_design.md), [01_spec §4](01_spec.md)).

**Exit:** `npm run build:data` produces a validated `src/data/pokemon.json` the app can import; sprites vendored locally.

---

## Phase 2 — Design System

_Goal: turn the tokens (already in Tailwind from Phase 0) into reusable component primitives. Design is pre-specified in [04_design](04_design.md) + [06_style_guide](06_style_guide.md), so this phase is implementation, not decision-making._

- [x] Implement the **named text styles** (`text-h1`, `text-stat`, …) as utilities per [06_style_guide §5](06_style_guide.md).
- [x] Wire the **18 type colors** as tokens (`--color-type-*` + `typeColorVar`); contrast-checks completed ([D-027](03_decisions.md#d-027)) — all pass AA via `npm run audit:contrast`.
- [x] Build core primitives: `StatBar`, buttons, search input, type badge — all token-driven.
- [x] **Accessibility baseline** ([D-020](03_decisions.md#d-020)): landmarks (`main`/`search`), heading semantics, combobox ARIA, focus rings, alt text, reduced-motion.

**Exit:** a component playground renders the tokens and a static `StatBar` correctly, matching the [preview mockup].

---

## Phase 3 — Comparison Tool (MVP core)

_Goal: the actual product works._

- [x] **Search-as-you-type** over the local dataset (prefix-ranked), dropdown with sprite + name + type badges, keyboard nav. ([01_spec §2](01_spec.md)) — `SearchBar`
- [x] Results list with **pixel-sprite thumbnails**.
- [x] Two **selection slots** (Pokémon 1 / Pokémon 2) with a clean empty state. — `Compare` + `PokemonCard` empty state
- [x] Render the **six stat bars**, type-colored (primary type), per Pokémon. — `StatBar`
- [x] Compute and show **per-stat difference** (centered magnitude + caret toward winner). — `ComparisonCard`
- [x] **BST** per Pokémon + BST-delta in the referee.
- [x] **Speed verdict** ("X is faster"), vector icon.
- [x] TCG-style **Pokémon cards** flanking a center **referee**; responsive (referee drops below on small screens, D-010).
- [x] **Form selector** — toggle chips (Base · Mega X · …) that instantly swap art + stats for Pokémon with alternate forms. ([D-017](03_decisions.md#d-017)) — `FormChips`
- [x] **Hero-backdrop cards** (art as scrim'd backdrop) + full **comparison card** (mirrored bars). ([D-017](03_decisions.md#d-017))
- [x] **Swap** button (P1 ↔ P2). ([D-018](03_decisions.md#d-018))
- [x] **Type matchup** in the comparison card (attacker STAB vs defender typing, dual-type aware). ([D-018](03_decisions.md#d-018)) — `lib/typeChart.js` — _pulled forward from Phase 5_
- [x] Sync selection to the URL so a comparison can be copied/shared — done in Phase 3.5 as full path-based deep links (URL is the source of truth, [D-022](03_decisions.md#d-022)); the interim "query only, no router" step was skipped.

**Exit:** a user can search, pick two Pokémon, read a correct and attractive comparison, and share a link to it. ✅

---

## Phase 3.5 — Routing & Multi-Page

_Goal: introduce React Router now that a second page/route is actually needed. ([D-013](03_decisions.md#d-013))_

- [x] Add **React Router** (v8, data mode) and define routes (Home, Comparison, Credits, 404 + `/style` playground). ([D-022](03_decisions.md#d-022))
- [x] Promote the comparison to a proper **path-based deep link** (`/compare/<p1>/vs/<p2>`); URL is the single source of truth, with a query-param fallback for partial one-slot state.
- [x] Shared layout shell (`Layout`: sticky brand/nav header + `<main>` + attribution footer) across routes.

**Exit:** the app is multi-page with clean, shareable per-comparison URLs. ✅ (SSR/Cloudflare still deferred to Phase 4 launch.)

---

## Phase 4 — Pages, Polish & Launch

_Goal: a complete, showcase-ready site. This is where the **Cloudflare Workers/Wrangler** deploy layer is added (and React Router's Cloudflare/SSR mode, if adopted) — the end-state from [D-005](03_decisions.md#d-005)._

- [x] **Home** page: product-as-hero (live Volcarona vs Chandelure board), blunt suite-framed copy, corner mascot sprites, tools row. ([D-023](03_decisions.md#d-023))
- [x] **Credits** page: PokéAPI + sprite attribution, GitHub link (blunt pass). ([D-023](03_decisions.md#d-023))
- [x] **404** page, on-brand (built in Phase 3.5).
- [x] **Meta/SEO** (site-level): favicons + web manifest + theme-color, description, Open Graph + Twitter tags; OG image generated from `docs/og-image.html` → `public/og-image.png`. ([D-026](03_decisions.md#d-026)) — absolute OG/Twitter URLs set at deploy ([D-030](03_decisions.md#d-030)); _per-route titles/meta still await SSR_
- [x] **Logo + wordmark** — the flame Poké Ball favicon + "Statmon." wordmark serve as the mark (header + OG image).
- [x] **Accessibility pass**: keyboard, labels, alt text, skip link ([D-024](03_decisions.md#d-024)); full type-color **contrast audit** to AA with a reproducible checker ([D-027](03_decisions.md#d-027), `npm run audit:contrast`).
- [x] Implement the **mobile layout**: per-stat cards under 768px. ([D-010](03_decisions.md#d-010), [D-029](03_decisions.md#d-029))
- [x] Add the **Cloudflare Workers + Wrangler** deploy layer — shipped as a **static-assets SPA** (no Worker code); SSR adapter deferred (optional). ([D-005](03_decisions.md#d-005), [D-030](03_decisions.md#d-030))
- [x] Polished **README** and `/docs` up to date.
- [x] Final **Cloudflare production deploy** — live at https://statmon.noahparknguyen.workers.dev/. ([D-030](03_decisions.md#d-030))

**Exit:** MVP is live, looks great, works on phone and desktop, and the repo is presentable. 🎉 **✅ Done 2026-07-29.**

---

## Phase 5 — Fast-Follow (V2)

_Goal: sharpen the core and add the low-cost, high-value extras._

- [x] ~~**`FormChips` touch targets** — the one likely WCAG 2.5.8 (AA) spacing failure on the site.~~ **Closed as not-a-failure.** Measured rather than assumed, the chips pass via 2.5.8's spacing exception: 45–59 × 21px with a tightest neighbouring centre of **27.1px** against the 24px required, including Minior's eight-form wrapped worst case. It was a guess that had propagated into two documents and this checklist. `npm run sweep:widths` measures it every run, since the margin is only 3px. ([D-059](03_decisions.md#d-059), [D-042](03_decisions.md#d-042))
- [ ] Attacker-identity read (physical vs. special).
- [ ] Biggest-gap highlight.
- [x] **Type-effectiveness** between the two Pokémon — **shipped early** in Phase 3 as the attacker-STAB matchup on the comparison card, on the hardcoded `src/lib/typeChart.js` matrix ([D-018](03_decisions.md#d-018)).
- [x] **Generation-accurate stats** — Gen 1's single Special, historical base stats and typings, and per-generation type charts, behind one generation strip on `/compare` ([D-045](03_decisions.md#d-045), [D-046](03_decisions.md#d-046), [D-047](03_decisions.md#d-047)). _Not on the original V2 list — it came out of actually playing the games the project is about._
- [~] Bar-fill **animation** (reduced-motion aware) — **partially shipped:** `.animate-grow-w` runs on Home's `FeaturedComparison` only ([D-023](03_decisions.md#d-023)). The `/compare` tool's own bars still render instantly; extending it there is what remains.
- [ ] Copy-link button, **random matchup**, full keyboard flow.
- [ ] Search **filters** (type / generation), recently-compared list.
- [ ] **About** page; **light-mode** toggle.
- [~] Tooling — **ESLint + Prettier are both in** (flat ESLint config + `npm run lint`; Prettier as a devDependency with `npm run format` / `format:check`, whole tree passing on stock config). **Vitest is in** ([D-038](03_decisions.md#d-038)): 94 tests across six files — the stat math, the type-matchup engine, dataset queries, the codec (including the whole-dataset round-trip), the dex sort/filter/URL logic, and a `react-dom/server` smoke test of every route — node environment, no jsdom. **GitHub Actions CI is in** (`.github/workflows/ci.yml`): every check runs on push and PR, cheapest-first, ending with the browser sweep. **Playwright** and auto-deploy to Cloudflare are still outstanding — though `scripts/sweep-widths.mjs` now covers, headlessly and without a framework, the specific thing Playwright was wanted for: real layout measurement across widths.

**Exit:** the comparison tool feels finished and the repo has real engineering rigor.

---

## Phase 6+ — The Suite (Someday)

_Goal: grow Statmon into a small family of tools & games, one clean addition at a time. Near-term priorities firmed in [D-023](03_decisions.md#d-023) — all reuse the existing data layer + type engine, so each is an addition, not a rewrite. The Home tools row already advertises them ("soon")._

> **Definition of done for every tool below:** it ships with a **live preview on Home** ([D-043](03_decisions.md#d-043)) — a `FeaturePreview` section built from the tool's own components against real data, not a mockup. A tool is not finished until Home advertises it.

**Near-term (the suite the Home page promises):**

- [x] **Full-dex stats table** — shipped at `/dex` ([D-039](03_decisions.md#d-039)), with its Home preview ([D-043](03_decisions.md#d-043)). Every Pokémon in one table, **sortable** on all six stats + BST + name + dex number, **searchable** by name, **filterable** by any number of types and generations at once ([D-040](03_decisions.md#d-040)), with alternate forms toggleable; pixel sprite per row and a type-tinted proportional fill behind each stat. The whole view lives in the URL, so a sorted, filtered dex is a shareable link. Windowed rendering keeps ~26 rows in the DOM out of 1,259. _(It did not reuse `StatBar.jsx` — see Notes above.)_
- [x] **Type chart** — shipped at `/types` ([D-051](03_decisions.md#d-051)): the 18×18 grid, **dual-type aware** via a tier readout, generation-aware, with its Home preview. Built on `lib/typeChart.js` as predicted, plus `lib/typeView.js` for the URL and the tiers.
- [ ] **Abilities** — two features that share one dataset, and the second is the reason the first is worth building.

  1. **Show them.** List each Pokémon's abilities on the comparison card, hidden ability marked. Most Pokémon have a choice of two or three, so this needs a selector the way alternate forms do (`FormChips` is the pattern) — the chosen ability is part of the view and therefore belongs in the URL ([D-022](03_decisions.md#d-022)).
  2. **Let them change the matchup.** The comparison card's STAB block currently scores Ground into Electric at 2× for Krookodile vs Eelektross — but Eelektross has **Levitate**, so the true answer is **0×**. An ability that alters type effectiveness has to feed `effectiveness()` alongside the era's chart, or the board is confidently wrong in exactly the cases people look up.

  **What the research already settled** ([02_research §13](02_research.md#13-abilities-for-the-planned-abilities-feature)): the roster and its per-generation history come straight from PokéAPI, in the same `until` shape `lib/eras.js` already reads — but the **mechanical effect is prose only** (`"Evades Ground moves."`), so the ~20 effectiveness-modifying abilities must be a hardcoded table beside `lib/typeChart.js`, and unlike the chart it **cannot be verified against PokéAPI** by `build:data`. Unit tests have to stand in for that guard.

  **The era interaction, free if designed in from the start:** abilities arrived in **Generation III**, so a Gen 1 or Gen 2 board should show none at all — the `?asof=` lens already expresses that. _+ Home preview, per [D-043](03_decisions.md#d-043)._

- [ ] **Type-advantage quiz game** — quiz the user on the matchup between two (possibly dual) types. Sits directly on the type engine; a clean, well-scoped first game for retention + showcasing that Statmon is more than one tool. _+ Home preview._

**Later:**

- [ ] **Type coverage / weakness calculator** (reuses the matchup matrix).
- [ ] **Speed-tier tool.**
- [ ] More **games** — "Guess the Pokémon by its stats," "Higher/Lower BST," silhouette guess, daily puzzle.
- [ ] **Team builder / analyzer.**
- [x] **Era-aware dex table** — sort the whole dex as of a chosen generation ("who was fastest in Gen 1"), with the rows capped to what existed then ([D-049](03_decisions.md#d-049)).
- [ ] **Keep data current** as new Pokémon/generations release (re-run the parameterized pipeline).
- [ ] Stretch: EV/IV planner, Nuzlocke helper, dex trackers, per-comparison OG images.

**Exit:** none — this is the living backlog Statmon grows into.

---

## Dependency Notes

- Phases 0 → 1 → 2 → 3 → 4 are largely **sequential** (each needs the prior). Phase 2 (design) can overlap Phase 1 (data) since they don't touch the same files.
- The **type-effectiveness matrix** (Phase 5) is a prerequisite for several Phase 6 tools — worth building cleanly when it first appears.
- Keep [03_decisions](03_decisions.md) updated as provisional calls (fonts, gen scope, mobile) get firmed up during Phases 2–4.
