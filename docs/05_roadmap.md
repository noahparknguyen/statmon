# Statmon — Roadmap (Step 5)

_The phased build plan / task checklist: what to implement, in order. Sequenced from the [01_spec](01_spec.md) scope and grounded in the [03_decisions](03_decisions.md) log. Phases 0–4 get to a polished MVP launch; Phases 5+ are the fast-follow and the suite. Check items off as they land._

> Legend: each phase lists an **exit criterion** — the concrete thing that's true when the phase is done.

---

## Current status (2026-07-29 — Session 4, live)

**Done — the MVP is live.** Phases 0–4 are complete: a polished, multi-page, self-contained, WCAG-AA site, responsive from phone to desktop, deployed on Cloudflare Workers at **https://statmon.noahparknguyen.workers.dev/**. The one Phase-4 item intentionally left for later is the optional SSR/framework-mode upgrade (per-route meta).

- **Phases 0–2:** plain Vite + React (JS) + Tailwind v4 CSS-first tokens; build-time data pipeline → **1,259 entries**; design-system primitives.
- **Phase 3 — comparison tool:** search, two hero cards with form switching, the comparison card (BST summary, STAB matchup, mirrored **type-colored** diffs, speed banner), swap.
- **Phase 3.5 — routing:** React Router **v8** (data mode); shared `Layout` (header/nav/footer + `main`); routes `/` Home, `/compare` (+ `/compare/<p1>/vs/<p2>`), `/credits`, `/style`, `*` 404; **URL is the single source of truth** ([D-022](03_decisions.md), `src/lib/compareUrl.js`).
- **Phase 4:** **Home** product-as-hero (live Volcarona-vs-Chandelure board, blunt suite copy, corner mascot sprites, tools row) + blunt **Credits** ([D-023](03_decisions.md)); **image vendoring** — 2,513 sprites/artwork self-hosted + committed ([D-025](03_decisions.md)); **meta/favicons/OG** incl. the HTML-rendered OG generator `docs/og-image.html` ([D-026](03_decisions.md)); **accessibility** — skip link + landmarks ([D-024](03_decisions.md)) and a full **WCAG-AA contrast audit** with a reproducible checker ([D-027](03_decisions.md)); **mobile per-stat layout** — `ComparisonCard` + `FeaturedComparison` collapse to stacked per-stat cards below 768px ([D-010](03_decisions.md), [D-029](03_decisions.md)); the MIT `LICENSE` and a personal-credit footer line are in ([D-029](03_decisions.md)); **deployed** to Cloudflare Workers as static assets, with absolute OG URLs set ([D-030](03_decisions.md)).

**Deferred (optional, post-MVP):** the React Router **framework/SSR mode** upgrade ([D-005](03_decisions.md), [D-022](03_decisions.md)) — the data-mode config migrates cleanly. It would add **per-route `<title>`/meta**; the site-level OG/meta is already set with absolute URLs. Not required for the MVP — revisit if per-comparison social unfurls become worth it.

**Launch-pass leftovers:** all done — personal-credit line + `LICENSE` ([D-029](03_decisions.md)), the OG image (`public/og-image.png`), and the production deploy ([D-030](03_decisions.md)). _(GitHub repo Settings → Social preview can still take the 1280×640 frame from `docs/og-image.html` if you want the repo card branded.)_

**npm scripts:** `dev` · `build` · `build:data` · `vendor:images` (after `build:data`) · `audit:contrast` · `lint` · `deploy` (`build` + `wrangler deploy`).

**Notes:** `StatBar.jsx` is used only by the `/style` playground (kept for the future stats table).

---

## Phase 0 — Foundation & Scaffolding

_Goal: a minimal, running local app with the styling system wired up. Start simple — no Cloudflare, no router yet. ([D-013](03_decisions.md))_

- [x] Scaffold a **plain Vite + React (JavaScript)** app: `npm create vite@latest statmon -- --template react`. ([D-013](03_decisions.md), [D-014](03_decisions.md))
- [x] Add **Tailwind** (v4, `@tailwindcss/vite`).
- [x] Finalize the **style guide** ([06_style_guide](06_style_guide.md)) and translate it into the **Tailwind theme + design tokens** in `src/index.css` (colors, 11-step type scale, 17 named text styles, radii, breakpoints, motion) — everything token-driven from here on.
- [x] Wire fonts (Space Grotesk + Inter) and page meta in `index.html`.
- [x] Confirm local dev + build run clean (`npm run dev` / `npm run build`).
- [x] Set up the repo: `.gitignore`, license (MIT), README, commit hygiene; published to GitHub.

**Exit:** a blank, on-brand Statmon app runs locally with the full token system available in Tailwind. (Cloudflare deploy + routing come later — see Phase 3.5 and Phase 4.)

---

## Phase 1 — Data Pipeline

_Goal: a local JSON dataset + sprites, generated on command. No UI yet._

- [x] Write the **build-time fetch script** (`scripts/build-data.mjs`) hitting `/pokemon-species` + `/pokemon`, rate-limited + cached + retrying. ([D-001](03_decisions.md), [D-016](03_decisions.md))
- [x] Transform to the slim schema from [01_spec §4](01_spec.md): id, slug, name, types, six stats, bst, generation, `forms`, `isDefault`, sprite/artwork URLs.
- [x] Cover **all generations — the full National Dex** — via the species list (no hardcoded gen cap). ([D-009](03_decisions.md))
- [x] Handle **Megas/regional/battle forms** as first-class entries with counterpart refs; skip cosmetic (stat+type-identical) forms. ([D-003](03_decisions.md))
- [x] Normalize to the **six-stat schema**; precompute BST. ([D-004](03_decisions.md))
- [x] Built-in **validation summary** (counts per generation, missing stats/sprites, form groups).
- [x] **Run** `npm run build:data` — verified: 1,259 entries, 0 missing stats, gen counts sum correctly, 414 with alt-forms (incl. the new Legends Z-A Megas). 3 entries lack a pixel sprite (pikachu-starter, eevee-starter, zygarde-mega) but have artwork → search thumbnail falls back to `spriteUrl ?? artworkUrl`.
- [x] **Vendor images** from `PokeAPI/sprites` — self-hosted **both** pixel sprites (`public/sprites/{id}.png`) and official artwork (`public/artwork/{id}.webp`, ≤475px); URL fields rewritten to local paths with `spriteUrl ?? artworkUrl` fallback; committed. Run via `npm run vendor:images` (`scripts/vendor-images.mjs`). ([D-002](03_decisions.md), [D-025](03_decisions.md))
- [ ] Generate the **type → color** map (18 types) — already in CSS tokens; emit a JSON copy if the data layer needs it.

**Exit:** `npm run build:data` produces a validated `src/data/pokemon.json` the app can import; sprites vendored locally.

---

## Phase 2 — Design System

_Goal: turn the tokens (already in Tailwind from Phase 0) into reusable component primitives. Design is pre-specified in [04_design](04_design.md) + [06_style_guide](06_style_guide.md), so this phase is implementation, not decision-making._

- [x] Implement the **named text styles** (`text-h1`, `text-stat`, …) as utilities per [06_style_guide §5](06_style_guide.md).
- [x] Wire the **18 type colors** as tokens (`--color-type-*` + `typeColorVar`); contrast-checks completed ([D-027](03_decisions.md)) — all pass AA via `npm run audit:contrast`.
- [x] Build core primitives: `StatBar`, buttons, search input, type badge — all token-driven.
- [x] **Accessibility baseline** ([D-020](03_decisions.md)): landmarks (`main`/`search`), heading semantics, combobox ARIA, focus rings, alt text, reduced-motion.

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
- [x] **Form selector** — toggle chips (Base · Mega X · …) that instantly swap art + stats for Pokémon with alternate forms. ([D-017](03_decisions.md)) — `FormChips`
- [x] **Hero-backdrop cards** (art as scrim'd backdrop) + full **comparison card** (mirrored bars). ([D-017](03_decisions.md))
- [x] **Swap** button (P1 ↔ P2). ([D-018](03_decisions.md))
- [x] **Type matchup** in the comparison card (attacker STAB vs defender typing, dual-type aware). ([D-018](03_decisions.md)) — `lib/typeChart.js` — _pulled forward from Phase 5_
- [x] Sync selection to the URL so a comparison can be copied/shared — done in Phase 3.5 as full path-based deep links (URL is the source of truth, [D-022](03_decisions.md)); the interim "query only, no router" step was skipped.

**Exit:** a user can search, pick two Pokémon, read a correct and attractive comparison, and share a link to it. ✅

---

## Phase 3.5 — Routing & Multi-Page

_Goal: introduce React Router now that a second page/route is actually needed. ([D-013](03_decisions.md))_

- [x] Add **React Router** (v8, data mode) and define routes (Home, Comparison, Credits, 404 + `/style` playground). ([D-022](03_decisions.md))
- [x] Promote the comparison to a proper **path-based deep link** (`/compare/<p1>/vs/<p2>`); URL is the single source of truth, with a query-param fallback for partial one-slot state.
- [x] Shared layout shell (`Layout`: sticky brand/nav header + `<main>` + attribution footer) across routes.

**Exit:** the app is multi-page with clean, shareable per-comparison URLs. ✅ (SSR/Cloudflare still deferred to Phase 4 launch.)

---

## Phase 4 — Pages, Polish & Launch

_Goal: a complete, showcase-ready site. This is where the **Cloudflare Workers/Wrangler** deploy layer is added (and React Router's Cloudflare/SSR mode, if adopted) — the end-state from [D-005](03_decisions.md)._

- [x] **Home** page: product-as-hero (live Volcarona vs Chandelure board), blunt suite-framed copy, corner mascot sprites, tools row. ([D-023](03_decisions.md))
- [x] **Credits** page: PokéAPI + sprite attribution, GitHub link (blunt pass). ([D-023](03_decisions.md))
- [x] **404** page, on-brand (built in Phase 3.5).
- [x] **Meta/SEO** (site-level): favicons + web manifest + theme-color, description, Open Graph + Twitter tags; OG image generated from `docs/og-image.html` → `public/og-image.png`. ([D-026](03_decisions.md)) — _per-route titles/meta + absolute OG URLs land with SSR/deploy_
- [x] **Logo + wordmark** — the flame Poké Ball favicon + "Statmon." wordmark serve as the mark (header + OG image).
- [x] **Accessibility pass**: keyboard, labels, alt text, skip link ([D-024](03_decisions.md)); full type-color **contrast audit** to AA with a reproducible checker ([D-027](03_decisions.md), `npm run audit:contrast`).
- [x] Implement the **mobile layout**: per-stat cards under 768px. ([D-010](03_decisions.md), [D-029](03_decisions.md))
- [x] Add the **Cloudflare Workers + Wrangler** deploy layer — shipped as a **static-assets SPA** (no Worker code); SSR adapter deferred (optional). ([D-005](03_decisions.md), [D-030](03_decisions.md))
- [x] Polished **README** and `/docs` up to date.
- [x] Final **Cloudflare production deploy** — live at https://statmon.noahparknguyen.workers.dev/. ([D-030](03_decisions.md))

**Exit:** MVP is live, looks great, works on phone and desktop, and the repo is presentable. 🎉 **✅ Done 2026-07-29.**

---

## Phase 5 — Fast-Follow (V2)

_Goal: sharpen the core and add the low-cost, high-value extras._

- [ ] Attacker-identity read (physical vs. special).
- [ ] Biggest-gap highlight.
- [ ] **Type-effectiveness** between the two Pokémon (build the type-matchup matrix).
- [ ] Bar-fill **animation** (reduced-motion aware).
- [ ] Copy-link button, **random matchup**, full keyboard flow.
- [ ] Search **filters** (type / generation), recently-compared list.
- [ ] **About** page; **light-mode** toggle.
- [ ] Tooling: **ESLint/Prettier**, **Vitest** (stat math + data transforms), **Playwright** smoke test, **GitHub Actions → Cloudflare** CI/CD.

**Exit:** the comparison tool feels finished and the repo has real engineering rigor.

---

## Phase 6+ — The Suite (Someday)

_Goal: grow Statmon into a small family of tools & games, one clean addition at a time. Near-term priorities firmed in [D-023](03_decisions.md) — all reuse the existing data layer + type engine, so each is an addition, not a rewrite. The Home tools row already advertises them ("soon")._

**Near-term (the suite the Home page promises):**

- [ ] **Full-dex stats table** — every Pokémon in one table, **sortable / searchable / filterable** by stat, name, and type; pixel sprite per row. Reuses the built dataset (1,259 entries) and the kept `StatBar.jsx`. Highest-value companion to comparison.
- [ ] **Type chart** — the 18×18 effectiveness grid, **dual-type aware**. Mostly presentation over `lib/typeChart.js`, which already does dual-type STAB math for the comparison card.
- [ ] **Type-advantage quiz game** — quiz the user on the matchup between two (possibly dual) types. Sits directly on the type engine; a clean, well-scoped first game for retention + showcasing that Statmon is more than one tool.

**Later:**

- [ ] **Type coverage / weakness calculator** (reuses the matchup matrix).
- [ ] **Speed-tier tool.**
- [ ] More **games** — "Guess the Pokémon by its stats," "Higher/Lower BST," silhouette guess, daily puzzle.
- [ ] **Team builder / analyzer.**
- [ ] **Keep data current** as new Pokémon/generations release (re-run the parameterized pipeline).
- [ ] Stretch: EV/IV planner, Nuzlocke helper, dex trackers, per-comparison OG images.

**Exit:** none — this is the living backlog Statmon grows into.

---

## Dependency Notes

- Phases 0 → 1 → 2 → 3 → 4 are largely **sequential** (each needs the prior). Phase 2 (design) can overlap Phase 1 (data) since they don't touch the same files.
- The **type-effectiveness matrix** (Phase 5) is a prerequisite for several Phase 6 tools — worth building cleanly when it first appears.
- Keep [03_decisions](03_decisions.md) updated as provisional calls (fonts, gen scope, mobile) get firmed up during Phases 2–4.
