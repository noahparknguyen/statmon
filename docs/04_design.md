# Statmon — Design (Step 4)

_The style guide: color scheme, per-type bar colors, typography, dark mode, layout, components, motion, and accessibility. This is the source of truth for the design tokens Phase 2 of the [05_roadmap](05_roadmap.md) builds. Values here are the working system; every pairing has since been validated against WCAG AA ([D-027](03_decisions.md#d-027)), reproducible via `npm run audit:contrast`._

> Grounded in [D-007](03_decisions.md#d-007) (horizontal type-colored bars) and [D-008](03_decisions.md#d-008) (Inter + Space Grotesk). Dark mode is canonical; light mode is a [V2] token swap (§8).
>
> **This doc explains the _why_.** For the exhaustive, authoritative token list — every color, the complete font-size ramp, all 22 named text styles, spacing, radii, motion — see **[06_style_guide](06_style_guide.md)**. When a concrete value is needed, 06 is the source of truth.

---

## 1. Design Principles

1. **Clarity over decoration.** Every pixel earns its place; the stats are the hero, not the chrome.
2. **Instant readability.** A user should parse "who wins each stat" in one glance — position, number, and color all reinforce the same answer.
3. **Calm, modern, dark.** A refined dark surface, restrained accent, generous spacing. Nothing shouts except the data.
4. **Never color alone.** Type colors and advantage cues are always paired with text/number/icon, for accessibility and clarity.
5. **Character from the flame.** A single Chandelure-inspired pastel-purple accent (with a purple→blue flame gradient) gives the brand personality without clutter. Volcarona remains the home mascot — both favorites represented.

---

## 2. Color — Core Palette (Dark, canonical)

A neutral, slightly cool dark scale with one warm accent. Exposed as CSS custom properties (and mirrored into the Tailwind theme).

| Token                   | Hex       | Use                                                        |
| ----------------------- | --------- | ---------------------------------------------------------- |
| `--color-base`          | `#0B0C0F` | Page background                                            |
| `--color-surface`       | `#14161B` | Cards, panels, the comparison board                        |
| `--color-elevated`      | `#1C1F27` | Inputs, raised elements, stat-bar tracks                   |
| `--color-border-subtle` | `#2A2E37` | Hairline borders, dividers                                 |
| `--color-border-strong` | `#3A3F4B` | Focused/hover borders                                      |
| `--color-primary`       | `#F4F5F7` | Headings, stat values, primary text                        |
| `--color-secondary`     | `#A8AEBA` | Labels, secondary text                                     |
| `--color-tertiary`      | `#8A909C` | Hints, disabled, captions ([D-027](03_decisions.md#d-027)) |

### Accent (Chandelure flame — pastel purple → blue)

Derived from Chandelure's official artwork (soft periwinkle purple `#757CBB`, deep flame-core `#7352E6`, pastel blue `#A8C3DD`, pale highlight `#D2DEF1`), lifted slightly for pop on the near-black background.

| Token                     | Hex       | Use                                                           |
| ------------------------- | --------- | ------------------------------------------------------------- |
| `--color-accent`          | `#9AA0E8` | Primary actions, links, brand, focus glow (pastel periwinkle) |
| `--color-accent-hover`    | `#B3B8F0` | Hover/active state                                            |
| `--color-accent-blue`     | `#A8C3DD` | Flame's blue stop; secondary highlight / gradient end         |
| `--color-accent-muted`    | `#34355C` | Subtle accent fills, tags on dark                             |
| `--color-accent-contrast` | `#12121C` | Text/icon on top of a solid accent fill                       |

The **flame gradient** (`#7352E6` → `#9AA0E8` → `#A8C3DD`) is allowed **only** in the hero/home area (e.g. behind the mascot) — never behind data.

> **Note:** the accent purple is reserved for chrome (brand, actions, links, focus) and deliberately kept bluer/lighter than the purple-family type colors (Ghost `#9075B8`, Flying `#B7A2FF`, Dragon `#9268FF`) so it never reads as a type on the stat board.

### Advantage / difference cues

To avoid clashing with 18 type colors and to stay colorblind-safe, the difference indicator relies on **position + sign + caret**, not a red/green pair:

| Token              | Hex       | Use                             |
| ------------------ | --------- | ------------------------------- |
| `--color-diff-tie` | `#8A909C` | The tie / zero-difference state |

**As built:** the magnitude sits in the **centered** difference cell (not the winner's column), and both the number and its caret are tinted with the **winner's primary type color** ([D-023](03_decisions.md#d-023)) — a readability win that superseded the flat white `--color-diff-favor`, which has since been deleted as an unreferenced semantic token ([D-033](03_decisions.md#d-033)). Direction is carried by the caret's fixed side slot, so meaning never rests on color alone.

---

## 3. Color — The 18 Type Colors

Each type has a color tuned to stay **vibrant on `--color-base`**. Several canonical type colors (Normal, Dark, Rock, Ghost) are too muddy on dark backgrounds and are brightened here. These fill the stat bars and tint type badges.

| Type     | Hex       | Notes                                                         |
| -------- | --------- | ------------------------------------------------------------- |
| Normal   | `#B5B394` | brightened                                                    |
| Fire     | `#FF9741` |                                                               |
| Water    | `#5AA2FF` |                                                               |
| Electric | `#F5D93B` | high-luminance; use dark text on badge                        |
| Grass    | `#86D95C` |                                                               |
| Ice      | `#A6E4E1` | high-luminance; dark text on badge                            |
| Fighting | `#E64640` | brightened                                                    |
| Poison   | `#C255C0` |                                                               |
| Ground   | `#E8C86F` |                                                               |
| Flying   | `#B7A2FF` |                                                               |
| Psychic  | `#FF6E9A` |                                                               |
| Bug      | `#BCCF2A` | brightened                                                    |
| Rock     | `#CBB44A` | brightened                                                    |
| Ghost    | `#9075B8` | brightened                                                    |
| Dragon   | `#9268FF` | brightened; lightened for AA ([D-027](03_decisions.md#d-027)) |
| Dark     | `#9A7E68` | strongly brightened                                           |
| Steel    | `#C4C4DA` | high-luminance; dark text on badge                            |
| Fairy    | `#E79EC2` |                                                               |

**Rules:**

- A Pokémon's **primary type** colors its stat bars; the secondary type appears as a badge next to its name.
- On **type badges**, all labels use near-black text (`--color-base`) — every type color is light enough on the dark UI that dark text maximizes contrast, and it reads uniformly. (Audited to AA in [D-027](03_decisions.md#d-027); the earlier per-type black/white split is superseded.)
- Bar fills sit on `--color-elevated` tracks; every fill must clear **3:1** against that track (decorative-informational). Since bars always carry a numeric label, this is a "clarity" target rather than a hard text-contrast requirement.
- **As built:** the 18 fills ship as `--color-type-*` CSS tokens in `src/index.css`, read through `typeColorVar()`; the badge label color is uniform near-black via `typeTextVar()`. The separately-generated `type → { fill, badgeText }` JSON map originally planned here was **not** built — the tokens made it redundant.

---

## 4. Typography

Two families ([D-008](03_decisions.md#d-008)):

- **Space Grotesk** — logo/wordmark, page titles, section headers, big numbers in the hero. Weights 500 / 700. Slightly tight tracking on large sizes.
- **Inter** — all body, labels, UI, and **stat values** with tabular figures: `font-feature-settings: "tnum" 1;` so digits align in the difference column. Weights 400 / 500 / 600.

### Type scale

The intent: **Space Grotesk** carries display/heading weight; **Inter** carries body, UI, and tabular stat numbers. The **complete, authoritative ramp** — every one of the 11 sizes and all 22 named text styles (with exact rem/px, weight, line-height, and tracking) — lives in **[06_style_guide §4–5](06_style_guide.md)** and is the single source of truth. Do not re-specify sizes here; reference the named styles (`text-h1`, `text-stat`, …).

- **Stat numbers** use `text-stat` / `text-stat-lg`, always Inter with `tnum`.
- **BST delta figures** use `text-numeral-xl` / `-lg` / `-md` — Space Grotesk, `leading-none` so they sit optically centred in their fixed-height band ([D-035](03_decisions.md#d-035)).
- Load both from Google Fonts (self-hosting via the build for performance/privacy is a [V2] nicety); include `font-display: swap`.

---

## 5. Layout & Spacing

- **Spacing scale (4px base)** and **radii** are defined authoritatively in [06_style_guide §6–7](06_style_guide.md); use those (`p-*`/`gap-*` utilities, `--radius-*`) rather than raw values.
- **Max content width:** `--container-content` 1120px, centered. **As built the gutter is a uniform `px-4` (16px) at every width** — the 24px desktop gutter this doc originally specified was never implemented. Worth revisiting deliberately rather than leaving as drift.
- **Elevation:** in dark mode prefer **borders over shadows**; a soft shadow is reserved for overlays/dropdowns only.

### Comparison layout (the core screen) — as built

A **three-card board**: two Pokémon cards flanking a center comparison card. All three share one **8pt vertical spec** (top zone 272 + stats 240 + footer 56 = **568px**) so they're equal height with **row-aligned stats**. **P1 is the attacker, P2 the defender**; a **Swap** button flips them. ([D-017](03_decisions.md#d-017), [D-018](03_decisions.md#d-018), [D-019](03_decisions.md#d-019))

**A Generation 1 board is 532px.** Gen 1 had five stats, not six — one **Special** in place of Sp. Atk and Sp. Def — so the stats band is 204 instead of 240 ([D-045](03_decisions.md#d-045)). All three cards switch generation together, so they stay equal height and the rows stay aligned at either total; the empty card takes the board's stat list rather than assuming six.

**Control row** — above the board, one line: the **generation strip** (§6) takes the width it needs on the left and **Swap** sits opposite it on the right, rather than two stacked centred rows leaving the middle of a 1,120px page empty. Below `sm` they stack. ([D-046](03_decisions.md#d-046))

**Pokémon card (TCG-inspired):**

- Official **artwork as a bold square backdrop** (full card width, `object-contain`) that bleeds down **behind the stat bars**; a **scrim** fades it into the surface so bars stay legible, and bar tracks use the translucent `--color-track-glass` token so the art shows through. Lazy-loaded, self-hosted ([D-002](03_decisions.md#d-002)).
- **Name** (`<h2>`) + national-dex number top-left; **type badges** top-right.
- **Form chips** (Base · Mega X · …) under the portrait for instant form switching.
- Six **type-colored stat bars** (scaled to 255) + a **BST** footer.

**Comparison card:**

- **Top zone** — a **BST summary** with a large flame-gradient **`+N`** as the focal point, and a **STAB type-matchup**: the attacker's STAB types as **type-tinted effectiveness chips**, tier-emphasized (super-effective bright + up-chevron, neutral muted, resisted dim + down-chevron, immune ban), handling dual attacker/defender types (0–4×).
- **Stats** — **mirrored bars** (P1 grows leftward from center, P2 rightward) with a **centered cell**: small **stat label** on top, the **signed difference** below, and a **caret** to the winner's side.
- **Footer** — a **full-width flame speed banner** ("X moves first").

### Responsive (D-010)

- **≥ 1024px (lg):** three equal columns (card · comparison · card).
- **768–1023px (md):** the two Pokémon cards side-by-side with the comparison card spanning **below**.
- **< 768px:** single column, stacked.

---

## 6. Components

**StatBar** — track `--color-elevated`, fill = primary type color, height 10–12px, `rounded-full`. Fill width is scaled against a **fixed reference of 255** (the maximum possible base stat) so bars are globally comparable across every comparison. Label (Inter 500) + value (Inter 600, tnum) flank the bar.

**Difference cell** (center of each comparison row) — the **signed magnitude** (`+N`, bold) sits on the **row's centerline, aligned with the flanking bars** (bars + number share one data line), with the small **stat label** as a **caption above** it (overline). A **directional caret** occupies a fixed side slot on the winner's side (◀ left if Pokémon 1 leads, ▶ right if Pokémon 2 leads — both slots reserved so the number never shifts). Ties show "—" in `--color-diff-tie`; the empty state shows "–" in `--color-tertiary`. Never color-only (§2). Vector caret icons, never a text glyph or emoji ([D-015](03_decisions.md#d-015)).

**Buttons** — one `Button` component (`src/components/Button.jsx`) is the only source; every CTA and control renders through it. Two variants × two sizes:

- **Primary** — solid `--color-accent`, text `--color-accent-contrast`, hover `--color-accent-hover`.
- **Secondary** — `--color-elevated` + `--color-border-subtle`, text `--color-secondary`, hover brightens text and border.
- **Sizes** — `md` (`h-11 px-6`) for page CTAs, `sm` (`h-9 px-4`) for inline controls like Swap.

All: `rounded-full` (the shape is a pill, not a rounded rect), 150ms transitions, visible focus ring, and a disabled state (`opacity-40`, no pointer events). Passing `to` renders a router `<Link>` styled identically, since Home's and the 404's CTAs are navigations. **The Ghost variant this doc previously specified was never built** — nothing needed it; add it to `Button` if a use appears, rather than hand-rolling one.

**Home feature preview** ([D-043](03_decisions.md#d-043)) — the repeatable section every tool after the flagship gets: an `<h2>` in the `Word.` motif with the accent dot, a one-line description in `text-body-sm text-secondary`, the live preview, and a primary `Button` into the tool. Shipped as `FeaturePreview.jsx`, so the pattern is a component rather than a convention. Sections are separated by `mt-20` (80px).

The **hero is exempt by design**: the comparison board keeps its unlabelled, mascot-flanked treatment and full visual weight. Home therefore reads as hero → one `FeaturePreview` section per shipped tool → tools row. A preview is always the tool's own components against real data — never a mockup — so it cannot drift from what it advertises.

**Dex table row** ([D-039](03_decisions.md#d-039)) — a real `<table>`, fixed 48px rows, on `--color-base` with `--color-border-subtle` row rules and a `--color-surface` hover. Sticky column headers sit above the rows on `--z-raised` and below the site header, and are buttons carrying `aria-sort`; the sorted one is tinted `--color-accent` with a caret. Each stat cell is a **number over a proportional fill** in the Pokémon's primary type color at 28% — scaled to the same fixed 255 reference as every bar on the site (§6), so length means the same thing here, while the number stays the thing you read. BST carries no fill (its range is not 0–255). Below `md` the six stat columns collapse to the single column being sorted by, plus BST — no horizontal scrolling (§5, [D-010](03_decisions.md#d-010)). **Under a generation lens** ([D-049](03_decisions.md#d-049)) the table re-reads: the rows cap at what existed by then, the stats and typings are that generation's, and a Gen 1 dex drops to **five** stat columns with a sortable **Spc** in place of SpA/SpD. The filter chips narrow with it — no Fairy chip in a Gen 5 dex, no Gen 7 origin chip in a Gen 3 one.

**Dex filter chips** ([D-040](03_decisions.md#d-040)) — the filter panel is three `role="group"` sets under `text-overline` labels: **Types**, **Introduced in**, **Options**. The second is named for what it filters rather than "Generations", because the generation strip shares the panel and one bare label cannot serve both — the strip chooses _which dex you are looking at_, this chooses _where a Pokémon came from_ ([D-050](03_decisions.md#d-050)). It hides entirely when a lens leaves it a single option, since "introduced in Gen 1" is every row a Gen 1 dex already has. Each chip is a `rounded-full` toggle carrying `aria-pressed`, `min-h-9` (36px) to match `Button` `sm`, drawn from the shared chip vocabulary below. Inactive adds a 6px dot in the type's color; active type chips take the solid type color with the near-black label (the type-badge pairing, §3) and a trailing ×, while generations and options take `--color-accent`, keeping accent to chrome (§2). Below `md` the three groups collapse behind a `Filters (N)` disclosure; the sort control stays outside it, since the stat column headers are already hidden at that width.

**Type chart grid** ([D-051](03_decisions.md#d-051)) — an 18×18 `<table>` (15×15 in Gen 1), rows attacking and columns defending, with `scope`'d headers so a screen reader announces both for each cell. Column headers are a three-letter abbreviation for the eye beside an `sr-only` full name. A red/green scheme is ruled out by §2, so the scale is **one loud state and three quiet ones**: 2× takes a 55% accent blend over `elevated` (3.00 clear of the baseline, and the brightest that keeps primary text above AA), 1× the plain `elevated` baseline, and ½× / 0× a recessed `base` separated by their glyph and text weight. Every cell is filled — blank cells left the rows and columns with nothing to track along, and made four states that measured 1.00–1.42 apart look like one ([D-052](03_decisions.md#d-052)). A 1× cell shows no text but keeps an `sr-only` "1×". Hovering lights the cell's row and column. Both axes are filled `TypeBadge`s — full-width row labels and three-letter column labels — so a column is found by colour rather than by counting, and neither axis is left ragged. A selected column is bracketed by an accent rule down both edges plus a 12% wash: the wash alone cannot carry it, since anything visible enough puts the multiplier under AA ([D-053](03_decisions.md#d-053)). Every cell carries its multiplier as text (§1 rule 4), and all four pairings are audited as group 6 of `npm run audit:contrast`. The panel scrolls sideways below ~900px — the site's one exception to the no-horizontal-scroll rule, because a matrix has no droppable subset of columns the way the dex's list does. It carries `contain: paint`, without which that overflow reaches the document and scrolls the whole page ([D-052](03_decisions.md#d-052)).

**Matchup tiers** ([D-051](03_decisions.md#d-051)) — the dual-type readout: a `<dl>` of effectiveness tiers, strongest first, each a multiplier against a row of `TypeBadge`s. Empty tiers are omitted, so the absence of a 4× row is itself the answer.

**Generation strip** ([D-046](03_decisions.md#d-046), [D-049](03_decisions.md#d-049)) — the generation control, shared by both tools. Its label is not decoration and states its scope: **"Stats as of"** on the comparison board, where only the numbers change, and **"Dex as of"** on the dex, where the generation also decides which Pokémon are in the table at all. It is **always present** on both tools — a control that arrives with the first selection also pushes the page around as it lands ([D-050](03_decisions.md#d-050)) — and on the dex it leads the controls panel above a divider, inside the card but outside the collapsible chip groups, so it keeps a visual home without disappearing when the groups fold away on a phone. The "differs from today" dot is comparison-only — across 1,259 rows nearly every generation contains something that changed, so every chip would be marked and the mark would say nothing. Otherwise: a `role="group"` under a `text-overline` "Stats as of" label, holding one chip per generation the two selected Pokémon **both existed in**. Chips are near-square (`h-9 min-w-9`) around a single numeral, since nine range labels would not fit beside Swap at any width. The selected one takes the accent fill; a generation whose board **differs from today** carries a 6px accent dot below the numeral, paired with screen-reader text so the mark never rests on colour alone (§9). The visible label is a bare numeral, so the accessible name is built _around_ it (`Generation 5`) rather than replacing it — WCAG 2.5.3 needs the visible text inside the accessible name ([D-042](03_decisions.md#d-042)).

**The chip family** — three chip sets exist, and they share **one colour pair** with **three geometries**. The colours live once in `src/components/chipStyles.jsx`; only size and padding are set per call site, because each sits in a different space:

| Chip                 | Geometry                            | Why                                                                                                                          |
| -------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Form chips**       | `px-2 py-1`, ~21px                  | Must fit the card's fixed 40px band, which eight forms already fill to two rows — the one known 2.5.8 spacing exception (§9) |
| **Filter chips**     | `min-h-9`, `px-3 py-1.5`, `gap-1.5` | Carries a colour dot and a dismiss ×                                                                                         |
| **Generation chips** | `h-9 min-w-9`, `px-2`               | One numeral, nine of them in a row                                                                                           |

Selected is `--color-accent` with `--color-accent-contrast` text, or — where the chip has an inherent colour — that colour with the audited near-black badge label (§3), the border stepping aside. Unselected is `--color-elevated` with `--color-border-strong` and a `--color-secondary` label; hover brightens **only the label**, so a row of chips does not shimmer as the pointer crosses it. All three render side by side on `/style`, which is the check that they still agree.

**Search input** — `--color-elevated`, `--color-border-subtle`, placeholder `--color-tertiary`; focus = `--color-border-strong` + 2px `--color-accent` focus ring. Results are a dropdown of rows: pixel sprite + name + type badges.

**Type badge** — pill, `rounded-full`, background = type color, text = near-black (`--color-base`) for all types (§3, [D-027](03_decisions.md#d-027)).

**Cards / panels** — `--color-surface`, `--color-border-subtle`, `--radius-lg`, generous padding (`p-6`).

---

## 7. Motion

- **Bar fill:** grow from 0 to value using `--dur-bar` + `--ease-standard` (as built, via `.animate-grow-w`); no stagger.
- **Hover/focus:** `--dur-fast` (120ms) — wired as the global transition default, so every `transition-*` uses it ([D-033](03_decisions.md#d-033)).
- **Selection/swap:** cross-fade at `--dur-slow` _(not implemented — selection swaps render instantly)_.
- **`prefers-reduced-motion: reduce`:** disable fills/staggers — render final state instantly, keep only opacity fades. Non-negotiable.
- Duration/easing tokens are defined in [06_style_guide §9](06_style_guide.md).

---

## 8. Dark / Light Mode

Dark is canonical and the only mode at MVP. Light mode is a **[V2]** deliverable implemented purely by swapping the token values in §2 (e.g. `--color-base: #FAFAFB`, inverted text ramp) — because every color is a CSS variable, no component needs to change. Type colors (§3) may need a **⚠ contrast-check** and slight darkening for light backgrounds. Toggle persists via a class on `:root`.

---

## 9. Accessibility (design-level)

- **Text contrast:** body ≥ 4.5:1, large text ≥ 3:1 against its background. The neutral ramp in §2 is chosen to meet this on `--color-base`/`--color-surface`.
- **Not color alone:** type identity is always paired with the type name/badge text; advantage is conveyed by number, sign, and caret (§2); the generation strip's "differs from today" dot is paired with screen-reader text on the same control (§6).
- **Focus:** every interactive element has a visible 2px `--color-accent` focus ring with offset.
- **Motion:** reduced-motion fully honored (§7).
- **Targets:** the binding standard is **WCAG 2.5.8 (AA) — 24×24 CSS px**, or smaller where spacing keeps a 24px circle centred on one target clear of the next. Primary CTAs use `Button` `md` (44px); compact controls — `Button` `sm`, the dex filter chips, the generation strip — are **36px**.

  > **Correction ([D-042](03_decisions.md#d-042)).** This line previously read "interactive hit areas ≥ 44×44px on touch". That was never true **anywhere** on the site — nav links are 14px, Swap is 36px, form chips 21px, and the dex chips shipped at 25px. 44×44 is WCAG **2.5.5**, a **AAA** criterion; Statmon targets AA ([D-027](03_decisions.md#d-027)). The rule now states the standard actually being met, so it can be checked instead of admired.

- **Known exception:** `FormChips` in the comparison card are 21px tall with 6px gaps — the one place on the site likely to fail 2.5.8's spacing test. Raising them needs the card's fixed 40px chip band reworked first: at eight forms (Minior) they already wrap to two rows and overflow it. Tracked in [05_roadmap Phase 5](05_roadmap.md) rather than patched blind. ([D-042](03_decisions.md#d-042))
- **Semantics:** stat rows use proper labels/structure so a screen reader announces "Speed, Pokémon 1 100, Pokémon 2 55, difference 45 in favor of Pokémon 1."

---

## 10. Brand & Assets

- **Wordmark:** "Statmon" set in Space Grotesk 700, with the pastel-purple accent on a single detail (e.g. the dot/tittle or a subtle underline glow) — not the whole word.
- **Mascot:** Volcarona featured on Home; the purple→blue flame gradient is allowed only there.
- **Favicon / OG:** derive from the wordmark + accent on `--color-base`; per-comparison OG images are a [Someday] stretch ([00_brainstorm §10](00_brainstorm.md)).
- **Iconography:** a single lightweight line-icon set (e.g. Lucide), stroke-based, matching the minimalist tone.

---

## 11. Token Summary (for implementation)

All of the above ships as CSS custom properties on `:root` plus a Tailwind theme extension. The three generated/maintained artifacts:

1. **Core tokens** — the §2 palette, §4 font tokens, §5 spacing/radii.
2. **Type-color tokens** — the 18 `--color-type-*` custom properties (§3), consumed via `typeColorVar()` / `typeTextVar()`. (No generated JSON map — see §3.)
3. **Component classes** — built on the tokens (§6).

Open follow-ups fold into Phase 2 of the [05_roadmap](05_roadmap.md). **The ⚠ contrast-checks are complete** ([D-027](03_decisions.md#d-027)): every pairing passes WCAG AA, verified reproducibly via `npm run audit:contrast`. Adjustments made: Dragon lightened to `#9268FF`, and `--color-tertiary` / `--color-diff-tie` moved to `neutral-400`.
