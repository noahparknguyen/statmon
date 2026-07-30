# Statmon — Brainstorm (Step 0)

_A minimalist, stat-focused Pokémon comparison tool — no bloat, no unnecessary features. This is the organized brain-dump: every idea for the site in one place, expansive on purpose. The next step ([01_spec](01_spec.md)) parses it into a concrete plan (MVP vs. later); the **Open question** items feed [02_research](02_research.md)._

> **How to read this doc.** Ideas are tagged so the spec can triage them fast:
> **`[MVP]`** = build for launch · **`[V2]`** = fast-follow, soon after MVP · **`[Someday]`** = the long-term suite vision · **`[Open]`** = needs a decision or research first.

---

## 1. The Why (Origin Story)

This past summer I played through all the mainline Pokémon games for the first time — from Red & Blue up through Black & White. Every playthrough, I kept hitting the same problem: when I had two Pokémon of the same type, I wanted to quickly know which one had the better speed and which had the better attacking stats.

I'd look up stat-comparison sites to figure it out, but the ones I found didn't quite fit what I wanted — some felt a bit slow or clunky, and others were built for more than I needed (comparing six Pokémon at once when I only wanted two). I just wanted a fast, clean answer for two.

That's the inspiration for Statmon.

**The guiding principle: keep it simple.** No overkill features, nothing more complicated than it needs to be, no cluttered or unappealing visuals. The goal is a tool that's easy and efficient to use, minimalist but visually clear, and never overwhelming. Every feature below is weighed against that principle — if it doesn't make the core comparison faster or clearer, it waits.

**Two audiences, one build.** This is a useful tool for players (audience #1), and a polished portfolio piece that shows I can ship a clean, well-documented, well-architected product (audience #2). Decisions should serve both.

---

## 2. The Core Product — Comparison Tool `[MVP]`

Search for and select two Pokémon. The screen shows three columns of data:

1. Pokémon 1's stats
2. Pokémon 2's stats
3. The difference between them

Example: Pokémon 1 has 50 Speed, Pokémon 2 has 55 Speed → the difference is **+5 in Pokémon 2's favor**, clearly marked as belonging to Pokémon 2.

Each stat is a simple horizontal bar, color-coded to the Pokémon's primary type, scaled against a fixed maximum so bars are comparable at a glance.

### 2.1 What gets compared

- The six base stats: **HP, Attack, Defense, Sp. Attack, Sp. Defense, Speed.** `[MVP]`
- **Base Stat Total (BST)** — the sum, shown prominently since it's the fastest "who's stronger overall" signal. `[MVP]`
- **The difference per stat**, with direction (whose favor) and magnitude. `[MVP]`
- **Speed verdict** — an explicit "Pokémon X moves first" callout, because speed was the #1 thing I actually cared about mid-playthrough. `[MVP]`
- **Attacker identity** — a quick read on whether each mon is a physical attacker (Attack > Sp. Atk) or special attacker, since that decides which stat comparison even matters. `[V2]`
- **Biggest gap highlight** — subtly emphasize the stat with the largest difference so the key trade-off jumps out. `[V2]`

### 2.2 Comparison interactions

- **Swap button** — flip Pokémon 1 and 2 without re-searching. `[MVP]`
- **Deep-linkable URL** — the two selected Pokémon are encoded in the URL (e.g. `/compare/volcarona/vs/darmanitan`) so a comparison can be bookmarked or shared. `[MVP]`
- **Shareable link / copy button** — one click to copy the current comparison URL. `[V2]`
- **Random matchup** — a "surprise me" button that picks two Pokémon, good for fun and for demoing the tool. `[V2]`
- **Full keyboard flow** — search, select, and swap without touching the mouse. `[V2]`

### 2.3 Visualization options

- **Bars** are the default and the MVP: clean, familiar, instantly readable. `[MVP]`
- **Bar fill animation** on selection — a short, tasteful grow-in. Motion should be subtle and respect `prefers-reduced-motion`. `[V2]`
- **Hexagon / radar chart** as an optional alternate view — the classic six-stat shape, nice for seeing overall "shape" differences. `[Someday]` `[Open]` — does a radar actually help a _two_-mon comparison, or just look cool?

### 2.4 Open questions (core)

- **`[Open]` Mega Evolutions.** Megas drastically change a Pokémon's stats. Treat each Mega as a separate selectable entity, or as the same Pokémon with a toggle that swaps in the alternate stat block? (PokéAPI models them as separate "varieties" under one species — see [02_research](02_research.md).)
- **`[Open]` Other forms.** The same question generalizes: regional forms (Alolan, etc.), Rotom appliances, Deoxys formes, battle-only forms. How many of these are in scope, and how are they surfaced in search?
- **`[Open]` Generation 1 "Special".** Gen 1 has a single "Special" stat; Gen 2+ splits it into Sp. Attack and Sp. Defense. Do I show Gen-1-accurate values, or normalize everything to the modern six-stat schema? (Leaning modern — see research.)
- **✅ Generation scope for launch.** _Decided: all generations — the full National Dex (1,025 Pokémon)._ The Gens 1–5 playthrough inspired the project but shouldn't cap it; a complete dex makes it a complete tool. See [D-009](03_decisions.md).

---

## 3. Search & Selection `[MVP]`

Getting from "I want to compare X and Y" to seeing the result should take seconds.

- **Search-as-you-type** with fuzzy matching, so typos and partial names still find the mon. `[MVP]`
- **Pixel-art sprite thumbnails** in results for instant visual recognition. `[MVP]`
- **Two clearly separated slots** (Pokémon 1 / Pokémon 2) so it's always obvious which side you're filling. `[MVP]`
- **Filter by type and by generation** to narrow a search. `[V2]`
- **Recently compared** shortlist for quick re-selection. `[V2]`
- **Favorites / pinned Pokémon** for people who keep coming back to the same few. `[Someday]`
- **Empty-state guidance** — before anything is selected, show a friendly prompt (and maybe a random suggestion) rather than a blank void. `[MVP]`

---

## 4. Data & Content

### 4.1 Source: PokéAPI

PokéAPI is the main data source: free, open, comprehensive, no auth required.

**Fair use.** PokéAPI removed hard rate limits in 2018 but still asks developers to follow its fair-use policy — non-compliance can lead to an IP ban. The rules that matter for me:

- Locally cache resources whenever I request them.
- Be friendly to fellow PokéAPI developers.
- Report any security vulnerabilities responsibly.

### 4.2 Caching & data strategy `[MVP]`

Pokémon data is effectively static, so I never hit the API at runtime. The plan: a **build-time fetch script** pulls everything I need once and generates a **local JSON data file** the site serves directly. This keeps me fully fair-use-compliant, makes the site fast, and means zero runtime dependency on PokéAPI uptime.

- Re-runnable script so refreshing data (or adding a generation) is one command. `[MVP]`
- Consider the PokéAPI **sprites GitHub repo** for bulk image download rather than scraping image endpoints one by one. `[Open]`
- **Images:** high-quality official artwork for the comparison hero view; small pixel-art sprites for search results. Load lazily. `[MVP]`
- **`[Open]`** Do I self-host sprites (vendor them into the repo / an asset bucket) or hotlink the sprites repo? Self-hosting is more fair-use-friendly and more reliable.

### 4.3 Data schema (what to fetch) `[MVP]`

At minimum per Pokémon: **name, id (national dex), types, and the six base stats.** Plus:

- **Alternate-version references** — each Pokémon with a Mega/form links to its counterpart(s), so search and selection can switch between versions easily.
- **Sprite/artwork URLs** (or local paths after vendoring).
- **Generation** and **species** info for filtering.
- **Per-type color** assignments, chosen for good contrast against the dark background so bars stay vibrant.

### 4.4 Type system `[V2]`

I already need type data for coloring; it opens the door to type-matchup features:

- **Type effectiveness between the two Pokémon** in a comparison — does P1 hit P2 super-effectively, and vice versa? A natural, high-value extension of the core tool. `[V2]`
- A full **type matchup chart / weakness-resistance grid** as its own tool. `[Someday]`

---

## 5. The Suite — Future Tools & Games `[Someday]`

Statmon is named and structured to grow beyond one tool. None of this is MVP, but the architecture (modular pages, shared data layer) should make each one a clean addition rather than a rewrite. Rough idea backlog, loosely ordered by how close they sit to the core:

**Adjacent to comparison**

- **Full-dex stats table** — every Pokémon in one table, a column per stat, **sortable** ascending/descending and **filterable by type/generation**, so you can instantly find the highest/lowest in any stat. Each row leads with the Pokémon's pixel sprite. A strong, natural companion to the comparison tool. `[Someday]` (high-priority)
- **Speed-tier tool** — where does a Pokémon's speed rank; who outspeeds whom.
- **Type coverage / weakness calculator** — paste a team, see combined weaknesses and resistances.
- **Type matchup grid** — the classic 18×18 effectiveness chart, cleanly rendered.
- **Best-in-type finder** — "show me the top Speed/Attack mons of type X."
- **Evolution chain viewer** — see a line and how stats change across evolutions.

**Team & planning**

- **Team builder / analyzer** — assemble six, get a coverage and stat-spread readout.
- **Nature / EV / IV planner** — compute real stats at a level given investment. `[Open]` scope creep risk.
- **Nuzlocke helper** — track a run, encounters, and the graveyard.
- **Living-dex / shiny-dex tracker.**

**Games** (the fun, sticky side — great for showcasing and for return visits)

- **Guess the Pokémon by its stats** — show a stat block, guess the mon.
- **Higher / lower** — is this Pokémon's BST (or a single stat) higher or lower than the last?
- **Silhouette guess** — "who's that Pokémon?"
- **Stat-line trivia / daily puzzle** — a Wordle-style once-a-day challenge for retention.

**Reach / nice-to-have**

- **Cry player** — PokéAPI serves cries; a small audio touch.
- **Pokédex browser** — a clean general-purpose dex, if it ever feels needed.
- **Keep data current** — refresh the dataset as new Pokémon/generations are released (the pipeline is parameterized for this).

---

## 6. Pages & Navigation

Deployment target is **Cloudflare Workers**, using **React Router (v7)** for a multi-page setup. Since Statmon is meant to grow, modular code and clear separation between pages is a priority.

- **Home** `[MVP]` — get users into the tools as fast as possible; prominent quick-links to each tool. Logo, header, footer, hero imagery. Personal touch: **Volcarona** is my favorite Pokémon and the unofficial mascot — he gets a spot on the front page.
- **Comparison** `[MVP]` — home of the comparison tool; supports deep-linked matchups.
- **Credits** `[MVP]` — proper credit to PokéAPI and other sources, link to the GitHub repo, and credit to me.
- **About** `[V2]` — the origin story, the philosophy, what's coming.
- **404 / not-found** `[MVP]` — on-brand, helpful, links back home.
- **Future tool pages** `[Someday]` — one per tool/game as they ship.

**✅ Routing — decided.** React Router v7 (with the Cloudflare/SSR layer) is the end-state, added when multi-page routing is actually needed rather than up front. See [D-005](03_decisions.md), [D-013](03_decisions.md).

---

## 7. Tech Stack

- **React + Tailwind + Vite** — standard, fast, well-supported. `[MVP]`
- **JavaScript** — decided to start simple in JS rather than TypeScript ([D-014](03_decisions.md)); JSDoc typedefs cover the data model. `[MVP]`
- **React Router v7** for routing — added later, when a second route exists (not at scaffold time). `[V2]`
- **Cloudflare Workers** for deployment, via **Wrangler** — added at launch, not up front. `[V2]`
- **Build-time data pipeline** (Node script) to fetch + generate the local JSON. `[MVP]`

**✅ Project template — decided.** Start with **no template — plain Vite + React (JavaScript)**, then layer in React Router and Cloudflare/Wrangler when each is actually needed. See [D-013](03_decisions.md), [D-014](03_decisions.md).

**Supporting tooling** (portfolio polish):

- **ESLint + Prettier** for consistency. `[V2]`
- **Vitest** for unit tests (data transforms, stat math), **Playwright** for a smoke test of the compare flow. `[V2]`
- **GitHub Actions → Cloudflare** CI/CD for automatic deploys. `[V2]`
- **Cloudflare Web Analytics** (privacy-friendly, no cookies) to see if anyone actually uses it. `[Someday]`

---

## 8. Design & Style

Minimalist and simple, with a **dark-mode, modern aesthetic**. Details land in the dedicated [04_design](04_design.md) style guide; the intent captured here:

- **Type-driven color.** Each of the 18 types gets a color tuned for contrast on a dark background, since those colors carry the stat bars.
- **Typography.** ✅ **Decided:** **Space Grotesk** for the logo/headers/titles (modern, characterful) + **Inter** for body and for **stat numbers with tabular figures** so digits align in columns. See [D-008](03_decisions.md).
- **Dark mode first**, with a **light-mode** toggle as a `[V2]` nice-to-have.
- **Motion.** Restrained — a bar-fill animation, gentle transitions, nothing distracting. Respect reduced-motion.
- **The mascot.** Volcarona woven into the brand tastefully, not gaudily.

**`[Open]` Mobile.** Primarily a desktop tool, but need to decide how far to take responsiveness. A side-by-side comparison is awkward on a narrow screen — do the two columns stack, or scroll horizontally? Minimum: don't look broken on a phone.

---

## 9. Accessibility `[MVP]`

Accessibility is part of "clean," not an afterthought:

- Semantic HTML, proper labels, and alt text throughout.
- Sufficient color contrast — especially important since type colors do real informational work (don't rely on color _alone_; pair with numbers/labels).
- Visible focus rings and full keyboard operability.
- `prefers-reduced-motion` honored for all animation.

---

## 10. Meta, SEO & Branding

- A main **logo** and wordmark.
- **Favicons** plus preview / **OG images** for nice link unfurls.
- Well-formed **meta tags** across every page; SSR helps here.
- Per-comparison OG images would be a slick `[Someday]` touch (share a matchup, get a generated preview).

---

## 11. Deployment, Repo & Docs

This is both a personal tool and a showcase, so the engineering around it matters:

- **Professional README** and this `/docs` set kept current.
- **Clean, well-structured GitHub repo** with meaningful commits.
- A **Cloudflare deployment** that's reliable and consistent, ideally auto-deploying from `main`.
- **License and credits** handled correctly (PokéAPI attribution, sprite sources).

---

## 12. Guardrails (What Statmon Is _Not_)

Writing these down so scope creep has something to bump against:

- **Not** a six-Pokémon team-comparison monster. Two at a time is the whole point of the core tool.
- **Not** a full competitive damage simulator (at least not in the core).
- **Not** a bloated, ad-heavy dex clone. Fast, clean, focused.
- **Not** dependent on PokéAPI at runtime. Data is baked in at build time.

Anything that violates these needs a real justification before it ships.
