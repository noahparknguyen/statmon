# Statmon — Style Guide (Step 6)

_The rulebook. Where [04_design](04_design.md) explains the **rationale** (why
the palette, why these fonts), this document is the **specification**: every
colour, size, space, radius, layer and component on the site, each as a closed
set, each with the check that enforces it. If a value isn't in this document,
it doesn't get used — and since [D-134](03_decisions.md#d-134), that sentence is
a check rather than a hope._

> **How to read it.** Every section states its rule first and its reasons
> after. Every rule that can be measured is: §12's enforcement table names the
> check. A design that needs something this document does not have gets it
> **added here first**, with its reason, and then built. Never the other way
> round.

---

## 1. Token Architecture

Three tiers, following standard design-system practice
([research](02_research.md)):

1. **Primitive tokens** — raw values, the palette of possible choices (e.g.
   `--color-neutral-900`, `--text-lg`). **Never used directly in components.**
2. **Semantic tokens** — role-based names (e.g. `--color-surface`,
   `--color-primary`). Most point at a primitive; two carry their own value
   because no ramp holds them (§3). **These are what components use.**
3. **Component tokens** — a value one component owns that another part of the
   system must read back. Since [D-134](03_decisions.md#d-134) these are the
   colour-mix shares the contrast audit measures, the focus ring's geometry,
   the text-over-art shadow and the flame's text inset (§3.1). A number that a
   check measures lives in `index.css`, where the browser paints it from, and
   never as a literal in a component file.

**Naming:** `category-property-modifier`, lowercase, hyphenated. Tailwind v4 is
CSS-first, so a token's prefix decides which utilities it generates: colours
are `--color-*`, font sizes own `--text-*`, weights `--font-weight-*`,
line-heights `--leading-*`, tracking `--tracking-*`, breakpoints
`--breakpoint-*`. Every name here is the real emitted name in `src/index.css`.

---

## 2. Color — Primitive Palette

**Tailwind's stock palette is cleared** (`--color-*: initial`), so `bg-red-500`,
`bg-neutral-200` and every other stock colour simply do not exist: an
off-palette class is a no-op you notice rather than an off-brand colour that
ships ([D-033](03_decisions.md#d-033)). `transparent` is the one stock value
kept.

**Unused primitives are kept; unused semantic tokens are deleted.** A
primitive is the palette of possible choices, so an unreferenced one is
headroom: `--color-neutral-100`, `-500` (now the field edge's value), `-800`,
`--color-accent-500` and `-600` are kept on purpose. A semantic token names a
role, and one that nothing plays is a claim nothing backs, so it goes.

### Neutrals (dark-first ramp)

| Token                 | Hex       | Behind                   |
| --------------------- | --------- | ------------------------ |
| `--color-neutral-950` | `#0B0C0F` | `base`                   |
| `--color-neutral-900` | `#14161B` | `surface`                |
| `--color-neutral-850` | `#1C1F27` | `elevated`               |
| `--color-neutral-800` | `#23262F` |                          |
| `--color-neutral-700` | `#2A2E37` | `border-subtle`          |
| `--color-neutral-600` | `#3A3F4B` | `border-strong`          |
| `--color-neutral-500` | `#6B7280` | `border-field`           |
| `--color-neutral-400` | `#8A909C` | `tertiary`, `diff-tie`   |
| `--color-neutral-300` | `#A8AEBA` | `secondary`              |
| `--color-neutral-100` | `#D7DAE0` |                          |
| `--color-neutral-50`  | `#F4F5F7` | `primary`, `track-glass` |

### Accent (Chandelure's flame: periwinkle into blue)

| Token                 | Hex       |                                  |
| --------------------- | --------- | -------------------------------- |
| `--color-accent-300`  | `#B3B8F0` | behind `accent-hover`            |
| `--color-accent-400`  | `#9AA0E8` | behind `accent`                  |
| `--color-accent-500`  | `#7E85D8` | headroom                         |
| `--color-accent-600`  | `#6A70C4` | headroom                         |
| `--color-accent-blue` | `#A8C3DD` | the flame's blue stop            |
| `--color-accent-core` | `#7352E6` | the flame's core, its first stop |

The **flame gradient** is `linear-gradient(90deg, accent-core, accent, accent-blue)`,
the `.bg-flame` utility. See §3.2 for where it may appear.

### Type colours (18)

The per-type primitives, tuned for the dark background. The table with each
colour's notes is [04_design §3](04_design.md); the tokens are
`--color-type-<name>`, consumed through `typeColorVar()` and never as a class.
The canonical list of the 18 slugs is `TYPES` in `src/lib/types.js`
([D-038](03_decisions.md#d-038)).

---

## 3. Color — Semantic Tokens

**These are the only colour tokens a component may name.** `npm run
audit:styles` fails on a primitive used as a class.

| Semantic token            | Value                 | Role                                                                        |
| ------------------------- | --------------------- | --------------------------------------------------------------------------- |
| `--color-base`            | `neutral-950`         | The page                                                                    |
| `--color-surface`         | `neutral-900`         | A surface: panels, cards, boards, the dialog                                |
| `--color-elevated`        | `neutral-850`         | Inside a surface: fields, chips, bar tracks, the 1× cell                    |
| `--color-border-subtle`   | `neutral-700`         | Every border that only separates                                            |
| `--color-border-strong`   | `neutral-600`         | A chip's edge; a border answering hover; an underline                       |
| `--color-border-field`    | `neutral-500`         | A text field's edge, and nothing else (§7.2)                                |
| `--color-primary`         | `neutral-50`          | Headings, values, primary text                                              |
| `--color-secondary`       | `neutral-300`         | Labels and supporting text                                                  |
| `--color-tertiary`        | `neutral-400`         | Hints, captions, overlines ([D-027](03_decisions.md#d-027))                 |
| `--color-accent`          | `accent-400`          | Actions, links, brand, selection, the focus ring                            |
| `--color-accent-hover`    | `accent-300`          | An accent control under the pointer                                         |
| `--color-accent-contrast` | `#12121C` (own value) | Text and icons on a solid accent fill, or on the flame                      |
| `--color-accent-muted`    | `#34355C` (own value) | The correct answer's quiet fill ([D-093](03_decisions.md#d-093))            |
| `--color-diff-tie`        | `neutral-400`         | A tie in a difference cell                                                  |
| `--color-track-glass`     | `neutral-50` at 16%   | A stat bar's track where it sits over artwork                               |
| `--hero-scrim`            | 65% of `base`         | How much page sits over Home's sprite wall ([D-070](03_decisions.md#d-070)) |

**`--hero-scrim` exists to be audited.** Home's wordmark and tagline sit on a
wall of sprites, so their backdrop is whatever pixel lands behind them. Group 8
of `npm run audit:contrast` composites base over pure white (the worst a sprite
can produce) at this value and checks `primary` on it: 5.68:1. It is also why
the hero's line is `primary` where every other subtitle is `secondary`, which
lands at 2.78:1 there.

### 3.1 Component tokens

Each is the share of one colour mixed into another, set by one component and
read by `npm run audit:contrast` from `index.css` ([D-134](03_decisions.md#d-134)).
Change one and the audit re-measures it.

| Token                                       | Value                    | Where                                               | Audited  |
| ------------------------------------------- | ------------------------ | --------------------------------------------------- | -------- |
| `--mix-stab-fill`                           | 14%                      | The STAB chip's type fill over `elevated`           | group 7  |
| `--mix-stab-border`                         | 28%                      | The STAB chip's border, quiet tiers                 | —        |
| `--mix-stab-border-strong`                  | 55%                      | The STAB chip's border, 2×                          | —        |
| `--mix-panel-tint`                          | 16%                      | A game panel's type tint over `base`                | group 10 |
| `--mix-dex-fill`                            | 28%                      | The dex stat cell's fill                            | group 5  |
| `--mix-grid-strong`                         | 55%                      | The type chart's 2× cell, accent over `elevated`    | group 6  |
| `--mix-grid-wash`                           | 12%                      | A selected column's wash                            | group 6  |
| `--mix-grid-hover`                          | 7%                       | The type chart's cross-hair                         | —        |
| `--flame-text-inset`                        | 18%                      | How far from each end the speed banner's text stays | group 11 |
| `--shadow-text-art`                         | `0 1px 6px` at 75% black | Text over artwork (`.shadow-on-art`)                | —        |
| `--focus-ring-width`, `--focus-ring-offset` | 2px, 2px                 | The one focus ring (§12.3)                          | group 12 |

**A colour-mix share that sets a text pairing is a token; one that only adds
`base` is not.** Home's radial pool and bottom fade over the sprite wall only
ever deepen the audited scrim, so they stay inside `SpriteWall` as art
direction. The STAB chip has **two** border strengths, loud and quiet, which is
[D-051](03_decisions.md#d-051)'s one-loud-state scale; it had four, two of them
28% and 30% ([D-135](03_decisions.md#d-135)).

### 3.2 How the colours fit together

**One hue family.** Measured in OKLCH, the neutrals are a faintly violet grey
(hue 264–271°, chroma ≤ 0.023), the accent sits at 280°, the flame's core at
288° and its blue stop at 247°. The blacks and the purples are one family, which
is Chandelure, and none of them fights another.

**Surfaces are told apart by their edges.** `surface` on `base` is 1.08:1 and
`elevated` on `surface` is 1.10:1: on a near-black UI the dark end has no room,
so a surface is always drawn with its `border-subtle` edge (1.33:1). That is
deliberate dark-UI practice, not a contrast failure; nothing is identified by
those fills alone.

**The 18 type colours are Pokémon's, and some sit close together by nature.**
The nearest pairs are Grass/Bug (ΔE 0.062 in OKLab), Electric/Ground (0.070) and
Ground/Rock (0.075). It is acceptable because a type colour never appears
without the type's name beside it (§12 rule 6).

**The accent sits among them, and is closest to Flying** (ΔE 0.054, nearer than
any two types are to each other). 04_design used to claim the accent was "kept
bluer and lighter than the purple-family types so it never reads as a type";
measured, that is not true of Flying. Moving the accent does not fix it: the
best hue found (272°) reaches 0.074 from Flying by arriving 0.074 from Water.
So the colour stays, and the rule that does the real work is structural rather
than chromatic: **the accent never colours a type, and a type's colour never
appears without the type's name.** A selected Flying chip and a selected
"Gen 5" chip look alike because both are selected, which is true.

**The flame appears in exactly two places:** the BST delta numeral (`text-numeral-*`
in `bg-clip-text`) and the speed banner, on the comparison card and Home's
board. Not on the hero, which is sprites ([D-070](03_decisions.md#d-070)); not
behind any other data. Text in the flame is held to the flame's own audit:
the numeral is large text (3.51:1 at its darkest stop, against 3.0), and the
banner's words stay `--flame-text-inset` from each end, where the worst point
is 4.71:1 against AA's 4.5 ([D-136](03_decisions.md#d-136)).

**Type colours are never blended with each other.** A surface tinted by a
Pokémon's type takes its primary type, one colour even for a dual type, and its
badges carry the whole typing ([D-144](03_decisions.md#d-144)). Darkened to a
tint, a yellow is olive, an orange brown and a red maroon, and two of them
together read as mud however the blend is tuned. The flame is the site's only
colour gradient.

---

## 4. Typography — Foundations

### 4.1 Families

| Token            | Stack                            | Role                              |
| ---------------- | -------------------------------- | --------------------------------- |
| `--font-display` | `'Space Grotesk', sans-serif`    | Wordmark, headings, names, labels |
| `--font-body`    | `'Inter', system-ui, sans-serif` | Body, UI, **every stat number**   |

Stat numbers always carry tabular figures (`font-feature-settings: "tnum" 1`),
which is built into the stat styles, so digits align and a changing number does
not shift what sits beside it. Both families are self-hosted
([D-061](03_decisions.md#d-061)).

### 4.2 Weights

| Token                    | Value | Family               |
| ------------------------ | ----- | -------------------- |
| `--font-weight-regular`  | 400   | Inter                |
| `--font-weight-medium`   | 500   | Inter, Space Grotesk |
| `--font-weight-semibold` | 600   | Inter                |
| `--font-weight-bold`     | 700   | Space Grotesk        |

### 4.3 The size ramp: eleven sizes, closed

Anchored at `--text-base: 1rem`, all in `rem` so they honour user zoom.
**No size exists outside this ramp, and no component names a ramp size
directly:** components use the named styles of §5, and `audit:styles` fails a
stock size such as `text-sm`.

| Token         | rem       | px  | Step role                   |
| ------------- | --------- | --- | --------------------------- |
| `--text-2xs`  | 0.6875rem | 11  | overline, badge             |
| `--text-xs`   | 0.75rem   | 12  | caption, chip label         |
| `--text-sm`   | 0.875rem  | 14  | small UI, dense numbers     |
| `--text-base` | 1rem      | 16  | body, fields                |
| `--text-md`   | 1.125rem  | 18  | large body, h4, stat value  |
| `--text-lg`   | 1.25rem   | 20  | h3, Pokémon name            |
| `--text-xl`   | 1.5rem    | 24  | h2                          |
| `--text-2xl`  | 1.875rem  | 30  | h1                          |
| `--text-3xl`  | 2.25rem   | 36  | display                     |
| `--text-4xl`  | 3rem      | 48  | hero display                |
| `--text-5xl`  | 3.75rem   | 60  | a rung of the scale, unused |

The steps are 1px apart at the small end and widen as the sizes grow (ratios
1.09 to 1.33), which is the right shape for a data UI: the small sizes do the
labelling and need fine steps, the large ones make hierarchy and need big ones.
11 and 12 are 1px apart and are kept as two sizes on purpose: 11 is always
uppercase and tracked or a chip label, 12 is always mixed case, so case and
tracking separate them where 1px could not.

### 4.4 Line-height

| Token               | Value | Use                                          |
| ------------------- | ----- | -------------------------------------------- |
| `--leading-tight`   | 1.1   | Display, hero                                |
| `--leading-snug`    | 1.2   | Headings, captions                           |
| `--leading-base`    | 1.5   | Body                                         |
| `--leading-relaxed` | 1.6   | Lead paragraphs                              |
| `--leading-none`    | 1     | Single-line UI: buttons, badges, stat digits |

### 4.5 Letter-spacing

| Token                | Value   | Use                 |
| -------------------- | ------- | ------------------- |
| `--tracking-tighter` | -0.02em | Display, hero       |
| `--tracking-tight`   | -0.01em | h1, h2              |
| `--tracking-normal`  | 0       | Body, most UI       |
| `--tracking-wide`    | 0.02em  | Stat digits, badges |
| `--tracking-wider`   | 0.14em  | Uppercase overlines |

---

## 5. Typography — The Named Text Styles

**Every piece of text on the site uses exactly one of these 22 styles.** Each
bundles family, size, weight, line-height and tracking. A design that needs a
style not listed here gets it **added to this table**, not improvised
([D-035](03_decisions.md#d-035)). Measured across 15 routes at two widths, every
type combination the site renders is one of these, apart from the one inline
emphasis below.

| Style token         | Family      | Size | Weight | Leading | Tracking          | Role                                                           |
| ------------------- | ----------- | ---- | ------ | ------- | ----------------- | -------------------------------------------------------------- |
| `text-display-hero` | display     | 48   | 700    | tight   | tighter           | Home's wordmark, the 404 numeral                               |
| `text-display`      | display     | 36   | 700    | tight   | tighter           | A typing set as the whole content of a panel                   |
| `text-h1`           | display     | 30   | 700    | snug    | tight             | Page title (one per page)                                      |
| `text-h2`           | display     | 24   | 500    | snug    | tight             | A round's question; a Pokémon in a two-up arena                |
| `text-h3`           | display     | 20   | 500    | snug    | normal            | **A Pokémon's name at card scale**; the wordmark in the header |
| `text-h4`           | display     | 18   | 500    | snug    | normal            | Section title inside a page; a card's title                    |
| `text-body-lg`      | body        | 18   | 400    | relaxed | normal            | Home's hero line                                               |
| `text-body`         | body        | 16   | 400    | base    | normal            | Long-form prose; every form field                              |
| `text-body-sm`      | body        | 14   | 400    | base    | normal            | Subtitles, descriptions, supporting text                       |
| `text-caption`      | body        | 12   | 500    | snug    | normal            | Captions, metadata, footnotes                                  |
| `text-overline`     | display     | 11   | 500    | none    | wider · UPPERCASE | Group labels, stat labels, column headers                      |
| `text-overline-lg`  | display     | 16   | 500    | none    | wider · UPPERCASE | The arena's ATTACKING / DEFENDING                              |
| `text-stat-lg`      | body (tnum) | 20   | 600    | none    | wide              | BST, an answer's multiplier                                    |
| `text-stat`         | body (tnum) | 18   | 600    | none    | wide              | A stat value with a row of its own                             |
| `text-stat-sm`      | body (tnum) | 14   | 600    | none    | wide              | A stat value in a dense row                                    |
| `text-diff`         | body (tnum) | 14   | 600    | none    | wide              | A difference, and a multiplier on a chip                       |
| `text-numeral-xl`   | display     | 48   | 700    | none    | normal            | A display number in a fixed band (the BST delta)               |
| `text-numeral-lg`   | display     | 36   | 700    | none    | normal            | The same, one size down                                        |
| `text-numeral-md`   | display     | 30   | 700    | none    | normal            | The same, two sizes down                                       |
| `text-meta`         | display     | 12   | 600    | snug    | normal            | A type's name on a STAB chip                                   |
| `text-badge`        | display     | 11   | 600    | none    | wide              | Type badges and compact chips                                  |
| `text-button`       | body        | 14   | 600    | none    | normal            | Buttons, nav links, the speed banner                           |

**22 styles on 11 sizes.** `text-label` was the 23rd and was used by nothing
on the site, so it went, by the rule that deletes an unused semantic token
([D-134](03_decisions.md#d-134)).

**One style per ROLE, even when two share their values.** `text-stat-sm` and
`text-diff` are identical today and are two styles, because a stat value and a
difference are different roles that are free to diverge. The comparison card's
mirrored rows set their values in `text-diff` until D-135, which made a stat
value read as a difference to the next person who touched it.

**Why the numerals have their own styles.** `text-numeral-*` differ from
`text-display*` in one property: `leading-none`. They sit optically centred in
fixed-height bands, and `leading-tight`'s half-leading would push them off
centre ([D-035](03_decisions.md#d-035)).

**Named styles do not take responsive variants.** They are hand-written
`@layer components` rules, so `md:text-body-sm` generates no CSS. A component
that needs two sizes of a style takes a prop and two call sites
([D-065](03_decisions.md#d-065)).

**The one exception: inline emphasis.** Inside a run of text, family and weight
may change and nothing else, the way `<strong>` works. The leader's name in the
comparison card's BST line (`font-display font-semibold`) is the single
instance, and `audit:styles` allows exactly that pair.

### 5.1 Which style for which job

| The text is…                              | Style                                  | Colour                                       |
| ----------------------------------------- | -------------------------------------- | -------------------------------------------- |
| A page's title                            | `text-h1` + the accent dot             | `primary`                                    |
| The line under a page's title             | `text-body-sm`                         | `secondary`                                  |
| A section's title inside a page           | `text-h4`                              | `primary` or `secondary` with coloured types |
| A card's title (games index, picker)      | `text-h4`                              | `primary`                                    |
| A Pokémon's name on a card                | `text-h3`                              | `primary`                                    |
| A Pokémon's name in a row                 | `text-body-sm`                         | `primary`                                    |
| A Pokémon's name in a thumbnail           | `text-caption`                         | `primary`                                    |
| A label over a group of controls          | `text-overline`                        | `tertiary`                                   |
| A label beside a value (stat row, footer) | `text-overline`                        | `tertiary` or `secondary`                    |
| A dex number, a count, a footnote         | `text-caption`                         | `tertiary`                                   |
| An inline empty state                     | `text-body-sm`                         | `tertiary`                                   |
| Prose (About)                             | `text-body`                            | `secondary`                                  |
| Any text field                            | `text-body` (16px: iOS zooms below it) | `primary`, placeholder `tertiary`            |

---

## 6. Spacing and Layout

Spacing is on a **4px base**. Tailwind's default `--spacing: 0.25rem` already
yields it, so no `--space-*` tokens are emitted: the utility is the token.

### 6.1 The spacing scale, closed

**Padding, margin and gap take only these steps.** `audit:styles` fails any
other.

| Step  | px  | Step | px  | Step | px  |
| ----- | --- | ---- | --- | ---- | --- |
| `0`   | 0   | `3`  | 12  | `12` | 48  |
| `px`  | 1   | `4`  | 16  | `16` | 64  |
| `0.5` | 2   | `5`  | 20  | `20` | 80  |
| `1`   | 4   | `6`  | 24  | `24` | 96  |
| `1.5` | 6   | `8`  | 32  | `36` | 144 |
| `2`   | 8   | `10` | 40  | `40` | 160 |
| `2.5` | 10  |      |     |      |     |

**Reach for a whole step first.** The half steps are real (every chip group
sits on `1.5`, because 4px reads as touching and 8px breaks a row of pills
apart), but a half step is the exception that has to be visibly right.
**36 and 40 are layout steps** and nothing else: Home's section rhythm
([D-083](03_decisions.md#d-083)) and the flanking art's anchor off the centre
line ([D-072](03_decisions.md#d-072)).

### 6.2 Padding, by kind of box

| Box                                        | Padding                       | Examples                                                                        |
| ------------------------------------------ | ----------------------------- | ------------------------------------------------------------------------------- |
| **Surface**                                | 16 (`p-4`)                    | Every panel, card body, board band, dialog body, the verdict card               |
| **Inset** (nested in a surface)            | 12 (`p-3`)                    | A phone's per-stat card, a tier row, the search's "No matches"                  |
| **Bar** (one line, inside or as a surface) | 16 across, 12 down            | A dialog's header and footer, a round's question card                           |
| **Field**                                  | 12 across                     | Every text field and select                                                     |
| **Exception: the arena**                   | 8–12 on a phone, 16 from `sm` | Game panels, sized by density ([D-096](03_decisions.md#d-096))                  |
| **Exception: the type chart panel**        | 6 (`p-1.5`)                   | Keeps the panel's corner off the corner badges ([D-053](03_decisions.md#d-053)) |

A structured surface (a Pokémon card, the comparison card, Home's board) applies
the surface's 16 to each band across, and sets each band's height by its own
spec. There were 20px cards (`p-5`) and a 20px board (`px-5`) beside 12px and
16px ones until [D-135](03_decisions.md#d-135); the surface number is 16.

### 6.3 Gaps, by relationship

**Proximity: internal ≤ external** ([D-019](03_decisions.md#d-019)). Things
that belong together sit closer than things that do not, and every gap below is
one of a handful of relationships.

| Relationship                                                                | Gap                                                                                                           |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| A heading and the line that supports it                                     | 4                                                                                                             |
| A marker dot or icon and its label                                          | 6                                                                                                             |
| Chip to chip in a group                                                     | 6 (the generation strip: 4, §12.2)                                                                            |
| A label over its group                                                      | 8                                                                                                             |
| A group and the note under it                                               | 8                                                                                                             |
| A section heading and its content                                           | 12                                                                                                            |
| Group to group inside a panel (the panel's own gap, never a child's margin) | 16                                                                                                            |
| A divider and what it divides, each side                                    | 16                                                                                                            |
| Sibling surfaces (cards in a grid, the board)                               | 16                                                                                                            |
| A tool's controls panel and what it controls                                | 24                                                                                                            |
| A page title and the first block                                            | 32                                                                                                            |
| A section's content and its call to action                                  | 32                                                                                                            |
| Section to section within a page                                            | 32                                                                                                            |
| Home's sections                                                             | 144                                                                                                           |
| The last block and the footer                                               | the page's bottom padding: 80 on a tool, 96 on a content page, or more on a page shorter than the screen (§8) |

**Never touch an edge.** Content beside a border, a divider or a card edge gets
padding on both sides. The speed banner was the one surface whose text could
reach its edges, with a long name; it can't now ([D-136](03_decisions.md#d-136)).

**The footer has no margin of its own.** The space above it is the page's bottom
padding, the one number [D-083](03_decisions.md#d-083) set; the footer's own
`mt-16` was adding 64px on top of it until [D-139](03_decisions.md#d-139).

### 6.4 Sizes and positions

**Heights, widths and positions are on the 4px grid** (any step, or a half
step), a fraction, or a keyword (`full`, `svh`, `auto`, `max`, `min`,
`fit`). **A screen's height is `svh`**, the small viewport, which is what a
phone shows with its toolbar out. Never `screen`: its `vh` is taller than that
([D-110](03_decisions.md#d-110)). Measures are capped at named widths only: `max-w-content` (1120px, the
page), `max-w-4xl`, `max-w-2xl` (the boards, prose), `max-w-xl` (a subtitle, a
legal line), `max-w-md`, `max-w-sm`.

**Control heights are five numbers.**

| Height | What                                                                              |
| ------ | --------------------------------------------------------------------------------- |
| 21     | A compact chip, in the card's 88px controls band ([D-125](03_decisions.md#d-125)) |
| 36     | Every compact control: chips, `Button sm`, icon buttons, the sort select          |
| 40     | A table's column header                                                           |
| 44     | A page's call to action (`Button md`), a text field, an answer                    |
| 56     | Bar-filling: the header's nav links, the game bar's title                         |

WCAG 2.5.8 (AA) is the target-size floor: 24×24, or clear of a neighbour's
centre by 24. Everything above 24 passes by size. The 21px chips pass by
spacing (27.1px between the tightest centres, [D-059](03_decisions.md#d-059)),
and `npm run sweep:widths` measures every target at 320px.

### 6.5 Arbitrary values

**An arbitrary value must show its working.** "No arbitrary values" is right
about taste and wrong about arithmetic, so the rule is that each one is a number
derived from something else, written down with its derivation. The list is
closed and lives in `scripts/style-audit.mjs`; a new one is added there, with
its reason, or the audit fails.

| Value                                           | Derivation                                                                                                                                                         |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `min-h-[21px]`                                  | A compact chip: 11px text, `py-1`, a 1px border each side                                                                                                          |
| `min-h-[26rem]`                                 | The game board's floor on a landscape phone                                                                                                                        |
| `h-[72svh]`                                     | Home's hero, so the board crests the fold ([D-070](03_decisions.md#d-070))                                                                                         |
| `max-h-[85svh]`                                 | The setup dialog stays inside the viewport                                                                                                                         |
| `w-[min(36rem,calc(100vw-2rem))]`               | The setup dialog, inside the page's gutters                                                                                                                        |
| `max-h-[475px]`, `max-w-[475px]`                | The vendored artwork's own size ([D-109](03_decisions.md#d-109))                                                                                                   |
| `right-[calc(50%+8rem+1px)]`                    | The type game's attacking column, measured from the board's right edge: half the board, half the 16rem answer column, one divider ([D-143](03_decisions.md#d-143)) |
| `[image-rendering:pixelated]`                   | Pixel sprites drawn at whole multiples                                                                                                                             |
| `[--wall-tile:6rem]`, `[--wall-tile:12rem]`     | A hero tile at 1× and exactly 2× the sprite's 96px                                                                                                                 |
| The `grid-cols-[…]` / `grid-rows-[…]` templates | One per layout: the mirrored row, a stat row, a tier row, the controls band, two sides and a middle                                                                |

---

## 7. Radius, Borders, Elevation and Opacity

### 7.1 Radius, by role

**Five radii, and a radius is chosen by what the box IS, never by eye.**

| Token          | Value  | Role                                                                                           |
| -------------- | ------ | ---------------------------------------------------------------------------------------------- |
| `rounded-lg`   | 16px   | **A surface**: panel, card, board, dialog, a round's card                                      |
| `rounded-md`   | 10px   | **An inset**, nested in a surface: per-stat card, tier row, the search dropdown, a sprite tile |
| `rounded-sm`   | 6px    | **A text field** or select                                                                     |
| `rounded-xs`   | 4px    | **A grid cell**: type chart cells and axis badges, the dex's stat fill                         |
| `rounded-full` | 9999px | **Anything you press or that labels**: buttons, chips, badges, bars, dots, the skip link       |

A side radius (`rounded-tl-lg`, `rounded-l-lg`, …) is only ever the outer corner
of something clipped by a surface's `lg` curve, such as a panel at the corner
of a games thumbnail. `--radius-xl` (24px) was defined for "large hero cards"
and used by nothing, so it went ([D-134](03_decisions.md#d-134)). The skip link
was a 10px box of its own until then.

### 7.2 Borders

- **Width:** 1px (`border`, or one side). 2px only as the focus ring
  (§12.3) and the arena's inset marking ring.
- **Colour:** `border-subtle` by default (it is the global default, so a bare
  `border` is already right); `border-strong` for a chip's edge and a border
  answering hover; **`border-field` for a text field's edge only.**
- **Style:** solid. **Dashed means empty**: the empty Pokémon card.

**Why the field has its own border.** WCAG 1.4.11 asks 3:1 of whatever
identifies a control, against what is next to it. A chip is identified by its
label, but a text field's edge is the only thing that says "type here", and
`border-subtle` was 1.33:1 against the panel. `border-field` is 3.74 against
`surface`, 4.05 against `base` and 3.41 against the field's own fill; group 12
of `audit:contrast` measures it ([D-136](03_decisions.md#d-136)).

### 7.3 Elevation and effects

Dark UI separates surfaces with edges rather than shadows. **Three shadows,
each for one job, and no stock shadow, ring or blur in a component.**

| Token               | Value                     | Job                                                                                           |
| ------------------- | ------------------------- | --------------------------------------------------------------------------------------------- |
| `--shadow-overlay`  | `0 8px 24px` at 50% black | A layer floating over content: the search dropdown, a round's card                            |
| `--shadow-art`      | `0 8px 22px` at 50% black | Lift under official artwork, as `.drop-shadow-art` (a `filter`, so it follows the silhouette) |
| `--shadow-text-art` | `0 1px 6px` at 75% black  | Text over artwork, as `.shadow-on-art`                                                        |

**Scrims.** `.bg-scrim-art` fades a Pokémon card's artwork into its surface;
`--hero-scrim` sets Home's. **Backdrop blur** belongs to the two sticky bars
(the site header and the game bar) and nothing else: they sit translucent over
content scrolling beneath them.

### 7.4 Opacity

**Four steps, each a state.**

| Step            | Means                                                          |
| --------------- | -------------------------------------------------------------- |
| `opacity-40`    | Disabled or unavailable: a disabled button, a capped type chip |
| `opacity-50`    | Receded: what you did not pick, once a round resolves          |
| `/70` on `base` | A modal's backdrop                                             |
| `/85` on `base` | A sticky bar over scrolling content                            |

---

## 8. Breakpoints and Page Layout

| Token             | Min-width | What changes                                                                                                           |
| ----------------- | --------- | ---------------------------------------------------------------------------------------------------------------------- |
| `--breakpoint-xs` | 384px     | The wordmark appears beside the flame mark ([D-062](03_decisions.md#d-062))                                            |
| `--breakpoint-sm` | 480px     | Rows that stacked go side by side; a two-up game splits left and right                                                 |
| `--breakpoint-md` | 768px     | The comparison board's mirrored rows; the dex's stat columns; the Pokémon cards' bars ([D-057](03_decisions.md#d-057)) |
| `--breakpoint-lg` | 1024px    | Three-column board; flanking art on Home; a four-up game in one row                                                    |
| `--breakpoint-xl` | 1280px    | Unused rung                                                                                                            |

`xs` exists for one thing, the header's wordmark, and is measured rather than
chosen: with the wordmark beside four nav items at their phone gaps the header
needs 361px (32 gutter, 121 brand, 8 gap, 200 nav, measured 2026-10-04), so
`xs` at 384 leaves 23px of room for a platform that renders the wordmark wider,
and `npm run sweep:widths` brackets it at 360, 375, 383 and 384.

**One height variant, `short`**: a window under 33rem tall, which is a game
board's 26rem floor under the two 3.5rem bars. Below it the board cannot fit
the screen, which in practice is a phone held sideways. It is used once, as
`md:short:`, to keep the type game's answers on screen there
([D-143](03_decisions.md#d-143)). A new use of it is a new rule, written here
first.

**The page.** Content is capped at `max-w-content` (1120px) and centred. **The
gutter is a uniform 16px (`px-4`) at every width**: a responsive gutter would
change nothing above 1152px, where the content is capped, and cost 16px where
space is tightest ([D-128](03_decisions.md#d-128)).

**Page shells**, from `components/pageChrome.jsx`:

| Shell          | Padding           | Pages                                                                  |
| -------------- | ----------------- | ---------------------------------------------------------------------- |
| `PAGE_TOOL`    | 40 top, 80 bottom | `/compare`, `/dex`, `/types`                                           |
| `PAGE_CONTENT` | 64 top, 96 bottom | `/about`, `/games`, a game's difficulty picker, `/style`, 404          |
| none           |                   | Home (its hero sets its own rhythm); a game board (it is the viewport) |

The top edge is tight because the sticky header stays attached to it; the
bottom is generous because nothing is gained by ending close to the footer
([D-083](03_decisions.md#d-083)). The difficulty picker used to centre itself
in the board's viewport box instead, which put its title flush against the
header at 1280×900 and on every phone ([D-137](03_decisions.md#d-137)).

**No page shows its footer before you scroll.** `<main>` is at least one screen
tall (`min-h-svh`) on every page but a game board, so a page shorter than the
screen ends in empty canvas and the footer starts 57px below the fold
([D-142](03_decisions.md#d-142)). A short page does not pin the footer to the
bottom of the window: at 368px on a desktop, it was the largest thing on
`/games` and the 404. A page taller than the screen is unaffected.

**No page scrolls sideways at any width.** The type chart's panel is the one
surface that scrolls on its own, inside its bordered panel and keyboard-
reachable, because a matrix has no columns it can drop
([D-051](03_decisions.md#d-051), [D-065](03_decisions.md#d-065)).

---

## 9. Motion

| Token             | Value                            | Use                    | Consumed by                          |
| ----------------- | -------------------------------- | ---------------------- | ------------------------------------ |
| `--dur-fast`      | 120ms                            | hover, focus           | **every `transition-*`, by default** |
| `--dur-base`      | 180ms                            | a reveal               | `.animate-reveal`                    |
| `--dur-slow`      | 300ms                            | a rung of the scale    | nothing                              |
| `--dur-bar`       | 450ms                            | a stat bar growing in  | `.animate-grow-w`                    |
| `--dur-charge`    | 220ms                            | the clash's run-in     | `.animate-clash-charge`              |
| `--dur-shake`     | 280ms                            | the clash's aftershock | `.animate-clash-shake`               |
| `--dur-wall`      | 120s                             | Home's hero wall       | `.animate-wall`                      |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)`     | decelerate (default)   | most                                 |
| `--ease-clash`    | `cubic-bezier(0.55, 0, 1, 0.45)` | accelerate             | the clash                            |

**`--dur-fast` is the default transition duration**, so `transition-colors`
gets 120ms with no opt-in, and `audit:styles` fails a `duration-*`,
`ease-*` or `delay-*` in a component ([D-033](03_decisions.md#d-033)).

**Every duration answers something the user just did, with two named
exceptions:** the hero wall, which is ambient and three orders of magnitude
slower, and linear because easing an endless loop reads as a stutter
([D-070](03_decisions.md#d-070)); and the clash, which is an event that has to
be read: two halves, accelerating, stopping dead, then each part of each panel
shaking on its own phase in two axes ([D-100](03_decisions.md#d-100),
[D-102](03_decisions.md#d-102), [D-114](03_decisions.md#d-114)).

**Bars grow in, and re-grow only when they would move.** Every stat bar on the
comparison surfaces animates on mount, keyed on its numbers
([D-124](03_decisions.md#d-124)); Home's phone cards did not until
[D-135](03_decisions.md#d-135). The dex's fills do not: the table windows its
rows, so every row would animate as it scrolled in.

**Reduced motion is mandatory:** under `prefers-reduced-motion: reduce`, every
animation and delay collapses to a frame, and the final state renders at once.

---

## 10. Z-Index

| Token          | Value | Layer                                                                                           |
| -------------- | ----- | ----------------------------------------------------------------------------------------------- |
| `--z-base`     | 0     | normal flow                                                                                     |
| `--z-raised`   | 1     | above sibling content, below all chrome: the dex's sticky headers, the game bar, a round's card |
| `--z-dropdown` | 1000  | the search results                                                                              |
| `--z-sticky`   | 1100  | the site header                                                                                 |
| `--z-overlay`  | 1200  | the setup dialog                                                                                |
| `--z-toast`    | 1300  | the skip link, while focused                                                                    |

**Two kinds of stacking, two rules.** Something that must sit above or below
**another component** takes a rung of the ladder, by token (`var(--z-sticky)`
inline, or `z-(--z-toast)` as a class). Paint order **inside one component**
(art under its scrim under its content) uses `z-0`, `z-1` and `z-2`, and
nothing higher. `audit:styles` fails a `z-10` or a bare `z-1300`.

The ladder is kept complete even where rungs are unused: an incomplete ladder is
what makes someone reach for `z-9999` ([D-041](03_decisions.md#d-041)).

---

## 11. Iconography

Vector icons through **`react-icons`**: Lucide (`react-icons/lu`) for
everything, and Font Awesome 6 (`react-icons/fa6`) for the carets of the
difference indicator and the dex's sort, whose attribution the footer carries
([D-120](03_decisions.md#d-120)).

**An icon is 1em of the text it sits with.** It takes its size from its label:
14px in a button, 18px after a card's title, 11px in a compact chip. **An icon
with no text beside it is 16px**, `text-body`'s 1em, which is what `IconButton`
sets. There was one icon outside this rule, the speed banner's 19px gauge, and
it follows it now ([D-134](03_decisions.md#d-134)).

**An icon takes its colour from its text** (`currentColor`) and never a colour
of its own; the footer's external-link icon was painted with a border token
until D-134. **A decorative icon is `aria-hidden`**, and an icon that carries
meaning says it in `sr-only` text too.

**No emoji, anywhere** ([D-015](03_decisions.md#d-015)). They render
differently on every platform and read as unpolished.

---

## 12. Usage Rules

1. **Tokens only.** No raw hex, px or rem in a component. If the value you want
   does not exist, add it to this document first. _Checked by `audit:styles`
   and the cleared palette (§2)._
2. **One style per role.** Every piece of text maps to one §5 style; the only
   exception is inline emphasis. _`audit:styles`; `/style`'s own stylesheet
   walk._
3. **Semantic over primitive.** Components name semantic colour tokens, never
   primitives, so a theme is one layer to swap. _`audit:styles`._
4. **Sizes come from the ramp**, through the named styles. _`audit:styles`._
5. **Accent is chrome.** It marks brand, action, selection and focus, and never
   a type or a stat (§3.2).
6. **Never colour alone.** Every meaning carried by colour is also carried by
   text, a number or an icon, and an icon's meaning is in `sr-only` text.
7. **Spacing from the scale, by relationship** (§6). _`audit:styles`._
8. **Shared look lives in one module.** When two components should look alike,
   the class strings go in a shared constants module and each component keeps
   only what genuinely differs: `chipStyles.jsx`, `fieldStyles.jsx`,
   `dexColumns.jsx`, `pageChrome.jsx`, `gameChrome.jsx`. Such a module **must
   be `.jsx`**: Tailwind only scans `.jsx` (§13), and `react-refresh` needs a
   component file to export only components.

   **Go all the way up.** Sharing the _colours_ two components have and leaving
   their _markup_ duplicated is this rule applied halfway, and it is how the
   site's near-copies kept appearing ([D-058](03_decisions.md#d-058),
   [D-135](03_decisions.md#d-135)). Duplication does not just drift, it hides:
   merging the two STAB pills is what put their colour pairing in front of the
   contrast audit, where it failed on 17 of 18 types.

   **But only when they are the same thing.** Two boards that answer
   differently are two boards ([D-105](03_decisions.md#d-105)); what they
   share goes in a constants module, and each lays itself out.

9. **A consistency claim that is not checked is decoration.** Every rule here
   that can be measured, is, and names its check.
10. **One component per job** (§12.2). A second implementation of a job that
    already has a component is a defect, however small the difference. _Guarded
    by `routes.test.jsx`'s "one component per job" suite._
11. **A button only when it does something.** Without a handler, a chip renders
    as a pill and a panel as a `<div>`, never a disabled `<button>`
    ([D-078](03_decisions.md#d-078), [D-111](03_decisions.md#d-111)).

### Enforcement

| Rule                                                                    | Check                                          |
| ----------------------------------------------------------------------- | ---------------------------------------------- |
| Every utility is one this guide allows                                  | `npm run audit:styles`                         |
| No class string sets one property twice                                 | `npm run audit:classes`                        |
| Every text and non-text pairing clears AA                               | `npm run audit:contrast` (12 groups)           |
| No page scrolls sideways or shows its footer on load; every target ≥ 24 | `npm run sweep:widths` (29 routes × 14 widths) |
| One component per job; one list of the 18 types; copy rules             | `npm run test:run`                             |
| Every doc link and anchor resolves                                      | `npm run check:docs`                           |
| `/style` lists every named style                                        | `/style`'s stylesheet walk                     |

`npm run check` runs all of them in CI's order, and CI runs `check` on every
push.

## 12.1 The `/style` playground

`/style` is the executable half of this document. It renders the **real**
tokens and components, never copies, so it cannot drift from the app: swatches
read their values from the live stylesheet, every specimen is a call site of
the real component, and it walks the stylesheet at render to report any named
style it has failed to list ([D-035](03_decisions.md#d-035)). It shows the
palette, the 22 styles, the five radii by role, a surface and an inset, the
text field, every button and icon button, the four chip geometries, the STAB
chip's tiers, the stat bar in each of its uses, and Home's comparison board.

**A specimen is a call site.** The page has been the offender three times by
keeping a hand-made copy of something it was meant to show
([D-048](03_decisions.md#d-048), [D-090](03_decisions.md#d-090),
[D-095](03_decisions.md#d-095)). When this page needs data, it imports it.

## 12.2 The components: one per job

| Job                             | Component / module                 | Fixed                                                                                                                                      | Varies (and only this)                                                     |
| ------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| A button with a label           | `Button`                           | Pill, `text-button`, 1em icons                                                                                                             | `primary` / `secondary` / `ghost`; `md` 44 / `sm` 36; `to` makes it a link |
| A button with only an icon      | `IconButton`                       | 36px pill, 16px icon, a required name                                                                                                      | `ghost` on its own / `outline` in a row of bordered controls               |
| A toggle chip                   | `FilterChip` + `chipStyles`        | Colour pair, pill, 36px                                                                                                                    | `removable` (the ×), `unavailable`, a type colour                          |
| A compact chip (card band)      | `FormChips`, `AbilityChips`        | 21px, colour pair                                                                                                                          | read-only pills without a handler                                          |
| A labelled group of chips       | `ChipGroup`                        | Overline label 8px over the row; chips 6px apart                                                                                           | `hint`, `note`; `fit` (one line, shared width)                             |
| The generation lens             | `GenerationStrip`                  | A fitted `ChipGroup`: one line, chips 36px down to the 24px floor, 4px apart                                                               | which generations are offered                                              |
| A text field                    | `fieldStyles` (`FIELD`)            | 44px, 6px radius, the field edge, the focus ring on its wrapper                                                                            | the search's combobox behaviour                                            |
| A stat bar                      | `StatBar`                          | 8px, pill, scaled to 255, the type's colour                                                                                                | `side`; `track` solid or glass (glass only over art); `animate`            |
| A dex column's header label     | `DexHeadLabel`                     | The sort caret's slot always held; a number column right-aligned with the caret before the label, a text column left-aligned with it after | which column, its sort                                                     |
| A mirrored stat row             | `CmpRow`                           | values `text-stat-sm`, difference `text-diff`, carets                                                                                      | `animate`                                                                  |
| A phone's per-stat card         | `CmpStatCard`                      | An inset; values `text-stat`                                                                                                               | `animate`                                                                  |
| A type badge                    | `TypeBadge`                        | Type fill, near-black label, `text-badge`                                                                                                  | `md` beside a card-scale name / `sm` in a row; `radius` (xs in a grid)     |
| A STAB chip                     | `StabChip`                         | 14% type fill, two border strengths, 6px dot, tier icon                                                                                    | `sm` / `md`                                                                |
| A page's heading block          | `PageHeader`                       | `text-h1` + accent dot, subtitle 4px under, 32px to content                                                                                | `as` (the heading level)                                                   |
| A page's container              | `pageChrome`                       | gutter, measure, top and bottom padding                                                                                                    | tool or content                                                            |
| A tool's controls panel         | `pageChrome` (`PANEL`)             | Surface, 16px in, its blocks 16px apart by the panel's own gap, a divider by `RULE_BELOW` / `RULE_ABOVE`                                   | what the panel holds                                                       |
| A Home preview section          | `FeaturePreview`                   | heading block, preview, CTA 32px under                                                                                                     | the preview                                                                |
| A game's card (index, picker)   | `gameChrome` (`GAME_CARD*`)        | Surface, thumbnail band, 16px body, `text-h4` title + arrow                                                                                | the thumbnail                                                              |
| A round's verdict, and no round | `RoundCard` (`Verdict`, `NoRound`) | Surface, headline 6px over its detail, `Button md` Next                                                                                    | the detail                                                                 |
| A game panel                    | `ContenderPanel`, `MatchupPanel`   | Primary-type tint, label at top, artwork filling, name at the foot                                                                         | density (`lg` / `md` / `sm`)                                               |

**Things that look alike and are deliberately not one component**, each for a
stated reason: the dex's stat cell (a number over a proportional wash, not a
bar, [D-039](03_decisions.md#d-039)); the two game boards
([D-105](03_decisions.md#d-105)); the type picker not collapsing on a phone
where the dex's type filter does ([D-058](03_decisions.md#d-058)).

## 12.3 Patterns

### States

| State           | Treatment                                                                                                                                                                                             |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hover**       | One idiom per family, below.                                                                                                                                                                          |
| **Focus**       | The one ring: 2px `accent`, 2px offset, on everything that takes focus. A text field draws it on its wrapper. `<main>` is a programmatic focus target and draws none.                                 |
| **Selected**    | `accent` fill and `accent-contrast` label, or a type's fill and the near-black label; the border steps aside. Never colour alone: `aria-pressed`, or `sr-only` text on a read-only pill.              |
| **Disabled**    | 40%, no pointer events (a real `disabled` button).                                                                                                                                                    |
| **Unavailable** | 40%, still focusable, `aria-disabled` (the type picker's cap), so a keyboard user is told rather than skipped.                                                                                        |
| **Receded**     | 50%: what you did not pick, once a round resolves.                                                                                                                                                    |
| **Correct**     | `accent`: the ring on the stat game's winner, the border, fill and check on the type game's answer. **The accent ring means "this is the answer" and nothing else** ([D-137](03_decisions.md#d-137)). |

**Hover idioms.**

| Family                    | On hover                                                        |
| ------------------------- | --------------------------------------------------------------- |
| Primary button            | the fill lightens (`accent-hover`)                              |
| Secondary button          | the label and the border brighten                               |
| Ghost button, icon button | the label brightens and an `elevated` fill appears              |
| Chip, answer choice       | **only the label** brightens, so a row of them does not shimmer |
| A card that is a link     | its border brightens, and its arrow                             |
| A table row               | the row takes `surface`                                         |
| A type chart cell         | its row and column light ([D-052](03_decisions.md#d-052))       |
| A link                    | its colour shifts, below                                        |

### Tables and number columns

**A column's header aligns with its content.** Text columns are left-aligned
and numbers right-aligned, and so are their headers, at the same inset as the
cells (8px). A sort caret goes on the header's **inner** side — after a left
label, before a right one — so it never takes the place of the label's edge.
**Every cell in a row centres its content in the same box**, so a row's text
shares one centre line ([D-141](03_decisions.md#d-141)).

**A selection that frames something draws its frame without taking space.** The
type chart's selected column is outlined with inset shadows, not borders: in a
table, a border is layout, and a frame that grows the grid moves every row
when it appears ([D-141](03_decisions.md#d-141)).

### Links

| Kind                          | Look                                                          | Where                         |
| ----------------------------- | ------------------------------------------------------------- | ----------------------------- |
| **Navigation**                | No underline; `secondary` → `primary`, current page `primary` | The header                    |
| **List link**                 | No underline; `tertiary` → `secondary`, 28px tall             | The footer's columns          |
| **Data link**                 | `primary` → `accent`                                          | A Pokémon's name in a dex row |
| **Action link**               | `text-body-sm`, `accent` → `accent-hover`                     | A round's follow-up           |
| **Inline link in a sentence** | Underlined in `border-strong`, offset 2px; colour shifts      | The footer's legal line       |

A link that leaves the site says so in `sr-only` text, "(opens in a new tab)";
in a list it also carries the external icon.

### Empty, blocked and placeholder states

- **Inline empty state** — a slot with nothing in it yet: one sentence,
  `text-body-sm` `tertiary`, centred where the content would be. "Pick two
  Pokémon to compare.", "No Pokémon match these filters."
- **Blocked state** — a page that cannot do its job: a `text-h4` headline, one
  `text-body-sm` `secondary` line 4px under it, and a primary `Button` 24px
  under that (`NoRound`).
- **A value not known yet** — an en dash, `–`, in `tertiary`, in the slot the
  value will take.
- **None, or a tie** — an em dash, `—`: "no alternate forms" in the card's
  band, and a tie in a difference cell (`diff-tie`).

A control that appears with its first use pushes the page around as it lands,
so a reserved slot keeps its space from the start
([D-050](03_decisions.md#d-050), [D-125](03_decisions.md#d-125)).

### A round's cards

**A card sits where you are reading, and covers only what it restates**
([D-101](03_decisions.md#d-101), [D-143](03_decisions.md#d-143)).

- **The question is chrome**: at the top of the board, for the whole round.
- **A verdict is an event**: next to what you just pressed. In the type game
  that is directly above the answers; in the stat game, where the answer is the
  panels themselves, it is the centre.
- **A card may cover only what it says again.** The type game's verdict covers
  the attacking panel because its STAB chip names that type; the stat game's
  covers the question card on a phone because its line says the question.
- **Nothing that appears moves anything** ([D-107](03_decisions.md#d-107)): a
  card is laid over the board, never into its flow, and any room it needs is
  there before you answer.

### Marker dots

**6px (`size-1.5`), round, one size everywhere.** In a type's colour, a dot
names the type beside it (an unselected filter chip, a STAB chip). In `accent`,
a dot says "this option changes the answer" (the generation strip, an ability,
the STAB caption), and says it in `sr-only` text too.

---

## 13. How These Tokens Reach Tailwind

There is **no `tailwind.config.js`**. Tailwind v4 is CSS-first: `src/index.css`
declares the theme tokens inside one `@theme static { … }` block, and Tailwind
generates the matching utilities from each token's namespace.

| Token namespace                | Utilities generated                            | §       |
| ------------------------------ | ---------------------------------------------- | ------- |
| `--color-*`                    | `bg-*`, `text-*`, `border-*`, …                | 2–3     |
| `--text-*`                     | the ramp sizes (used only by the named styles) | 4.3     |
| `--font-*`                     | `font-display`, `font-body`                    | 4.1     |
| `--font-weight-*`              | `font-regular` … `font-bold`                   | 4.2     |
| `--leading-*` / `--tracking-*` | `leading-*` / `tracking-*`                     | 4.4–4.5 |
| `--radius-*`                   | `rounded-*`                                    | 7.1     |
| `--breakpoint-*`               | the `xs:` … `xl:` variants                     | 8       |
| `--ease-*`                     | `ease-*`                                       | 9       |
| `--container-*`                | `max-w-content`                                | 8       |

**Spacing** keeps Tailwind's default base (§6). **Durations, z-index, shadows
and the component tokens** live as plain `:root` custom properties, because
they are consumed as `var(--…)` inline or by named utilities, not as theme
utilities. The **named text styles** and the site's own utilities
(`.bg-flame`, `.drop-shadow-art`, `.shadow-on-art`, `.bg-scrim-art`,
`.flame-inset`, `.focus-ring-within`, the `.animate-*` hooks) are hand-written
in `index.css`'s component and utility layers.

**Detection is off.** `@import "tailwindcss" source(none)` plus two `@source`
globs (`../index.html`, `./**/*.jsx`): automatic detection scanned prose too, so
an ordinary English word that is also a utility name shipped that utility
([D-038](03_decisions.md#d-038)). Comments inside `.jsx` are still scanned and
can still leak a utility; rewording accurate comments to dodge a scanner is the
worse trade.

**`@theme static`, not `@theme`.** Plain `@theme` drops any token no scanned
class references, and the 18 type colours are only ever reached through
`typeColorVar()` at run time, so they vanished ([D-028](03_decisions.md#d-028)).

**Both style audits read the same class strings** through
`scripts/classes.mjs`: every string literal in `src/` with comments blanked
first (they quote utilities in backticks constantly), and any literal written
straight into a `className`, so a typo cannot pass by not being read
([D-134](03_decisions.md#d-134)).

---

## 14. Voice — the words on screen

The site has one voice, and it was consistent before it was written down.
Every user-facing string describes a **mechanism rather than a benefit**:

> "See who's faster, hits harder, and is bulkier." · "The same data, asking you
> the questions." · "Every matchup, including dual types."

Not one claims the site is fast, clean or minimal. The pages demonstrate that;
saying it would be the site arguing with the reader about its own qualities.
There is exactly one joke, **"This page fainted."**, delivered flat and never
explained. That is the calibration point for humour: one, dry, unremarked.

**The rules.**

1. **First person singular.** One person built it; "we" would be a lie.
2. **Prefer a number to an adjective.** "1,259 entries", not "comprehensive":
   this is a stats site, and the numbers are the personality.
3. **Name a real Pokémon** rather than describing a category. Gengar keeping
   Levitate until Gen 7 says more than "handles historical edge cases".
4. **Describe decisions, never virtues.**
5. **Admit the limits.** The most credible line in the README is the one
   conceding that an ability's _effect_ cannot be verified against PokéAPI.
6. **One joke at most, and never explain it.**
7. **Say it once.** No sentence whose only job is to restate the one before it.
8. **Contractions on.** It is a person talking, not a product.
9. **No em dash in a sentence** ([D-138](03_decisions.md#d-138)). A colon, a
   comma or a full stop does the job, and a sentence leaning on em dashes is
   the habit most often read as machine-written. The dash survives only as a
   glyph that stands alone: a tie, an empty slot, a separator between a label
   and its value in a heading, a page title's separator. _Checked by
   `routes.test.jsx` over every JSX text node, the tier sentences and the
   site's description._

**No adjective the site applies to itself.** The hero line was "A simple set of
Pokémon tools." until D-138, the one string on the site that called the site
something; it says what is here now: "Pokémon stats, matchups and games."

### 14.1 The UI voice

Everything above applies to **controls, labels, empty states and section
descriptions**: the strings that sit next to something rather than being the
something. A fragment is fine here; "Pick two Pokémon to compare." is a whole
empty state.

### 14.2 The `/about` voice — a different register, on purpose

§14's rules were derived from UI strings, and applying them to a page whose
content _is_ prose produced a draft that read like release notes. **A solo
project has an opinion, not a position**, and the things the UI voice forbids
are exactly what make writing sound like a person. So on `/about`:

1. **Hedges are wanted, not tolerated.** "I'd say", "I think", "which I'd argue
   still counts".
2. **Sentences may build on each other.** "Say it once" is a UI rule; a story
   is allowed a second sentence that only softens the first.
3. **Conversational openers are fine**, "So", "Of course", "Now", where the UI
   voice would start with the noun.
4. **The loose word beats the precise one.** "Nostalgia trip" over "replay
   project"; "HM mule" over "utility Pokémon".
5. **Commas and full stops**, as everywhere else on the site now (rule 9).
6. **No implementation detail.** If it belongs in the README or the decision
   log, it does not belong here.
7. **Write it in the author's voice by having the author write it.** The page
   ships his own account, edited for grammar and nothing else
   ([D-118b](03_decisions.md#d-118b)).
8. **Earn it with one unfakeable detail.** Beartic being the HM mule does more
   work than any claim about the site's quality.

**Off the table in both registers:** a benefits list, an exclamation mark, the
second-person imperative ("Dive in", "Discover"), and any adjective the site
applies to itself.

**What this rules out**, because these are the failure modes worth naming: the
sentence that congratulates the reader for arriving, the feature-benefit
pairing, and the paragraph that explains how something was built to a reader
who only wanted to know why it exists ([D-118](03_decisions.md#d-118)).
