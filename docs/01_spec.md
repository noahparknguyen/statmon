# Statmon — Specifications (Step 1)

_The tangible plan parsed out of [00_brainstorm](00_brainstorm.md): what's actually being built, split into MVP vs. later, plus the core user flow, data schema, and page list. This is the contract the [05_roadmap](05_roadmap.md) sequences and the code implements._

---

## 1. Product Definition

**Statmon** is a minimalist, dark-mode set of Pokémon tools — three of them as of this writing: a head-to-head **stat comparison**, a sortable **full-dex table**, and a **type chart** that answers dual types on one page. The flagship is the comparison, deliberately narrow: fast search, two slots, three columns (Pokémon 1 · Pokémon 2 · difference), color-coded bars. The modular foundation was always meant to carry more tools without a rewrite, and the other two (§2.3) are the proof that it does. Every one of them can be read **as of any generation**.

**Primary goal:** answer "which of these two is faster / hits harder / is bulkier?" in seconds, and look good doing it.

**Success looks like:** a stranger mid-playthrough finds it, gets their answer instantly, and comes away feeling it was faster and clearer than the other options.

---

## 2. Scope — MVP vs. Later

### 2.1 MVP (launch)

The MVP is done when a user can land on the site, search two Pokémon, and read a clear, attractive comparison — deployed on Cloudflare and shareable by URL.

**Comparison tool**

- Two selection slots (Pokémon 1 / Pokémon 2).
- The six base stats displayed as horizontal, type-colored bars: HP, Attack, Defense, Sp. Atk, Sp. Def, Speed.
- Base Stat Total (BST) shown for each and compared.
- Per-stat difference with clear direction (whose favor) and magnitude.
- Explicit **Speed verdict** ("X moves first").
- Swap button.
- Deep-linkable comparison URL (bookmark/share by pasting the link).
- Sensible empty state before selection.

**Search & selection**

- Search-as-you-type with fuzzy matching.
- Pixel-sprite thumbnails in results.

**Data**

- Build-time fetch script → local JSON, covering the launch generation scope (see §5).
- Local/vendored sprites + official artwork, lazy-loaded.
- Modern six-stat schema (Gen-1 Special normalized — see [02_research](02_research.md)).

**Pages:** Home, Comparison, Credits, 404.

**Foundations:** dark-mode design system, accessibility baseline (semantics, labels, alt text, focus, contrast), core meta/SEO tags, README + docs, working Cloudflare deploy.

### 2.2 V2 (fast-follow)

- Attacker-identity read (physical vs. special).
- Biggest-gap highlight.
- Type-effectiveness between the two Pokémon.
- Bar-fill animation (reduced-motion aware).
- Copy-link button, random matchup, full keyboard flow.
- Filter search by type / generation; recently-compared list.
- About page; light-mode toggle.
- ESLint/Prettier, unit + smoke tests, CI/CD auto-deploy.

### 2.3 Shipped since launch

- **A consistency, accessibility and responsive sweep** — the pages were built in
  different sessions and had drifted into six page rhythms, two components that
  were each really one, and a comparison board that rendered the same six stats
  three times on a phone. All consolidated, with the deviations that survive
  stated rather than left looking accidental. It also turned up a **WCAG AA
  contrast failure** shipping on two surfaces, a scroll region no keyboard could
  reach, nav links with a 17px hit box, and an `xs` breakpoint that broke the
  header on every width from 360 to 383. Claims that used to be asserted are now
  measured: `npm run sweep:widths` checks horizontal overflow and target size
  across 11 routes × 14 widths. See [D-057](03_decisions.md#d-057) through
  [D-065](03_decisions.md#d-065).
- **Home feature previews** — every tool gets a live preview on Home, built from its own components against real data ([D-043](03_decisions.md#d-043)).
- **Type chart** (`/types`) — the third tool: the full effectiveness matrix plus a **dual-type readout**, so one page answers "what beats Water/Flying" instead of a page per pairing. Generation-aware like the rest ([D-051](03_decisions.md#d-051)).
- **Generation-accurate comparisons** — one control on `/compare` re-reads the whole board as of an earlier generation: Gen 1's five stats with a single **Special**, historical base stats and typings, and that generation's own type chart. The strip offers every generation the two Pokémon both existed in — which is also what keeps a five-stat Gen 1 board from ever facing a six-stat modern one. See [D-045](03_decisions.md#d-045), [D-046](03_decisions.md#d-046) and [D-047](03_decisions.md#d-047).
- **The dex as of a generation** — `/dex` takes the same lens, and it caps the rows as well as the stats: "as of Gen 3" is a 392-row table of what existed then, with that generation's values feeding the sort. Gen 1 is five columns with a sortable Special. See [D-049](03_decisions.md#d-049).
- **Full-dex stats table** (`/dex`) — the first item off the Someday list, and the second tool on the site. All 1,259 entries, sortable on every stat, searchable by name, filterable by any number of types and generations at once, alternate forms toggleable and hidden by default ([D-056](03_decisions.md#d-056)); the whole view lives in the URL. See [D-039](03_decisions.md#d-039) and [D-040](03_decisions.md#d-040).

### 2.4 Someday (the rest of the suite)

**Abilities** — listed on the comparison card, and feeding the type matchup, since Levitate turns a 2× Ground STAB into 0× (see [05_roadmap Phase 6](05_roadmap.md) and [02_research §13](02_research.md#13-abilities-for-the-planned-abilities-feature)). Plus radar/hex view, favorites, and the remaining tools & games catalogued in [00_brainstorm §5](00_brainstorm.md) — type matchup grid, speed-tier tool, type coverage calculator, team builder, EV/IV planner, Nuzlocke helper, dex trackers, and the guessing/higher-lower/silhouette/daily-puzzle games. Plus expanded generation coverage and per-comparison OG images.

---

## 3. Core User Flow

```
Land on Home
   └─ Click "Compare" (or a quick-link / featured matchup)
        └─ Comparison page
             ├─ Slot 1 empty → type in search → fuzzy results with sprites → pick Pokémon 1
             ├─ Slot 2 empty → same → pick Pokémon 2
             └─ Comparison renders:
                  ├─ Two artwork headers + names + types
                  ├─ Six stat rows: [P1 bar] [value] [Δ favor] [value] [P2 bar]
                  ├─ BST row
                  └─ Speed verdict callout
        └─ Actions: Swap · Copy link · (change either selection re-renders)
   └─ URL always reflects the current matchup (deep-linkable / shareable)
```

**Dex flow.** `/dex` answers the other half of the question — not "which of these two", but "who is highest in the whole game". Land on the table (or on Home's preview of it), sort by any stat, narrow by name / type / generation, and click a name to drop that Pokémon into slot 1 of the comparison. The whole view lives in the URL, so a sorted, filtered dex is a shareable link ([D-039](03_decisions.md#d-039), [D-040](03_decisions.md#d-040)).

**Direct-link entry:** visiting `/compare/<p1>/vs/<p2>` loads straight into a rendered comparison, no interaction required. (Rendered client-side — the SPA resolves both slugs synchronously from the bundled dataset; SSR was deferred at launch, [D-030](03_decisions.md#d-030).)

---

## 4. Data Schema (as built)

Generated by `scripts/build-data.mjs` into `src/data/pokemon.json` — **1,259 entries** (1,025 default forms + 234 Megas/regionals/battle forms). This is the shipped shape, verbatim:

```jsonc
// One entry per selectable Pokémon (including Megas/forms as their own entries)
{
  "id": 637, // PokéAPI id; alt forms get synthetic ids > 10000
  "slug": "volcarona", // URL-safe key, used in /compare/<p1>/vs/<p2>
  "name": "Volcarona", // display name
  "speciesSlug": "volcarona", // dex identity; groups a form with its base
  "isDefault": true, // false for Megas/battle-only forms
  "generation": 5,
  "types": ["bug", "fire"], // 1–2 types, ordered (primary first)
  "stats": {
    "hp": 85,
    "attack": 60,
    "defense": 65,
    "spAtk": 135,
    "spDef": 105,
    "speed": 100,
  },
  "bst": 550, // precomputed sum
  "forms": ["volcarona"], // sibling slugs INCLUDING self; length > 1 ⇒ has alt forms
  "spriteUrl": "/sprites/637.png", // pixel art for search; null for 3 entries
  "artworkUrl": "/artwork/637.webp", // official art for the hero card

  // History (D-045). `until` is the LAST generation those values applied in —
  // PokéAPI's own `past_stats` semantics, kept rather than converted. Both
  // lists are empty for the ~85% of entries that never changed.
  "statEras": [], // e.g. Butterfree: [{until:1,stats:{special:80}}, {until:5,stats:{spAtk:80}}]
  "typeEras": [], // e.g. Clefairy:   [{until:5,types:["normal"]}]
  "introducedIn": 5, // this entry's own debut; later than `generation` for 161 alt forms
}
```

**Field notes.** `statEras` carries a **Gen 1 `special`** record for all 151 Gen 1 species — it is real data, not `spAtk` under another name: 43 of the 151 disagree with that shortcut ([D-045](03_decisions.md#d-045)). `introducedIn` differs from `generation` for alternate forms, which do not debut with their species (Alolan Raichu is a Gen 1 species introduced in Gen 7); it is what stops an era selector offering a generation a form never existed in. `forms` includes the entry itself, so `length > 1` is the "has alternate forms" test. Alt forms carry synthetic ids, so the displayed National Dex number is read from the group's default form. Three entries (`pikachu-starter`, `eevee-starter`, `zygarde-mega`) have no pixel sprite; the UI falls back via `spriteUrl ?? artworkUrl`.

**Historical type charts.** Not in the dataset: the three generation-era effectiveness charts live as static data in `src/lib/typeChart.js` alongside the current one, verified against PokéAPI by `npm run build:data` ([D-047](03_decisions.md#d-047)).

**Not generated.** The type → color map anticipated here was never built — the 18 colors live as `--color-type-*` CSS tokens instead (see [04_design §3](04_design.md)). The type-effectiveness matrix shipped as hardcoded static data in `src/lib/typeChart.js` rather than generated output ([D-018](03_decisions.md#d-018)).

---

## 5. Open Decisions Feeding This Spec

Tracked in [02_research](02_research.md) / [03_decisions](03_decisions.md); each affects the spec above:

- **Generation scope at launch** — ✅ **Decided:** all generations, the complete National Dex (1,025 Pokémon). Pipeline stays generation-parameterized. See [D-009](03_decisions.md#d-009).
- **Mega/forms handling** — separate selectable entries vs. a toggle on the base mon. _Current lean: separate entries that reference each other._
- **Gen-1 Special** — normalize to modern six stats. _Current lean: yes, normalize._
- **Sprite hosting** — self-host/vendor vs. hotlink the sprites repo. _Current lean: self-host._
- **Language & template** — ✅ **Decided:** start plain Vite + React in **JavaScript**; defer Cloudflare + React Router until needed. See [D-013](03_decisions.md#d-013), [D-014](03_decisions.md#d-014).

Once these are settled, this spec's MVP list is frozen and the [05_roadmap](05_roadmap.md) drives implementation.
