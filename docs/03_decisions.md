# Statmon — Decisions (Step 3)

_A dated log of what's decided and **why**. The highest-value doc for a solo dev: six weeks from now, "why did I pick X over Y?" is answered here instead of re-litigated. Newest entries at the top. Entries marked **Provisional** are current leans pending a build-time gut-check; **Firm** are settled._

---

## 2026-07-29 — Session 3 (mobile per-stat layout · launch leftovers)

<a id="d-029"></a>

### D-029 · Mobile per-stat cards implemented + launch leftovers closed — **Firm**

**Decision.** Implemented the [D-010](#d-010) mobile collapse: both the center
`ComparisonCard` (the tool) and Home's `FeaturedComparison` swap their mirrored
5-column `ROW_COLS` grid for stacked **per-stat cards** below `md` (768px), each
showing **P1's bar+value above P2's bar+value** for one stat, a header row with
the stat label and a **vertical caret Δ** (bars are stacked, not side-by-side,
so the left/right carets used at desktop width don't apply), and **no
horizontal scroll**. The desktop (≥768px) mirrored grid is untouched — both
components gate the existing row block with `hidden md:block` and add a
sibling `md:hidden` per-stat stack. The shared card/row/diff markup was pulled
into one new file, `CmpStatCard.jsx`, imported by both components rather than
duplicated — the same split already used for `TypeBadge.jsx`. Also closed the
two small launch-pass leftovers: a root **MIT `LICENSE`** (matching
`package.json`'s new `"license": "MIT"`) and a plain-text **"Built by Noah
Park-Nguyen"** credit in the shared footer (`Layout.jsx`), alongside the
existing PokéAPI/fan-project attribution and GitHub link.

**Follow-up fix.** Home's heads row (sprite + name + type badges, flanking the
STAB pills) also stacks below **`md` (768px)** — centered as a group — rather
than staying a cramped 3-column grid down to the smallest widths; single-word
names like "Volcarona"/"Chandelure" can't wrap, so they were truncating with
"…" in the narrow range below the board's `max-w-2xl` cap. Unifying this with
the stats block's existing `md` breakpoint means the whole board now flips
from stacked to grid at one consistent width.

**Why.** A side-by-side five-column layout is unreadable at phone widths — the
two `1fr` bar columns and the 3.25rem diff column get crushed under ~375px.
Stacking P1-over-P2 per stat keeps every comparison glanceable with zero
scroll, reuses the exact same stat data/math (`STAT_ORDER`, `statPct`,
`typeColorVar`), and — per [D-019](#d-019)'s spacing rules and
[06_style_guide §12](06_style_guide.md)'s token discipline — the new cards use
only existing tokens/utilities (`text-overline`, `text-caption`, `text-diff`,
`border-border-subtle`, `bg-elevated`), no new raw values. Keeping Home and the
tool on one shared `CmpStatCard` component preserves the cross-page visual
consistency called out in [D-023](#d-023). Resolves the last open item on
[D-010](#d-010) and the mobile-layout line in
[05_roadmap Phase 4](05_roadmap.md).

---

## 2026-07-28 — Session 2 (Phase 3.5 routing · Home/Credits · vendoring · meta · a11y)

<a id="d-028"></a>

### D-028 · Force-emit tokens with `@theme static` — **Firm**

**Decision.** `src/index.css` uses **`@theme static`** rather than plain `@theme`.

**Why.** Tailwind v4 **tree-shakes theme variables** it doesn't see referenced by a scanned utility class. Statmon consumes many tokens — especially the 18 **`--color-type-*`** — only through **inline `var(--color-…)` in JS** (`typeColorVar`, `typeTextVar`, bar fills), which the class scanner never sees. Under plain `@theme` those vars survived only _incidentally_, because the old StyleGuide contained literal `bg-type-*` classes. Rebuilding StyleGuide to use `<TypeBadge>` (inline `var()`) removed the last class reference, so Tailwind dropped every type-color variable and **type colors vanished app-wide** (Home, Compare, /style). `@theme static` forces every token to emit regardless of class usage — the correct posture for a token system that references tokens via inline styles. Trade-off: a marginally larger `:root` (all tokens emitted), negligible. Surfaced while rebuilding the [/style page](../src/pages/StyleGuide.jsx) to render real components.

<a id="d-027"></a>

### D-027 · Type-color contrast audit → AA — **Firm**

**Decision.** Ran a full WCAG contrast audit and fixed the failures so every text/graphic pairing meets AA. Built a **reproducible checker** — `scripts/contrast-audit.mjs` (`npm run audit:contrast`) parses the real `--color-*` tokens from `index.css` (resolving `var()` chains) and computes ratios for four pairing groups: semantic text on each surface, type color as diff-number text, type badge labels, and stat-bar fill vs. track. Kept as a regression tool.

**Findings + fixes.** Passing already: `primary`/`secondary`/`accent` text (7–18:1) and all 18 type colors as **bar fills** vs. the track (non-text ≥3:1). Three failures, all fixed:

- **`tertiary` (+ `diff-tie`) text** was ~3.4–4.0 (needs 4.5) — used for all small overlines/captions/labels. Bumped `neutral-500 → neutral-400` (now ~5–6:1).
- **Type badges** — the 5 mid-luminance types (fighting, poison, ghost, dragon, dark) used _white_ text at ~3.5–4.0. Those colors score far better with **near-black text** (~4.4–5.2), so `typeTextVar` now returns dark text for **all** badges (uniform; supersedes the split light/dark scheme).
- **`dragon`** was the lone color failing as both badge and diff-number text; nudged lighter **`#8556ff → #9268ff`** to clear both (bars only improve).

**Result.** `npm run audit:contrast` reports **all pairings pass** (text ≥4.5, non-text ≥3.0). Resolves the ⚠ from [04_design §3](04_design.md); refines the diff-color choice in [D-023](#d-023) and the palette in [D-012](#d-012).

<a id="d-026"></a>

### D-026 · Meta/favicons + an HTML-rendered social image — **Firm**

**Decision.** Wired the full **favicon set** (favicon.io: svg/ico/16/32/apple-touch + web manifest + `theme-color` `#0b0c0f`) into `index.html` and branded `site.webmanifest` (name/short_name/description, dark theme + background). Added a blunt `description` plus **Open Graph** and **Twitter** (`summary_large_image`) tags. The **OG image is generated from HTML** rather than Figma: `docs/og-image.html` renders a clean centered lockup — favicon + "Statmon." wordmark + subtitle — using the site's own fonts/tokens, in **two exactly-sized frames** — OG **1200×630** and GitHub social **1280×640** — exported by hand via DevTools "Capture node screenshot" (OG → `public/og-image.png`; GitHub → repo Settings → Social preview).

**Why.** Rendering the social image from the same CSS/fonts as the site guarantees brand consistency and keeps it version-controlled and tweakable — the same HTML→image approach Vercel-OG/satori automate; a manual screenshot is fine for a one-off. 1200×630 is the OG/Twitter/Slack/Discord standard; GitHub prefers 1280×640 (2:1). **TODO(deploy):** `og:url` + `og:image` must become **absolute** production URLs for scrapers (flagged inline in `index.html`); truly per-route titles/meta arrive with framework/SSR mode at deploy.

<a id="d-025"></a>

### D-025 · Images vendored + committed to the repo (CC0) — **Firm**

**Decision.** Executed the image vendoring from [D-002](#d-002). `scripts/vendor-images.mjs` downloaded all **2,513** images from `PokeAPI/sprites` → **`public/sprites/{id}.png`** (1,256 pixel sprites, kept as PNG) + **`public/artwork/{id}.webp`** (1,257 official-artwork, resized ≤475px, WebP q82). `pokemon.json`'s `spriteUrl`/`artworkUrl` were rewritten to local paths and `build-data.mjs` now emits local paths on future runs. The vendored assets are **committed to the repo** (not git-ignored). This closes [D-001](#d-001)'s "no runtime dependency" goal for images too — zero `raw.githubusercontent` hits at runtime.

**Why.** `PokeAPI/sprites` is **CC0 1.0** (public-domain dedication) — redistribution, modification, and commercial use are expressly permitted — and PokéAPI's fair-use policy actively _encourages_ self-hosting over hotlinking. The assets are **static**, so committing them adds no meaningful git-history churn and keeps the Cloudflare deploy fully self-contained (no build-time GitHub dependency; ~34 MB one-time). **Caveat (not legal advice):** the images remain © The Pokémon Company — CC0 covers PokéAPI's contribution, not TPC's underlying copyright/trademark (the license file says as much) — so Statmon relies on the same fan-use tolerance every PokéAPI-based project does, with the unofficial-fan-project disclaimer in the footer + Credits. Licensing details in [02_research §11](02_research.md).

<a id="d-024"></a>

### D-024 · Full polish & accessibility review — **Firm**

**Decision.** A professional pass over the whole app once the core (comparison + routing + Home/Credits) landed, in the spirit of [D-020](#d-020).

**Changed.** Added a **skip-to-content link** + `main#main` landmark to `Layout`; an **sr-only heading** on the Home featured board (`Example comparison: Volcarona vs Chandelure`) so screen readers get context for the stat dump; applied the Home mascot-art polish (explicit token values, `decoding="async"`, consistent `-translate-x` sign); refreshed the stale **`StatBar` comment**; and **brought the README fully current** (routing, Home at `/` and Compare at `/compare`, new files, `D-001…D-024`, React Router v8, updated status/structure).

**Confirmed clean.** Token discipline (components reference tokens, never raw hex/px; shadows use `rgba` literals by existing convention); decorative-image a11y (`alt="" aria-hidden` on the Home illustrations, favicon, and search sprites; descriptive `alt` on card art + in-card sprites); combobox/listbox ARIA on search; visible `:focus-visible` rings; `prefers-reduced-motion` honored (incl. the CSS `animate-grow-w`); one `<h1>` per page + sane heading order; landmarks (`header`/`nav`/`main`/`footer`).

**Outstanding (tracked to Phase 4 / launch).**

- **Full 18-type color-contrast audit** (the ⚠ from [04_design §3](04_design.md)). Watch item: `--color-tertiary` (`#6b7280`) on `--color-base` (`#0b0c0f`) is ≈ 4:1 — under WCAG AA 4.5 for small text (labels/overlines/captions). Resolve system-wide in the audit rather than per-component.
- **Per-route `<title>`/OG meta** and **focus/scroll reset on navigation** — land with the meta pass + framework/SSR mode.
- ~~Delete dead `src/components/ComparisonReferee.jsx`~~ — **done** (was a re-export stub with no importers).

<a id="d-023"></a>

### D-023 · Home = product-as-hero; Volcarona + Chandelure mascots; blunt suite copy; type-colored diffs — **Firm**

**Decision.**

- **Product-as-hero.** The Home hero **is** the product: a live, fixed featured comparison rendered by `FeaturedComparison.jsx` (**Volcarona vs Chandelure**, pulled from the real dataset via `getBySlug`), reusing the comparison tool's exact visual language (mirrored type-colored bars, type-tinted center diffs, the flame "Higher total +N" delta, the flame speed banner, and — in the head center — the attacker's **STAB** effectiveness as compact type-tinted pills). Bars grow in once on mount (pure-CSS `animate-grow-w`, no effect). **Volcarona + Chandelure are adopted as the site's pseudo-mascots**: their **pixel sprites sit inside the comparison cards**, while their **official-art illustrations peek out from behind** the board's left/right edges (soft drop-shadow, `lg`+ only) for a nostalgic feel.
- **Anti-generic direction.** I explicitly rejected the stock dark-SaaS hero — radial purple **glow**, gradient-fill wordmark, centered "one clear answer" pitch + twin pill CTAs — because those are the hallmarks of AI-generated sites (I flagged the glow specifically). The rule going forward: **derive the visuals from the product's own domain** (stat bars, type colors, the comparison mechanic itself), which no template can generically reproduce. Genericness comes from borrowing generic solutions; distinctiveness comes from the subject matter.
- **Blunt, suite-framed copy.** Home header **"Statmon."** + sub **"A simple set of Pokémon tools."** — frames the whole **site** (a small growing suite), not just the comparison tool. Each page H1 follows the same "Word**.**" motif with the accent dot (Compare page: **"Compare."** + "Visualizes the difference between two Pokémon."). No corporate/pitch language anywhere; the Home CTA is **"Try it out."**, and a "tools" row (Comparison live; Dex table / Type chart / Games — soon) backs the promise. The shared header pairs the flame Poké Ball **favicon** with the wordmark.
- **Gradient budget.** The Chandelure flame gradient stays reserved to the **two** spots the tool already uses it (BST delta + speed banner); Home reuses exactly those and adds none. Sparing use is intentional (my call: gradients OK if rare).
- **Type-colored diffs.** The center difference number + caret are now tinted with the **winner's primary type color** in **both** `ComparisonCard` (the tool) and the Home board — a readability + consistency win (supersedes the flat white `text-primary` diff from [D-020](#d-020)/[D-021](#d-021)).
- **Cross-page consistency.** Home, Compare, and Credits share one language: `bg-surface` panels + `border-border-subtle` + `rounded-lg`, type-colored bars, **solid** `TypeBadge` pills, Space Grotesk display, Inter/tabular stats, tertiary uppercase overlines.

**Why.** The comparison tool's own UI is Statmon's strongest, most specific visual asset — showing it beats a generic glowy "tell." Framing Home around the site (not one tool) sets up the suite. Honoring both of my favorite Pokémon (Volcarona mascot + Chandelure palette, [D-012](#d-012)) as mascots makes the brand personal. Process note: mockups were iterated as **standalone HTML** (real tokens/fonts/art) rather than the inline widget tool, which forbids the dark/gradient/glow this design needs.

**Suite roadmap firmed.** Near-term post-launch tools, in priority order: (1) **full-dex stats table** — sortable/searchable/filterable by stat, name, type (reuses the built dataset + the kept `StatBar.jsx`); (2) **type chart** — 18×18, dual-type aware (reuses `lib/typeChart.js`); (3) **type-advantage quiz game** (sits on the same type engine). All were already anticipated in [00_brainstorm §5](00_brainstorm.md); this promotes them to the concrete near-term backlog. See [05_roadmap Phase 6](05_roadmap.md).

<a id="d-022"></a>

### D-022 · Routing: React Router **v8**, data mode, URL as source of truth — **Firm**

**Decision.** Add **React Router v8** (`react-router`; v8 is the current major and a non-breaking "boring" upgrade over the v7 targeted in [D-005](#d-005)) in **data mode** (`createBrowserRouter` + `RouterProvider`), client-side only. Routes: `/` (Home), `/compare` + `/compare/:p1/vs/:p2` (Comparison), `/credits`, `/style` (the design-token playground), and `*` (404) — all under a shared `Layout` shell (sticky brand/nav header, `<main>` landmark, attribution footer). The comparison's **selection is derived from the URL each render (URL = single source of truth)**: the shareable path deep link when both slots are filled, a query param for a partial one-slot state, `/compare` when empty. Every pick / form-toggle / swap just `navigate`s (with `replace`) to the URL for the next state — so back/forward, manual edits, and shared links all work with no local selection state to sync. Slugs resolve synchronously via `getBySlug` (the dataset is a static import).

**Why.** Data mode is client-side today (satisfies [D-013](#d-013)'s "defer Cloudflare/SSR to Phase 4") **and** framework mode is literally "data mode packaged as a full-stack framework," so its loader/data-route patterns are the smoothest migration onto the [D-005](#d-005) Cloudflare/SSR end-state — the eventual server slug-resolution drops into a route loader with no restructure. v8 chosen over v7 because it's the current release, the upgrade is non-breaking, and the project already meets its baselines (React 19.2.7, Vite 8). URL-as-source-of-truth is the idiomatic data-mode pattern and eliminates the state/URL desync bugs that a local-`useState` mirror invites. Research: [02_research §10](02_research.md).

**Also (cleanup):** `App.jsx` now just mounts `<RouterProvider>`; the old page-level `Statmon.` header moved into the shared `Layout` header, and `Compare` gained its own `<h1>` ("Compare Pokémon").

---

## 2026-07-27 — Session 0 (planning & research)

<a id="d-021"></a>

### D-021 · Keep magnitude + caret diffs (not signed); dex for forms — **Firm**

**Decision.** Keep the comparison difference as a **magnitude + a caret pointing to the winner** (all-positive numbers), rather than switching to **signed-from-Pokémon-1** values (+/−). Considered signed because P1 is an explicit subject (attacker), which would give a consistent P1-relative reading — but the caret already provides a consistent, glanceable "who + by how much," a caret is more legible than a small minus sign, all-positive numbers read lighter, and signed would force a wall of negatives for weak attackers and turn the clean **"Higher total: {leader} +N"** headline into an awkward negative. Net: signed didn't add enough to justify the cost. ("Don't break what works.")

**Also (minor polish):** alternate forms now show their **species' National Dex number** (form entries have synthetic ids > 10000, so I read the dex from the group's default form) — e.g. Charizard Mega X → #0006; and the comparison row's stat-label caption was nudged up a few px for breathing room.

<a id="d-020"></a>

### D-020 · Diff cell shows stat label; consistency + a11y + docs review — **Firm**

**Decision.** Each comparison row's center cell shows the **signed difference** (`+N`) **on the row centerline, aligned with the flanking bars** (same data line), with the **stat label as a caption above** it and the caret in a fixed side slot. (Best practice: same-tier data shares a baseline; the label is a caption/header.) To give the caption room, stat rows were bumped 32→**36px** in both cards, so the card total is now **568px** (top 272 + stats 240 + footer 56) — this supersedes the 544/32px figures in [D-019](#d-019). Completed a review pass:

- **Tokens:** tokenized the on-art bar track as `--color-track-glass` (was `bg-white/15`); confirmed every color/size across components references a token (type/effectiveness colors go through `color-mix` on the type vars).
- **Accessibility:** added `<main>` and `role="search"` landmarks; heading semantics (Pokémon names as `<h2>`, an sr-only "Comparison" `<h2>`); proper `combobox`/`listbox`/`option` ARIA + a "No matches" state on search; global pointer cursor for buttons; verified alt text, focus rings, keyboard nav, reduced-motion.
- **Docs:** refreshed [04_design §5](04_design.md) (current three-card layout) and [06_style_guide §3](06_style_guide.md) (new token) to match the built UI.

**Why.** I wanted the label back for at-a-glance row identity, plus a professional consistency/accessibility bar before continuing to the rest of the project.

<a id="d-019"></a>

### D-019 · Spacing & hierarchy pass (proximity rule, 8pt rhythm) — **Firm**

**Decision.** Rework card spacing on an **8pt vertical rhythm** using the **proximity rule (internal ≤ external)**: tight gaps (~4–8px) inside a label→value group, generous gaps (~16px) between groups (summary vs. matchup, stats vs. footer). Content never touches a divider or the card edge — added top/bottom padding around the BST divider and the speed banner. Stat rows bumped to 32px; both card types share one spec (top zone 272 + stats 216 + footer 56 = 544) so they stay equal-height and row-aligned. Hierarchy is carried by size + weight + color **and** reinforced by spacing (labels muted/tracked overlines; values prominent).

**Why.** The UI felt "claustrophobic" because gaps were uniform, so nothing grouped, and stats butted against dividers. Per spacing/typography best practices, hierarchy collapses when everything sits too close; grouping is communicated by _relative_ spacing. See [06_style_guide §6](06_style_guide.md). Refines the card work in [D-017](#d-017)/[D-018](#d-018).

<a id="d-018"></a>

### D-018 · Comparison card v2 + type matchup + swap + art tuning — **Firm**

**Decision.**

- **Type matchup** in the comparison card: P1 is the **attacker**, P2 the **defender**; show each of the attacker's **STAB** types and its damage multiplier vs the defender's full typing (handles dual attacker types = two STAB lines, and dual defender types = up to 4×/¼×/0×). Chart is hardcoded in `src/lib/typeChart.js` (canonical, static Gen-6+ data).
- **Swap button** flips P1 ↔ P2 (and thus attacker/defender).
- Comparison card **difference numbers are centered** (magnitude dead-center, caret in a fixed side slot); the redundant BST-delta row is removed and replaced by a **full-width gradient speed banner** ("X moves first").
- **Artwork tuning:** fixed **square footprint** (full card width, `aspect-square`, `object-contain`), lowered `1.75rem` from the top, with a lighter scrim so the art shows through behind the bars — consistent across the varied 475×475 source canvases.

**Why.** Type advantage is central to actually choosing between two Pokémon, so it belongs in the core (pulls the V2 type-effectiveness idea forward). Centered diffs read cleaner and align down the middle; the speed banner reuses space the redundant total occupied. The square-footprint art is the standard way to normalize inconsistent subject sizes. Extends [D-017](#d-017). See [04_design §5](04_design.md).

<a id="d-017"></a>

### D-017 · Comparison UI: hero-backdrop cards + form chips + comparison card — **Firm**

**Decision.** Each Pokémon renders as a **card with its artwork as a scrim'd backdrop** (the art emerges from behind the name and stat bars, with a gradient fade to the card color for legibility). Alternate forms appear as **toggle chips under the portrait** for instant swapping. The center column is a **full comparison card** (higher-total summary where the art would be + per-stat mirrored bars + speed verdict), not a thin referee.

**Why.** The accidental "art behind the bars" depth looked good, so I made it intentional (scrim keeps text readable). A full-weight center card balances the three columns far better than a sliver; I'm fine with stats appearing more than once. Refines [D-007](#d-007) (bars stay; the middle is now a card, not a referee) and realizes the form-switching from [D-003](#d-003). See [04_design §5](04_design.md).

<a id="d-016"></a>

### D-016 · Build-script fetch politeness — **Firm**

**Decision.** `scripts/build-data.mjs` fetches PokéAPI at a **configurable rate cap (default 5 req/s, `RPS` env override)**, with an **on-disk response cache** (`.cache/pokeapi`, git-ignored) so re-runs hit the network zero times for seen URLs, **retries with exponential backoff**, and an **identifying User-Agent**. The script is run manually, only when adding a data field/feature or when a new generation ships.

**Why.** PokéAPI dropped hard rate limits in 2018 but asks callers to keep frequency low ([02_research §1](02_research.md)); a steady 5 req/s is gentle on their static host while still completing the ~2,600-endpoint first run in one sitting (~9 min), and the cache makes iteration free. Implements the caching requirement of [D-001](#d-001).

<a id="d-015"></a>

### D-015 · Icons via react-icons; no emoji in UI — **Firm**

**Decision.** Use **`react-icons`** for all UI icons (Lucide set by default; other sets as needed). **No emoji** anywhere in the interface. First applications: the speed-verdict icon (`LuGauge`) and the diff-indicator carets (`FaCaretLeft`/`FaCaretRight`), replacing the earlier ⚡ / ▲ text glyphs.

**Why.** Emoji render differently per OS/browser and are a hallmark of unpolished "vibe-coded" apps; the site should read clean and professional. Vector icons are consistent, themeable via `currentColor`, and crisp at any size. Requires `npm install react-icons`. Codified in [06_style_guide §11](06_style_guide.md).

<a id="d-014"></a>

### D-014 · Language: start in JavaScript (reverses D-006) — **Firm**

**Decision.** Build the app in **JavaScript**, not TypeScript. Scaffold with `npm create vite@latest statmon -- --template react`.

**Why.** My preference is to keep the start simple and reduce ceremony while the project finds its shape. Trade-off acknowledged: I lose compile-time safety on the data schema/stat math and a portfolio TS signal; mitigations are JSDoc typedefs on the data model and disciplined token/util usage. Migrating to TS later is possible but is more friction than starting in TS — accepted knowingly. Reverses [D-006](#d-006).

<a id="d-013"></a>

### D-013 · Start plain Vite; defer Cloudflare & React Router — **Firm**

**Decision.** Begin with a **plain Vite + React (JavaScript)** app — no Cloudflare template, no React Router template. Add **React Router** when a second page/route actually exists, and the **Cloudflare Workers/Wrangler** layer when I'm ready to deploy. The end-state target from [D-005](#d-005) (React Router + Cloudflare) is unchanged; only the sequencing moved.

**Why.** Avoids configuring routing/SSR/deploy before anything needs them, keeps the initial repo minimal and easy to reason about, and lets each layer be added deliberately when its need is concrete. Revises the scaffolding approach in [D-005](#d-005); re-sequences [05_roadmap](05_roadmap.md) Phase 0.

### D-012 · Brand accent: Chandelure pastel-purple flame — **Firm**

**Decision.** The brand accent is a **pastel periwinkle purple** (`--accent #9AA0E8`) with a **purple→blue flame gradient** (`#7352E6` → `#9AA0E8` → `#A8C3DD`), derived from Chandelure's official artwork. Replaces the earlier Volcarona-ember orange. Volcarona stays the home mascot.

**Why.** My preference — purple (pastel) over orange — and Chandelure is the #2 favorite, so the palette now honors both favorites (Volcarona mascot + Chandelure colors) while keeping the "flame" thread. Pastel purple also suits the calm-tech minimalist tone better than a hot orange. Colors were lifted slightly from the authentic tones for contrast on the near-black background, and the accent is kept bluer/lighter than the purple-family type colors so it never reads as a type. Sourced hexes and rationale in [04_design §2](04_design.md); research in [02_research §7](02_research.md).

### D-010 · Mobile layout: per-stat cards below 768px — **Firm**

**Decision.** Desktop (≥768px) uses the mirrored 5-column comparison grid; below 768px it collapses to **per-stat cards**, each showing both Pokémon's bars stacked with values and the Δ — no horizontal scrolling. Headers stack P1 above P2.

**Why.** A side-by-side five-column layout is unreadable on a phone; stacking per stat keeps every comparison glanceable without scroll and reuses the same data. Resolves the brainstorm's open mobile question. See [04_design §5](04_design.md).

### D-011 · StatBars scaled to a fixed max of 255 — **Firm**

**Decision.** Stat bars fill relative to a fixed reference of **255** (the maximum possible base stat), not relative to the two selected Pokémon.

**Why.** A global scale means a bar's length means the same thing in every comparison, so users build intuition over time; a relative-only scale would make a 60 look "full" in one matchup and tiny in another. See [04_design §6](04_design.md).

### D-001 · Data strategy: build-time fetch → local JSON — **Firm**

**Decision.** Pull all needed PokéAPI data once via a re-runnable Node script, transform to a slim local schema, and serve that JSON statically. No runtime PokéAPI calls, ever.

**Why.** PokéAPI's fair-use policy explicitly asks for local caching, and the data is effectively static, so runtime fetching buys nothing but latency, fragility, and fair-use risk. Baking data in makes the site fast and fully self-contained. See [02_research §1](02_research.md).

### D-002 · Self-host all images (sprites + artwork) — **Firm** _(refined 2026-07-27)_

**Decision.** Vendor **both** image types from the `PokeAPI/sprites` repo into my own assets — no runtime hotlinking:

- **Pixel sprites** — small icons used in the stats-table rows and the search dropdown. Tiny (~1–3 KB each).
- **Official artwork** — the large illustrations used in the comparison cards (one per Pokémon, flanking the comparison panel). Optimized to **WebP at ~475px** during the vendor step.

Both are served as **Cloudflare Workers static assets** and **lazy-loaded** (only the ~2 artworks in a comparison, and only sprites scrolled into view, ever download). Sprite/artwork URL fields in the data get rewritten to local paths; the ~3 pixel-sprite-less entries fall back to artwork (`spriteUrl ?? artworkUrl`).

**Why.** More reliable (no dependency on GitHub raw, which isn't a tuned image CDN), maximally fair-use-friendly, fully self-contained, and — confirmed against Cloudflare's current docs — **free**: static-asset requests are free and unlimited (don't count against the Worker's 100k/day) with unlimited bandwidth on the free plan; the only caps are 20,000 files (I'm at ~2,500) and 25 MiB/file (my images are far smaller). So self-hosting both costs $0; the only real trade-off is ~tens of MB of deploy storage, which WebP + sizing keeps modest. Since lazy-loading means artwork has no runtime-cost advantage when hotlinked, self-hosting is strictly better here. See [02_research §8](02_research.md).

### D-003 · Megas & forms as first-class entries — **Firm**

**Decision.** Each Mega/alternate form is its own selectable data entry (own id/slug/stats), carrying a `forms` array of counterpart slugs and an `isDefault` flag.

**Why.** Mirrors how PokéAPI models varieties, keeps comparison logic uniform (every side is just a stat block), and satisfies the brainstorm's "switch between versions" goal without special-casing. See [02_research §2](02_research.md).

### D-004 · Normalize to modern six-stat schema — **Firm**

**Decision.** Use HP / Attack / Defense / Sp. Atk / Sp. Def / Speed everywhere; do not model Gen-1's single "Special."

**Why.** It's what PokéAPI serves, what players expect today, and it keeps every comparison consistent. The Gen-1 Special quirk is at most a trivia footnote. Resolves the brainstorm open question. See [02_research §3](02_research.md).

### D-005 · Routing & deploy: React Router v7 (SSR) on Cloudflare Workers — **Firm** _(scaffolding approach revised by [D-013](#d-013))_

**Decision.** React Router v7 in framework mode with SSR, deployed on Cloudflare Workers — as the **eventual** architecture. Note: per [D-013](#d-013) I do **not** scaffold from the official combined template up front; I start plain and add Cloudflare + React Router later.

**Why.** Officially supported as of 2026; Cloudflare now recommends Workers over Pages; SSR gives clean meta/OG tags and direct-linked comparisons. The end-state target is unchanged; only the starting point moved (see [D-013](#d-013)). See [02_research §4](02_research.md).

### D-006 · ~~TypeScript~~ → JavaScript — **Reversed by [D-014](#d-014)**

**Original decision.** Build in TypeScript. **Reversed** on 2026-07-27 — see [D-014](#d-014). Kept here for the record.

**Why (original).** The data schema and stat math benefit from types and it's a portfolio signal. I've since chosen to start simpler in JavaScript.

### D-007 · Core UI: horizontal type-colored bars — **Firm**

**Decision.** The MVP comparison uses horizontal bars color-coded by type, with a three-column layout (P1 · difference · P2). Radar/hex is deferred and optional.

**Why.** Bars are the most instantly readable form for "who's bigger on this stat," match the tool's speed-and-clarity goal, and avoid the complexity/ambiguity of radar for a two-way compare. See [00_brainstorm §2.3](00_brainstorm.md).

### D-008 · Typography: Inter (body + stats) + Space Grotesk (display) — **Firm**

**Decision.** **Inter** as the workhorse for body text and — with tabular figures (`tnum`) enabled — the stat numbers, so digits align in the difference column. **Space Grotesk** as the display face for the logo/wordmark, headers, and titles. Exact weights and sizes finalized in the design step.

**Why.** Inter is the consensus pick for numeric/data UIs (tabular figures, legibility at small sizes). Space Grotesk brings a modern "calm-tech" character with distinctive letterforms that pair well with Inter's neutrality — enough personality for the brand/mascot without hurting readability, and free on Google Fonts. See [02_research §5](02_research.md).

### D-009 · Launch generation scope: all generations (1,025 Pokémon) — **Firm**

**Decision.** Ship covering the **complete National Dex — all 1,025 Pokémon** (as of July 2026), not a subset. The data pipeline stays generation-parameterized so future additions are trivial.

**Why.** A complete dataset makes Statmon a complete tool at launch and avoids a whole class of "why isn't X here?" gaps; the origin playthrough (Gens 1–5) motivated the project but shouldn't cap it. The extra cost is mainly sprite volume, which compression + lazy-loading absorb. Supersedes the earlier Gens-1–5 lean. See [01_spec §5](01_spec.md).

---

## Open / Undecided (to resolve before or during Phase 1)

- **Project template specifics** — confirm the exact official Cloudflare + React Router starter and its current state at scaffold time (D-005 sets direction; pin the concrete template when I init).
- **Styling approach within Tailwind** — how type colors are wired (Tailwind theme extension vs. CSS variables driven by the data map).
- ~~Mobile layout strategy~~ — ✅ resolved in [D-010](03_decisions.md) (per-stat cards under 768px).
- **Testing depth for MVP** — how much of Vitest/Playwright lands in V2 vs. later.

---

_Template for new entries:_

```
### D-0XX · <short title> — <Firm | Provisional>
**Decision.** <what>
**Why.** <reasoning, trade-offs, links to research>
```
