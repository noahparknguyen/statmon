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

**Scope, stated because the home page now strains it.** These describe the
**tools** — `/compare`, `/dex`, `/types`, `/games` — where the data is the reason you came
and chrome that competes with it is a defect. Home is a front door, not a tool,
and since [D-070](03_decisions.md#d-070) it opens on a 72svh wall of sprites,
which is decoration by any reading of principle 1 and does shout, against
principle 3. That is a deliberate exception with its own entry, not a quiet drift
— and it stops at the fold: every section below the wall is the real tool
rendered by the tool's own components against real data
([D-043](03_decisions.md#d-043)). If a future change wants to relax one of these
inside a tool, it needs an argument; Home already made one.

**And `/games` is the second exception** ([D-096](03_decisions.md#d-096)), on a
different argument from Home's. A game's board fills the viewport and its
Pokémon are enormous — decoration by principle 1, if the principle applied.
It does not apply here, and the reason is narrow enough to be worth stating: in
a tool, chrome that competes with the data is a defect; in a game, **the Pokémon
_are_ the data**. The thing you look at is the thing you are answering about, so
a panel that fills half the screen is content, not chrome. The exception
licenses the game surface and nothing else — the setup panel inside it is built
from the same chips, labels and page rhythm as `/dex`'s filters.

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

A **three-card board**: two Pokémon cards flanking a center comparison card. All three share one **8pt vertical spec** (top zone 320 = head 56 + **controls 88** + body 176, then stats 240 + footer 56 = **616px**) so they're equal height with **row-aligned stats**. **P1 is the attacker, P2 the defender**; a **Swap** button flips them. ([D-017](03_decisions.md#d-017), [D-018](03_decisions.md#d-018), [D-019](03_decisions.md#d-019))

**Below `md` a card is 424px and carries no stats** — head 56 + controls 88 + body 224 + footer 56 ([D-057](03_decisions.md#d-057)). The equal-height invariant is a ≥`md` concern: below it the three cards are stacked, not side by side — which is why the **comparison card's fixed top zone is `md:` only** ([D-076](03_decisions.md#d-076)). Below that it grows with its content instead, since a fixed height there was dead space and, worse, could clip a two-line corrected STAB chip inside `overflow-hidden`.

**A Generation 1 board is 580px.** Gen 1 had five stats, not six — one **Special** in place of Sp. Atk and Sp. Def — so the stats band is 204 instead of 240 ([D-045](03_decisions.md#d-045)). All three cards switch generation together, so they stay equal height and the rows stay aligned at either total; the empty card takes the board's stat list rather than assuming six.

**Control row** — above the board, one line: the **generation strip** (§6) takes the width it needs on the left and **Swap** sits opposite it on the right, rather than two stacked centred rows leaving the middle of a 1,120px page empty. Below `sm` they stack. ([D-046](03_decisions.md#d-046))

**Pokémon card (TCG-inspired):**

- Official **artwork as a bold square backdrop** (`object-contain`) that bleeds down **behind the stat bars**; a **scrim** fades it into the surface so bars stay legible, and bar tracks use the translucent `--color-track-glass` token so the art shows through. Self-hosted ([D-002](03_decisions.md#d-002)), and eager rather than lazy because it is the page's LCP.

  **280px at `top-33`** ([D-081](03_decisions.md#d-081), re-derived by [D-082](03_decisions.md#d-082)). It is `w-full aspect-square`, so its height follows the card's **width** while the space that shows it is fixed — uncapped it measured **718px at a 767px viewport** (the top third of a Pokémon) and **476px at 1023px**. Not a mobile bug: it recurred at the top of every column-count band, worst just before each breakpoint.

  The cap is set by the **vertical** window rather than by matching the old look, and solves two constraints at once: the subject must start below the controls band (`top + 0.05N ≥ 144`, using the tightest-cropped decile), and below `md`, where the card ends at 424, it must land above the scrim's opaque point (`top + 0.9N ≤ 382`). Together, **N ≤ 280**. Worth stating because it is the thing that made the alternatives unavailable: PokéAPI's official artwork is **tightly cropped — subjects fill 10%–90% of the square**, measured across a sample, so there is no whitespace anywhere in the image to hide a chip in.

- **Name** (`<h2>`) + national-dex number top-left; **type badges** top-right.
- A **labelled controls band**, 88px, holding both chip groups, **directly under the head and above the portrait** ([D-080](03_decisions.md#d-080), placed by [D-082](03_decisions.md#d-082)): a two-column grid with `text-overline` **FORM** and **ABILITY** labels on the left and the chips flowing on the right.

  Rows align on the **baseline**, so a label sits on the first line of its chips rather than beside the gutter between two wrapped rows ([D-089](03_decisions.md#d-089)) — the `<dt>`/`<dd>` convention, and what every other labelled group here already does by putting its label above.

  **Above the portrait, because form and ability are identity** — which Pokémon this card is, and which version of it is in play — so they belong with the name, dex number and type badges. Below it they sat on the artwork, and that is the distinction the band was getting wrong: a stat bar is 2px and sparse, so it genuinely bleeds; a row of 21px opaque pills does not read as bleeding behind anything, it reads as covering. The four Tauros entries (four long form names plus three abilities) still exceed 88px by 14px and now overflow **upward onto empty surface** rather than onto the Pokémon. They were two unlabelled bands of visually identical chips until nothing on screen said which was which — naming a control group is the pattern `GenerationStrip`, `TypePicker` and `DexFilters` all already follow, and this was the one place it was missing. **Left-aligned**, matching the stat rows immediately below, so the card reads as one spec sheet rather than a portrait with chips floating on it. 88 is exactly what the two separate bands occupied (40 + 40+8), deliberately, so relabelling their insides moves none of their outsides.
  - **Forms** — Base · Mega X · …, for instant form switching. The row **holds its space for the 845 entries with one form**, where `FormChips` renders nothing, or the ability row would slide up and change the card's height for two thirds of the dex ([D-050](03_decisions.md#d-050)).
  - **Abilities** — one per ability, exactly one always selected, hidden ability marked with an icon plus `sr-only` text ([D-073](03_decisions.md#d-073)). Always renders, saying "Abilities arrived in Gen 3" below Gen III and "No abilities" for the 14 entries that carry none.
  - The whole band carries the stats band's text shadow, because it sits over the artwork and the labels and both empty states are bare text ([D-077](03_decisions.md#d-077)).

- Six **type-colored stat bars** (scaled to 255) + a **BST** footer.

**Comparison card:**

- **Top zone** — a **BST summary** with a large flame-gradient **`+N`** as the focal point, and a **STAB type-matchup**: the attacker's STAB types as **type-tinted effectiveness pills** in a centred wrapping row, tier-emphasized (super-effective bright + up-chevron, neutral muted, resisted dim + down-chevron, immune ban), handling dual attacker/defender types (0–4×). When the **defender's ability** changes a multiplier, the pill shows the correction rather than only the result — the chart's own answer struck through beside the real one, in `--color-secondary` (`tertiary` over the chip's 14% type fill fails AA on 17 of 18 types, the [D-058](03_decisions.md#d-058) finding, audited as group 7). **The ability is named by the caption below the group, once, never on the pill** — `StabCaption`, shared with `/style` so a specimen cannot drift from the real thing ([D-079](03_decisions.md#d-079), [D-090](03_decisions.md#d-090)) — a defender has exactly one ability, so per-chip attribution was redundant by construction and was what forced a second line onto the chip.
- **Stats** — **mirrored bars** (P1 grows leftward from center, P2 rightward) with a **centered cell**: small **stat label** on top, the **signed difference** below, and a **caret** to the winner's side.
- **Footer** — a **full-width flame speed banner** ("X moves first").

### Responsive (D-010, [D-057](03_decisions.md#d-057))

- **≥ 1024px (lg):** three equal columns (card · comparison · card).
- **768–1023px (md):** the two Pokémon cards side-by-side with the comparison card spanning **below**.
- **< 768px:** single column — **comparison card first**, then the two Pokémon cards, which drop their stat bars.

That last line is the correction. D-010 answered "the mirrored row does not fit below 768px" and was never revisited as the board grew: stacked, you scrolled past two 568px cards each carrying its own six bars, then met the same six stats a third time as per-stat cards, with the verdict last on a 2,727px page. Below `md` there is now **one** stats surface and it leads; the cards keep what only they have (identity, artwork, forms, total) and are **360px** tall. Measured at 390px the page is 2,343px, and the verdict moves from ~1,550px down it to ~450px. See [D-057](03_decisions.md#d-057).

---

**Page padding is asymmetric** — `pt-10 pb-20` on the tool pages, `pt-16 pb-24` on the content ones ([D-083](03_decisions.md#d-083)). The two edges are not the same kind of edge: the top is bounded by a **sticky** header that stays attached to the content, so a tight 32px reads as intentional on a working surface; the bottom is **terminal**, and content ending 32px above the footer's rule reads as crowding. The bottom number is the one Home already spent, so "space before the footer" is a single value site-wide.

## 6. Components

**StatBar** — track `--color-elevated`, fill = primary type color, height 10–12px, `rounded-full`. Fill width is scaled against a **fixed reference of 255** (the maximum possible base stat) so bars are globally comparable across every comparison. Label (Inter 500) + value (Inter 600, tnum) flank the bar.

**Difference cell** (center of each comparison row) — the **signed magnitude** (`+N`, bold) sits on the **row's centerline, aligned with the flanking bars** (bars + number share one data line), with the small **stat label** as a **caption above** it (overline). A **directional caret** occupies a fixed side slot on the winner's side (◀ left if Pokémon 1 leads, ▶ right if Pokémon 2 leads — both slots reserved so the number never shifts). Ties show "—" in `--color-diff-tie`; the empty state shows "–" in `--color-tertiary`. Never color-only (§2). Vector caret icons, never a text glyph or emoji ([D-015](03_decisions.md#d-015)).

**Buttons** — one `Button` component (`src/components/Button.jsx`) is the only source; every CTA and control renders through it. Two variants × two sizes:

- **Primary** — solid `--color-accent`, text `--color-accent-contrast`, hover `--color-accent-hover`.
- **Secondary** — `--color-elevated` + `--color-border-subtle`, text `--color-secondary`, hover brightens text and border.
- **Sizes** — `md` (`h-11 px-6`) for page CTAs, `sm` (`h-9 px-4`) for inline controls like Swap.

All: `rounded-full` (the shape is a pill, not a rounded rect), 150ms transitions, visible focus ring, and a disabled state (`opacity-40`, no pointer events). Passing `to` renders a router `<Link>` styled identically, since Home's and the 404's CTAs are navigations. **The Ghost variant this doc previously specified was never built** — nothing needed it; add it to `Button` if a use appears, rather than hand-rolling one.

**Home feature preview** ([D-043](03_decisions.md#d-043)) — the repeatable section every tool after the flagship gets: an `<h2>` in the `Word.` motif with the accent dot, a one-line description in `text-body-sm text-secondary`, the live preview, and a primary `Button` into the tool. Shipped as `FeaturePreview.jsx`, so the pattern is a component rather than a convention. Sections are separated by `mt-28` (112px), and a section's CTA sits `mt-8` (32px) below its own preview — a ratio rather than two numbers ([D-069](03_decisions.md#d-069)): a button that heavy needs well over 3× to read as belonging to what it came from rather than as the kicker for the heading beneath it ([D-019](03_decisions.md#d-019)).

The **flagship board keeps its visual exemption, but not its anonymity** ([D-067](03_decisions.md#d-067)). It is still mascot-flanked, still `max-w-2xl`, still the first section, and still keeps its own CTA copy ("Try it out" where the sections below say "Open the …") — but it now opens with the same `PageHeader` block as the others, carrying `/compare`'s own title and one-liner. It had been the one tool Home would not name, while both other sections reuse their page's copy verbatim. _Note the vocabulary: since [D-070](03_decisions.md#d-070) **"the hero" means the sprite wall**, and the comparison board is **the flagship** — it leads the sections, not the page._ Home reads as hero wall → `Compare.` → `Dex.` → `Types.` → tools row: one h1, in the wall, over one h2 per tool.

A preview is always the tool's own components against real data — never a mockup — so it cannot drift from what it advertises. **Flare goes in the frame, never in the components** ([D-067](03_decisions.md#d-067)): every difference between a preview and its tool is either a subtraction of interactivity or framing around it — art behind the content, layering, bars growing in on mount, a label. Never a restyle. That is what lets a section be made exciting without giving it a second implementation to go stale. In practice: the dex preview's fills animate in (`DexRow`'s `animate` prop, which only Home passes — the real table windows its rows and would animate every one on arrival), and each section carries artwork. All of it follows the hero's rules — `hidden lg:block`, `aria-hidden`, `pointer-events-none`, `drop-shadow-art` — plus `loading="lazy"`, since unlike the hero's it is below the fold.

**Home's hero** ([D-070](03_decisions.md#d-070)) — a full-bleed wall of pixel sprites at `72vh`, drifting slowly diagonally, with the wordmark and tagline centred on a scrim over it, and nothing else — the counted caption that sat beneath it was a leftover from the treatments this replaced ([D-071](03_decisions.md#d-071)). The sprites are 98 entries sampled at even intervals across the default forms in dex order, so the wall crosses all nine generations, drawn at **2× their native 96px** at `md`+ — `image-rendering: pixelated` at exactly double is nearest-neighbour, so it is crisper than any intermediate size — and at native 96px below that. The grid is decorative to assistive tech. **`--hero-scrim: 65%`** is a token because group 8 of `npm run audit:contrast` reads it and checks `text-primary` against the worst backdrop a sprite can produce, a pure-white pixel: 5.68:1. That is also why the hero tagline is `text-primary` where every other tagline on the site is `text-secondary` — on this scrim `secondary` lands at 2.78:1. Gradients layered over the flat scrim (a radial pool behind the wordmark, a fade into the page at the foot) only ever add base, so the audited value stays the floor. _It replaced a drifting sprite ribbon ([D-069](03_decisions.md#d-069)), which replaced a type-frequency band ([D-068](03_decisions.md#d-068)); the brief all three were chasing was an arresting first screen, and only the wall is one._ **This reverses [D-023](03_decisions.md#d-023)'s product-as-hero** — deliberately, and sized at 72vh so the comparison board still crests the fold.

**The art roster** ([D-068](03_decisions.md#d-068)) — the Black & White team is six ([D-044](03_decisions.md#d-044)) and is allocated, not reached for: Volcarona + Chandelure are the hero's mascots, Archeops and Samurott are the top and bottom rows of the dex preview's own sort (read off the comparator, never named) and flank its table's top edge **symmetrically** — same size, mirrored rotation, clipped by the same edge, since a placement whose rationale is only visible in the code reads as decoration in the render ([D-069](03_decisions.md#d-069)). **Flanking art points at what it flanks** ([D-072](03_decisions.md#d-072)): figures face inward (mirror one if the artwork faces the wrong way, as the flagship board does to Chandelure), lean inward, and are anchored to the **centre** rather than the container's edges so the gap to the heading does not grow with the viewport. Where art is clipped, the cut lands below the body mass — a figure cut across the torso reads as pasted on, one whose legs disappear reads as standing behind, Krookodile is the type preview — the only dual type left, which that section needs, since a single typing would advertise the one capability the tool does not exist for. **Mienshao is reserved for the Games preview.** Picking one section at a time is how the first pass put Volcarona in two places at once.

**Dex table row** ([D-039](03_decisions.md#d-039)) — a real `<table>`, fixed 48px rows, on `--color-base` with `--color-border-subtle` row rules and a `--color-surface` hover. Sticky column headers sit above the rows on `--z-raised` and below the site header, and are buttons carrying `aria-sort`; the sorted one is tinted `--color-accent` with a caret. Each stat cell is a **number over a proportional fill** in the Pokémon's primary type color at 28% — scaled to the same fixed 255 reference as every bar on the site (§6), so length means the same thing here, while the number stays the thing you read. BST carries no fill (its range is not 0–255). Below `md` the six stat columns collapse to the single column being sorted by, plus BST — no horizontal scrolling (§5, [D-010](03_decisions.md#d-010)). **Under a generation lens** ([D-049](03_decisions.md#d-049)) the table re-reads: the rows cap at what existed by then, the stats and typings are that generation's, and a Gen 1 dex drops to **five** stat columns with a sortable **Spc** in place of SpA/SpD. The filter chips narrow with it — no Fairy chip in a Gen 5 dex, no Gen 7 origin chip in a Gen 3 one.

**Dex filter chips** ([D-040](03_decisions.md#d-040)) — the filter panel is three `role="group"` sets under `text-overline` labels: **Types**, **Introduced in**, **Options**. The second is named for what it filters rather than "Generations", because the generation strip shares the panel and one bare label cannot serve both — the strip chooses _which dex you are looking at_, this chooses _where a Pokémon came from_ ([D-050](03_decisions.md#d-050)). It hides entirely when a lens leaves it a single option, since "introduced in Gen 1" is every row a Gen 1 dex already has. Each chip is a `rounded-full` toggle carrying `aria-pressed`, `min-h-9` (36px) to match `Button` `sm`, drawn from the shared chip vocabulary below. Inactive adds a 6px dot in the type's color; active type chips take the solid type color with the near-black label (the type-badge pairing, §3) and a trailing ×, while generations and options take `--color-accent`, keeping accent to chrome (§2). Below `md` the three groups collapse behind a `Filters (N)` disclosure; the sort control stays outside it, since the stat column headers are already hidden at that width.

**Type chart grid** ([D-051](03_decisions.md#d-051)) — an 18×18 `<table>` (15×15 in Gen 1), rows attacking and columns defending, with `scope`'d headers so a screen reader announces both for each cell. Column headers are a three-letter abbreviation for the eye beside an `sr-only` full name. A red/green scheme is ruled out by §2, so the scale is **one loud state and three quiet ones**: 2× takes a 55% accent blend over `elevated` (3.00 clear of the baseline, and the brightest that keeps primary text above AA), 1× the plain `elevated` baseline, and ½× / 0× a recessed `base` separated by their glyph and text weight. Every cell is filled — blank cells left the rows and columns with nothing to track along, and made four states that measured 1.00–1.42 apart look like one ([D-052](03_decisions.md#d-052)). A 1× cell shows no text but keeps an `sr-only` "1×". Hovering lights the cell's row and column. Both axes are filled `TypeBadge`s — full-width row labels and three-letter column labels — so a column is found by colour rather than by counting, and neither axis is left ragged. A selected column is bracketed by an accent rule down both edges plus a 12% wash: the wash alone cannot carry it, since anything visible enough puts the multiplier under AA ([D-053](03_decisions.md#d-053)). Every cell carries its multiplier as text (§1 rule 4), and all four pairings are audited as group 6 of `npm run audit:contrast`. The panel scrolls sideways below ~900px — the site's one exception to the no-horizontal-scroll rule, because a matrix has no droppable subset of columns the way the dex's list does. It carries `contain: paint`, without which that overflow reaches the document and scrolls the whole page ([D-052](03_decisions.md#d-052)).

**Ability chips** ([D-073](03_decisions.md#d-073)) — the roster control, on the comparison card and on `/types`. Built from the shared chip vocabulary with `FormChips`' compact geometry, and **exactly one is always selected**, because a Pokémon always has exactly one ability in play ([D-074](03_decisions.md#d-074)) — there is no "none" state to design. Two markers, neither of them colour alone (§9): a **6px accent dot** before the label means _this ability changes type matchups_ — deliberately the generation strip's "differs" dot, since it is the same statement — and a small eye-off **icon** after it marks the hidden ability; both carry `sr-only` text on the same control. Without an `onSelect` the chips render as pills rather than buttons, which is how Home previews them: a button that does nothing is worse than a label.

**Defender heading** ([D-075](03_decisions.md#d-075)) — `/types`' readout heading when a **Pokémon** named the typing rather than the chips: its pixel sprite, its name, then the typing in exactly the coloured-text treatment the plain heading uses ([D-053](03_decisions.md#d-053)), then its ability chips **immediately after** — not pushed to the far edge, which at 1400px stranded the ability 700px from the Pokémon it belongs to ([D-077](03_decisions.md#d-077)). The whole line is one statement: _Eelektross, Electric, Levitate._

**Matchup tiers** ([D-051](03_decisions.md#d-051)) — the dual-type readout: a `<dl>` of effectiveness tiers, strongest first, each a multiplier against a row of `TypeBadge`s. Empty tiers are omitted, so the absence of a 4× row is itself the answer.

**Generation strip** ([D-046](03_decisions.md#d-046), [D-049](03_decisions.md#d-049)) — the generation control, shared by both tools. Its label is not decoration and states its scope: **"Stats as of"** on the comparison board, where only the numbers change, and **"Dex as of"** on the dex, where the generation also decides which Pokémon are in the table at all. It is **always present** on both tools — a control that arrives with the first selection also pushes the page around as it lands ([D-050](03_decisions.md#d-050)) — and on the dex it leads the controls panel above a divider, inside the card but outside the collapsible chip groups, so it keeps a visual home without disappearing when the groups fold away on a phone. A generation whose **ability roster** differs is marked too, but only from Gen III up — "nobody had abilities then" is a fact about the games rather than about this Pokémon, so counting it would mark Gen 2 for all 1,259 entries and say nothing ([D-073](03_decisions.md#d-073)). The dot's screen-reader text is `differs from today`, not `stats differ from today`, since a roster change is not a stat change. The dot is comparison-only — across 1,259 rows nearly every generation contains something that changed, so every chip would be marked and the mark would say nothing. Otherwise: a `role="group"` under a `text-overline` "Stats as of" label, holding one chip per generation the two selected Pokémon **both existed in**. Chips are near-square (`h-9 min-w-9`) around a single numeral, since nine range labels would not fit beside Swap at any width. The selected one takes the accent fill; a generation whose board **differs from today** carries a 6px accent dot below the numeral, paired with screen-reader text so the mark never rests on colour alone (§9). The visible label is a bare numeral, so the accessible name is built _around_ it (`Generation 5`) rather than replacing it — WCAG 2.5.3 needs the visible text inside the accessible name ([D-042](03_decisions.md#d-042)).

**The chip family** — four chip sets exist, and they share **one colour pair** with **four geometries**. The colours live once in `src/components/chipStyles.jsx`; only size and padding are set per call site, because each sits in a different space:

| Chip                 | Geometry                            | Why                                                                                                                                                                                                                                                                                                                         |
| -------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Form chips**       | `px-2 py-1`, ~21px                  | Shares the card's 88px controls band with the abilities, which eight forms already fill to two rows — the one known 2.5.8 spacing exception (§9)                                                                                                                                                                            |
| **Ability chips**    | `px-2 py-1`, ~21px                  | The same band and the same compact geometry; carries the effect dot and the hidden-ability icon                                                                                                                                                                                                                             |
| **Filter chips**     | `min-h-9`, `px-3 py-1.5`, `gap-1.5` | Carries a colour dot and a dismiss ×. The × is `removable`, and it is behaviour rather than decoration: the dex and the type picker toggle an active chip **off**, while the game's stat and contender groups are single-select, so a × there would promise a dismissal that never happens ([D-091](03_decisions.md#d-091)) |
| **Generation chips** | `h-9 min-w-9`, `px-2`               | One numeral, nine of them in a row                                                                                                                                                                                                                                                                                          |

Selected is `--color-accent` with `--color-accent-contrast` text, or — where the chip has an inherent colour — that colour with the audited near-black badge label (§3), the border stepping aside. Unselected is `--color-elevated` with `--color-border-strong` and a `--color-secondary` label; hover brightens **only the label**, so a row of chips does not shimmer as the pointer crosses it. All four render side by side on `/style`, which is the check that they still agree.

**Everything in this vocabulary is a pill sized to its content**, and that is a rule rather than a coincidence: the STAB chip was the one stretched control on the site — a `w-full justify-between` bar that reached **819px** to hold about 120px of text — and it was the one that looked wrong ([D-079](03_decisions.md#d-079)). It is now a pill too, in two sizes (`sm` for Home's three-column head, `md` for the board), with the group doing the layout.

**Contender panel** ([D-091](03_decisions.md#d-091), [D-093](03_decisions.md#d-093), rebuilt as an arena panel by [D-096](03_decisions.md#d-096)) — one Pokémon in a round of `Higher.`, at three densities: `lg` for a two-up board, `md` for a four-up, `sm` for the games-index thumbnail. Artwork fills a **flexible** box with `object-contain` — never `aspect-square`, which takes its height from the panel's _width_ ([D-081](03_decisions.md#d-081)'s runaway) — over a **10% tint of the Pokémon's typing** — a diagonal gradient between both colours for a dual type ([D-107](03_decisions.md#d-107)), which is §3's idea finally able to say both halves; the panels had been rendering Volcarona as Bug alone, which is §3's idea applied to a whole surface and does the board's structural work: two panels of different colours read as two sides without a heavier divider. Audited as **group 10** of `npm run audit:contrast`. Below it the name, its type badges, and a value band that **holds its space from the start**, sized one rung above its own numeral because `text-numeral-*` is `leading-none` and a 48px figure in a 36px band loses its feet. A resolved round is marked on [D-051](03_decisions.md#d-051)'s **one loud state and three quiet ones** scale rather than a red/green pair, which this palette does not have (§2): the winner takes an **inset** accent ring (a border would shift every neighbour by 2px, since these sit edge to edge), the loser you picked takes a neutral ring and an ×, and unpicked panels drop to 50%. Every mark is an icon plus `sr-only` text, never colour alone (§9).

The densities are a **prop rather than a breakpoint**, and that is forced: the named text styles are hand-written `@layer components` classes, so `lg:text-h2` generates no CSS at all ([§13](06_style_guide.md), the [D-065](03_decisions.md#d-065) finding). A component that needs two sizes of a named style needs two call sites, not a variant.

**The round card** ([D-096](03_decisions.md#d-096), positioned by [D-101](03_decisions.md#d-101)) — one card holds the question and then the verdict, and they do **not** sit in the same place, because they are not the same kind of thing. The question is chrome you read once and glance back at, so it goes to the **top** of the board, clear of the artwork. The answer is an event: it interrupts, it carries the button you are about to press, and it stays **centred**, where your eye already is. Both only at the widths where the panels are side by side — stacked, the card is a real grid row _between_ the panels and covers nothing to begin with. The verdict's headline and its detail are on **separate lines**, not baseline-aligned side by side, for [D-053](03_decisions.md#d-053)'s reason: two type sizes on one line never sit together.

**Matchup panel** ([D-104](03_decisions.md#d-104)) — one side of a type-game round: the attacking type, or the defender. An `ATTACKING` / `DEFENDING` overline leads each, and it is not decoration — the question is directional and the panels are otherwise symmetrical. A typing is set as **coloured display text** rather than as a badge, the treatment [D-053](03_decisions.md#d-053) settled for `/types`' readout heading: an 11px pill is not something you read across a board. **In the hard tier a Pokémon defender is untinted and unbadged until you answer** — every other panel here is tinted by its primary type, and that would print the answer. The tint, the badges and the ability's effect dot all arrive with the reveal, where they are teaching rather than question.

**Answer cluster** ([D-104](03_decisions.md#d-104), moved into the board by [D-107](03_decisions.md#d-107)) — the type game's answer control, in the **middle** of the board: attacker │ answers │ defender, the shape `/compare` has always used. It began as a rail along the bottom, which put the thing you press as far from the thing you read as the screen allows, across a field holding two words at the easier tiers. Three things hold their space from the start so nothing moves when a round resolves — the cell itself (208px, measured against a 187px verdict), the defender's type-badge band, and a fixed icon slot inside every button. That is the opposite call from [D-103](03_decisions.md#d-103), which refused to reserve in the stat game's gutter, and the difference is that this board had the room spare. The two games answer differently: in `Higher.` the answer _is_ the panels, so the middle is free for the question; here it is separate, and the middle is where the Pokémon you are still reading sits. The bottom is also where a thumb is. The buttons are a property of the **tier**, computed once from the settings, so their number never hints at the round. Marked on [D-093](03_decisions.md#d-093)'s no-red/green scale, and the verdict row above them **holds its height from the start** — the [D-103](03_decisions.md#d-103) rule, in the one place this board needs it.

**Game bar** ([D-096](03_decisions.md#d-096)) — the arena's 56px chrome, sticky under the site header at `--z-raised`: the game's name in the `Word.` motif at `text-h3`, then score / streak / best as a `<dl>` in `text-stat` (Inter with tabular figures, because these change under the reader every round — `text-numeral-*` is for big figures optically centred in a fixed band, [D-035](03_decisions.md#d-035)), then the Setup button. **The name truncates rather than pushing** ([D-106](03_decisions.md#d-106)): it was `shrink-0`, which held for exactly as long as there was one game — "Effective." is longer than "Higher." and shoved Setup 15px off a 320px screen. It exists **instead of** a `PageHeader` and a controls panel, which is the whole shape of the arena change.

**Setup dialog** ([D-096](03_decisions.md#d-096)) — a native `<dialog>` at `--z-overlay`, opened with `showModal()` for its focus trap, Esc and inert backdrop. A flex column — header, scrolling body, footer — rather than one scrolling box with a `sticky` footer, because sticky content sits _on_ the scroll area and hid the pool count under the Play bar. The lens leads above a divider (the `DexFilters` argument, [D-049](03_decisions.md#d-049)); the groups are `ChipGroup`s; the footer carries Reset, the **live pool count** and Play, with Play refused below the contender count.

**Chip group** ([D-096](03_decisions.md#d-096)) — a `text-overline` label over a wrapping row of chips, with an optional lowercase hint for a group whose rule is not obvious from its chips ("leave empty for all"). Extracted from `DexFilters`, where it was private, once the setup panel needed five of them. The label is the component's reason to exist: [D-040](03_decisions.md#d-040) and [D-050](03_decisions.md#d-050) both turn on a group being named, and a required prop is how that stops being something to remember.

**Search input** — `--color-elevated`, `--color-border-subtle`, placeholder `--color-tertiary`; focus = `--color-border-strong` + 2px `--color-accent` focus ring. Results are a dropdown of rows: pixel sprite + name + type badges.

**Type badge** — pill, `rounded-full`, background = type color, text = near-black (`--color-base`) for all types (§3, [D-027](03_decisions.md#d-027)).

**Cards / panels** — `--color-surface`, `--color-border-subtle`, `--radius-lg`, `p-4`.

> **Corrected.** This line specified `p-6` and nothing ever used it: all three control panels (`/compare`, `/dex`, `/types`) ship `p-4`, and at 390px `p-6` leaves the chips inside them noticeably cramped for width. The doc now states the value in the code ([D-058](03_decisions.md#d-058)).

**Page shell** ([D-058](03_decisions.md#d-058)) — every page opens with `PageHeader`: the name in the `Word.` motif with the accent dot, and a one-line description in `text-body-sm text-secondary`, centred, `mb-8`. `as` selects the heading level, so a Home feature section renders the same block as an `<h2>` one rung down the outline. Containers come from `pageChrome.jsx` — `PAGE_TOOL` (`py-8`) for the three working surfaces, `PAGE_CONTENT` (`py-16`) for Credits and the 404. Home's hero and the 404's numeral are exempt by design, as one-off treatments at a different size.

**Filter chip** ([D-058](03_decisions.md#d-058)) — one `FilterChip` serves the dex's type/generation filters **and** the type chart's picker; they had been two components with byte-identical geometry. Colour and shape come from `chipStyles.jsx`, the shared geometry (`min-h-9`, `px-3 py-1.5`, `gap-1.5`) with them. The type chart's two-type cap is the one behavioural prop: capped chips take `aria-disabled` and 40% opacity rather than the real `disabled` attribute, so a keyboard user is told they are unavailable instead of skipping them silently.

**STAB chip** ([D-058](03_decisions.md#d-058)) — one `StabChip` for the comparison card and Home's board, which had drifted to different fills and borders. The fill (14% of the attacking type over `elevated`), the tier icon and the border strength are the encoding and are identical on both; `dense` changes geometry only. **2× is the only tier with a colour of its own** — the resisted and immune tiers moved from `text-tertiary` to `text-secondary` because tertiary failed AA on 17 of 18 type fills, audited as group 7 of `npm run audit:contrast`.

---

## 7. Motion

- **Bar fill:** grow from 0 to value using `--dur-bar` + `--ease-standard` (as built, via `.animate-grow-w`); no stagger.
- **The answer never moves the board** ([D-103](03_decisions.md#d-103)). Stacked, the overlay is a real grid row and the verdict card is **80px taller** than the question card (134.6 against 54.8, measured at 390px) — so in a row sized by its contents, answering shoved both Pokémon 40px apart. The row now keeps the **question's** height, and the verdict is lifted out of flow on top of it, growing **downward**: above the gutter is the first Pokémon's value, which is the answer, and below it is the second Pokémon's artwork, whose labels sit lower and stay visible. Reserving the taller height instead would have spent a quarter of a phone's artwork on an empty gutter, permanently, to smooth one transition.

- **The clash** ([D-097](03_decisions.md#d-097), rebuilt by [D-100](03_decisions.md#d-100), split by [D-102](03_decisions.md#d-102)): a round arrives as a **collision**, in two parts.

  **The charge.** Everything left of the board's centre runs right and everything right of it runs left, accelerating (`--ease-clash`) across 5rem in `--dur-charge`, and **stopping dead** — no easing out, no rebound. Weight is velocity, not duration. The board's background is `--color-base`, so the gap the two halves close on is the page's own black; in the divider's grey it flashed as a bar down the middle of the screen every round.

  **The shake**, on impact. It is on each panel's **content**, never the panel: shaking the panels would flicker the gaps between them open and shut a dozen times a round, which is the fault the paragraph above exists to have fixed. Boxes collide; the things inside them rattle. Four decaying swings with a little rotation — a pure sideways slide reads as a glitch, a slide that tips reads as something being hit — and the first swing carries **onward in the direction of travel**, because that is what inertia looks like.

  **Every shake parameter varies per panel**, set as custom properties on the grid cell and inherited down, so four contenders read as four things reacting rather than as one animation played four times. Derived from the round and the slot rather than drawn at random: a render may not be a dice roll, and the same round should always look the same.

  **No stagger on the charge**, matching the bar fill's rule — four panels arriving in sequence reads as a loading state. The variation lives in the shake, where it reads as a reaction.

  **No stagger**, for the bar fill's reason — four panels arriving in sequence reads as a loading state rather than as a collision. A slot-machine randomiser before each question was considered and refused: it puts latency in front of a game whose appeal is pace, and the clash already spends 560ms of it.

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
- **Targets:** the binding standard is **WCAG 2.5.8 (AA) — 24×24 CSS px**, or smaller where spacing keeps a 24px circle centred on one target clear of the next. Primary CTAs use `Button` `md` (44px); compact controls — `Button` `sm`, the dex filter chips, the generation strip — are **36px**. Nav links fill the header's 56px height.

  > **Correction ([D-042](03_decisions.md#d-042)).** This line previously read "interactive hit areas ≥ 44×44px on touch". That was never true **anywhere** on the site — Swap is 36px, form chips 21px, and the dex chips shipped at 25px. 44×44 is WCAG **2.5.5**, a **AAA** criterion; Statmon targets AA ([D-027](03_decisions.md#d-027)). The rule now states the standard actually being met, so it can be checked instead of admired.

  > **And it is checked.** `npm run sweep:widths` measures every interactive element at 320px and fails on any that is under 24×24 _and_ within 24px of its neighbour's centre ([D-059](03_decisions.md#d-059)). A criterion the docs assert is a criterion nobody verifies.

- **The nav links were the outstanding failure, and are fixed.** The D-042 correction above wrote down "nav links are 14px" and left it there: bare text with no padding gave them a ~17px hit box inside a 56px bar. They now fill the header's height, which changes nothing visually since only their colour reacts to hover. ([D-065](03_decisions.md#d-065))

- **`FormChips` are not an exception after all.** This doc carried them for three sessions as "the one place on the site likely to fail 2.5.8's spacing test". Measured, they pass: 45–59 × 21px, and in Minior's eight-form wrapped worst case the tightest neighbouring centre is **27.1px** against the 24px the spacing exception requires — re-verified after D-080 moved them into the labelled controls band, where they still wrap to two rows and still pass. It was a guess, not a measurement, and it propagated into a roadmap item. The margin is only 3px, so the sweep keeps measuring it. ([D-059](03_decisions.md#d-059))

- **Scrollable regions are keyboard-reachable.** The type chart's panel is the site's one sideways-scrolling surface ([D-052](03_decisions.md#d-052)); it is a focusable, named `role="region"`, because a scroll container that cannot take focus cannot be scrolled without a pointer — at 390px that stranded ten of the eighteen columns. ([D-065](03_decisions.md#d-065))

- **No `title` tooltips.** `title` is unreachable by keyboard, invisible on touch and inconsistently exposed by screen readers, so explanations are visible or `sr-only` text instead. ([D-065](03_decisions.md#d-065))

- **Form controls are 16px.** Below that, iOS Safari zooms the page on focus and does not zoom back. ([D-065](03_decisions.md#d-065))

- **Safe areas.** `viewport-fit=cover` with `env(safe-area-inset-*)` on the body and the footer, so a notched phone held sideways does not run the header, nav and gutter under the notch.
- **Semantics:** stat rows use proper labels/structure so a screen reader announces "Speed, Pokémon 1 100, Pokémon 2 55, difference 45 in favor of Pokémon 1."

---

## 10. Brand & Assets

- **Wordmark:** "Statmon" set in Space Grotesk 700, with the pastel-purple accent on a single detail (e.g. the dot/tittle or a subtle underline glow) — not the whole word.
- **Mascot:** Volcarona featured on Home; the purple→blue flame gradient is allowed only there.
- **Hero wall:** the sprite grid is Home's alone ([D-070](03_decisions.md#d-070)). Sprites are the site's texture everywhere else — 32px in dex rows, 56px in comparison cards — and this is the one surface that uses them at size, as the thing you look at rather than as a row label.
- **Favicon / OG:** derive from the wordmark + accent on `--color-base`; per-comparison OG images are a [Someday] stretch ([00_brainstorm §10](00_brainstorm.md)).
- **Iconography:** a single lightweight line-icon set (e.g. Lucide), stroke-based, matching the minimalist tone.

---

## 11. Token Summary (for implementation)

All of the above ships as CSS custom properties on `:root` plus a Tailwind theme extension. The three generated/maintained artifacts:

1. **Core tokens** — the §2 palette, §4 font tokens, §5 spacing/radii.
2. **Type-color tokens** — the 18 `--color-type-*` custom properties (§3), consumed via `typeColorVar()` / `typeTextVar()`. (No generated JSON map — see §3.)
3. **Component classes** — built on the tokens (§6).

Open follow-ups fold into Phase 2 of the [05_roadmap](05_roadmap.md). **The ⚠ contrast-checks are complete** ([D-027](03_decisions.md#d-027)): every pairing passes WCAG AA, verified reproducibly via `npm run audit:contrast`. Adjustments made: Dragon lightened to `#9268FF`, and `--color-tertiary` / `--color-diff-tie` moved to `neutral-400`.
