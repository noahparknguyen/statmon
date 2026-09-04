# Statmon — Style Guide (Step 6)

_The complete, authoritative token reference. Where [04_design](04_design.md) explains the **rationale** (why the palette, why these fonts), this doc is the **exhaustive spec**: every color, every font size, every spacing step — named as a token — so nothing on the site is ever an ad-hoc value. If a value isn't in this document, it doesn't get used._

> **The one rule:** components reference **tokens**, never raw hex/px/rem literals. This is what keeps the whole site uniform. Section 12 lists the guardrails; Section 13 maps everything to the Tailwind theme (next build step).

---

## 1. Token Architecture

Three tiers, following standard design-system practice ([research](02_research.md)):

1. **Primitive tokens** — raw values, the palette of possible choices (e.g. `--color-neutral-900`, `--text-lg`). Never used directly in components.
2. **Semantic tokens** — role-based aliases that point at primitives (e.g. `--color-surface` → `--color-neutral-900`, `--color-primary` → `--color-neutral-50`). **These are what components use.**
3. **Component tokens** — per-component overrides, only when a component needs its own knob (e.g. a hypothetical `--statbar-track` → `--color-elevated`). **None exist yet**; the semantic layer has covered every case so far. Introduced only when a real need appears.

**Naming convention:** `category-property-modifier` — lowercase, hyphenated, no abbreviations beyond the established set (`bg`, `fs`, `fw`, `lh`, `ls`). Examples: `--color-accent-hover`, `--text-2xl`, `--radius-lg`.

**Namespace note.** Tailwind v4 is CSS-first: a token's _prefix decides which utilities it generates_, so the emitted names carry required namespaces — colors are `--color-*` (hence `--color-primary`, not `--text-primary`), font sizes own `--text-*`, weights `--font-weight-*`, line-heights `--leading-*`, tracking `--tracking-*`, breakpoints `--breakpoint-*`. Every name in this document is the **real emitted name** in `src/index.css`. Theming (e.g. future light mode) swaps only the **semantic** layer — primitives and components stay put.

---

## 2. Color — Primitive Palette

**Tailwind's default colour palette is cleared** (`--color-*: initial` at the top
of the `@theme` block), so `bg-red-500`, `bg-neutral-200` and every other stock
colour simply do not exist — an off-palette class is an inert no-op you notice,
rather than a silently-rendered off-brand colour. `transparent` is the one stock
value kept, because `text-transparent` / `border-transparent` are genuinely used.
This is what makes §12 rule 1 enforceable instead of merely aspirational. ([D-033](03_decisions.md#d-033))

**On unused primitives.** A primitive is "the palette of possible choices" (§1),
so an unreferenced one is not drift — it is headroom, and the ramp reads as a
designed system rather than a list of exactly-what-got-used. `--color-neutral-100`,
`--color-neutral-500`, `--color-neutral-800`, `--color-accent-500`,
`--color-accent-600` and `--color-accent-muted` are currently unreferenced and are
kept deliberately. An unused **semantic** token is a different matter — it claims
a role nothing plays — and gets removed.

### Neutrals (dark-first ramp)

| Token                 | Hex       |                   |
| --------------------- | --------- | ----------------- |
| `--color-neutral-950` | `#0B0C0F` | ▉ page background |
| `--color-neutral-900` | `#14161B` | ▉ surfaces        |
| `--color-neutral-850` | `#1C1F27` | ▉ elevated        |
| `--color-neutral-800` | `#23262F` | ▉                 |
| `--color-neutral-700` | `#2A2E37` | ▉ borders         |
| `--color-neutral-600` | `#3A3F4B` | ▉ strong borders  |
| `--color-neutral-500` | `#6B7280` | ▉                 |
| `--color-neutral-400` | `#8A909C` | ▉ tertiary text   |
| `--color-neutral-300` | `#A8AEBA` | ▉ secondary text  |
| `--color-neutral-100` | `#D7DAE0` | ▉                 |
| `--color-neutral-50`  | `#F4F5F7` | ▉ primary text    |

### Accent (Chandelure flame — periwinkle purple → blue)

| Token                     | Hex       |                                    |
| ------------------------- | --------- | ---------------------------------- |
| `--color-accent-300`      | `#B3B8F0` | ▉ lighter / hover                  |
| `--color-accent-400`      | `#9AA0E8` | ▉ **base accent**                  |
| `--color-accent-500`      | `#7E85D8` | ▉ pressed                          |
| `--color-accent-600`      | `#6A70C4` | ▉ deep                             |
| `--color-accent-blue`     | `#A8C3DD` | ▉ flame blue stop                  |
| `--color-accent-core`     | `#7352E6` | ▉ flame gradient start (hero only) |
| `--color-accent-muted`    | `#34355C` | ▉ subtle fills / tags              |
| `--color-accent-contrast` | `#12121C` | ▉ text/icon on a solid accent fill |

Flame gradient (hero only): `linear-gradient(90deg, var(--color-accent-core), var(--color-accent-400), var(--color-accent-blue))`.

### Type colors (18)

The per-type primitives, tuned for the dark background. Full table with badge-text rules and ⚠ contrast-checks lives in [04_design §3](04_design.md); tokens are `--color-type-<name>` (e.g. `--color-type-fire: #FF9741`), consumed through `typeColorVar()` / `typeTextVar()`. The generated `type → { fill, badgeText }` JSON map once planned here was **never built** and is closed as won't-do — the CSS tokens made it a redundant second source of truth ([D-031](03_decisions.md#d-031), [04_design §3](04_design.md)). The canonical list of the 18 type slugs is `TYPES` in `src/lib/types.js` ([D-038](03_decisions.md#d-038)).

---

## 3. Color — Semantic Tokens

**These are the only color tokens components should reference.**

> `--color-diff-favor` (the flat white winning-value colour) was **removed** in
> [D-033](03_decisions.md#d-033): [D-023](03_decisions.md#d-023) replaced it with the winner's own type colour, leaving it
> referenced by nothing. Unused semantic tokens are deleted, not kept on spec.

| Semantic token            | → Primitive                | Use                                                                                   |
| ------------------------- | -------------------------- | ------------------------------------------------------------------------------------- |
| `--color-base`            | `--color-neutral-950`      | Page background                                                                       |
| `--color-surface`         | `--color-neutral-900`      | Cards, panels, the comparison board                                                   |
| `--color-elevated`        | `--color-neutral-850`      | Inputs, raised elements, stat-bar tracks                                              |
| `--color-border-subtle`   | `--color-neutral-700`      | Hairlines, dividers                                                                   |
| `--color-border-strong`   | `--color-neutral-600`      | Hover/focus borders                                                                   |
| `--color-primary`         | `--color-neutral-50`       | Headings, stat values, primary text                                                   |
| `--color-secondary`       | `--color-neutral-300`      | Labels, secondary text                                                                |
| `--color-tertiary`        | `--color-neutral-400`      | Hints, captions, overlines (AA — D-027)                                               |
| `--color-accent`          | `--color-accent-400`       | Actions, links, brand, and the 2px `:focus-visible` outline (no separate focus token) |
| `--color-accent-hover`    | `--color-accent-300`       | Hover/active                                                                          |
| `--color-accent-contrast` | _(primitive; no alias)_    | Text/icon on a solid accent fill                                                      |
| `--color-diff-tie`        | `--color-neutral-400`      | Zero-difference state                                                                 |
| `--color-track-glass`     | `--color-neutral-50` @ 16% | Translucent stat-bar track over artwork                                               |

---

## 4. Typography — Foundations

### 4.1 Families

| Token            | Stack                            | Role                         |
| ---------------- | -------------------------------- | ---------------------------- |
| `--font-display` | `'Space Grotesk', sans-serif`    | Logo, headings, titles, hero |
| `--font-body`    | `'Inter', system-ui, sans-serif` | Body, UI, **stat numbers**   |

Stat numbers always add tabular figures: `font-feature-settings: "tnum" 1;`.

### 4.2 Weight tokens

| Token                    | Value | Family availability   |
| ------------------------ | ----- | --------------------- |
| `--font-weight-regular`  | 400   | Inter                 |
| `--font-weight-medium`   | 500   | Inter · Space Grotesk |
| `--font-weight-semibold` | 600   | Inter                 |
| `--font-weight-bold`     | 700   | Space Grotesk         |

### 4.3 Font-size ramp (primitive)

Anchored at `--text-base: 1rem` (16px, the accessibility floor), stepping at ≈1.2 (compact enough for a data UI, with room for a dramatic hero). **All sizes in `rem`** so they honor user zoom. This is the complete set — no size exists outside this ramp.

| Token         | rem       | px  | Step role                      |
| ------------- | --------- | --- | ------------------------------ |
| `--text-2xs`  | 0.6875rem | 11  | micro / overline               |
| `--text-xs`   | 0.75rem   | 12  | caption / badge                |
| `--text-sm`   | 0.875rem  | 14  | small UI / labels              |
| `--text-base` | 1rem      | 16  | body (base)                    |
| `--text-md`   | 1.125rem  | 18  | large body / stat value        |
| `--text-lg`   | 1.25rem   | 20  | h3 / card title                |
| `--text-xl`   | 1.5rem    | 24  | h2                             |
| `--text-2xl`  | 1.875rem  | 30  | h1                             |
| `--text-3xl`  | 2.25rem   | 36  | display                        |
| `--text-4xl`  | 3rem      | 48  | hero display                   |
| `--text-5xl`  | 3.75rem   | 60  | home marketing hero (optional) |

### 4.4 Line-height tokens

| Token               | Value | Use                                           |
| ------------------- | ----- | --------------------------------------------- |
| `--leading-tight`   | 1.1   | Display / hero                                |
| `--leading-snug`    | 1.2   | Headings                                      |
| `--leading-base`    | 1.5   | Body                                          |
| `--leading-relaxed` | 1.6   | Long-form paragraphs                          |
| `--leading-none`    | 1     | Single-line UI (buttons, badges, stat digits) |

### 4.5 Letter-spacing tokens

| Token                | Value   | Use                                   |
| -------------------- | ------- | ------------------------------------- |
| `--tracking-tighter` | -0.02em | Display / hero                        |
| `--tracking-tight`   | -0.01em | H1 / H2                               |
| `--tracking-normal`  | 0       | Body, most UI                         |
| `--tracking-wide`    | 0.02em  | Stat digits, badges                   |
| `--tracking-wider`   | 0.14em  | Uppercase overlines / stat-row labels |

---

## 5. Typography — Semantic Text Styles (the exhaustive scale)

**Every text style used anywhere on the site.** Each is a named style bundling family + size + weight + line-height + letter-spacing. Use these by name — do not hand-assemble type. If a design needs a style not listed here, the style gets **added to this table**, not improvised.

| Style token         | Family      | Size               | Weight | Line-height | Tracking          | Used for                                     |
| ------------------- | ----------- | ------------------ | ------ | ----------- | ----------------- | -------------------------------------------- |
| `text-display-hero` | display     | `--text-4xl` (48)  | 700    | tight       | tighter           | Home hero headline / wordmark                |
| `text-display`      | display     | `--text-3xl` (36)  | 700    | tight       | tighter           | Big page display titles                      |
| `text-h1`           | display     | `--text-2xl` (30)  | 700    | snug        | tight             | Primary page heading (one per page)          |
| `text-h2`           | display     | `--text-xl` (24)   | 500    | snug        | tight             | Section headings                             |
| `text-h3`           | display     | `--text-lg` (20)   | 500    | snug        | normal            | Subsections · card titles · **Pokémon name** |
| `text-h4`           | display     | `--text-md` (18)   | 500    | snug        | normal            | Minor headings                               |
| `text-body-lg`      | body        | `--text-md` (18)   | 400    | relaxed     | normal            | Lead paragraphs                              |
| `text-body`         | body        | `--text-base` (16) | 400    | base        | normal            | Default body text                            |
| `text-body-sm`      | body        | `--text-sm` (14)   | 400    | base        | normal            | Secondary / helper text                      |
| `text-label`        | body        | `--text-sm` (14)   | 500    | none        | normal            | Form + UI labels                             |
| `text-caption`      | body        | `--text-xs` (12)   | 500    | snug        | normal            | Captions, hints, footnotes                   |
| `text-overline`     | display     | `--text-2xs` (11)  | 500    | none        | wider · UPPERCASE | Eyebrows · **stat-row labels** (HP, Atk…)    |
| `text-stat`         | body (tnum) | `--text-md` (18)   | 600    | none        | wide              | Stat values in the comparison                |
| `text-stat-sm`      | body (tnum) | `--text-sm` (14)   | 600    | none        | wide              | Stat values in a dense row (the dex table)   |
| `text-stat-lg`      | body (tnum) | `--text-lg` (20)   | 600    | none        | wide              | BST · emphasized stat                        |
| `text-diff`         | body (tnum) | `--text-sm` (14)   | 600    | none        | wide              | Difference value + caret                     |
| `text-badge`        | display     | `--text-2xs` (11)  | 600    | none        | wide              | Type badges                                  |
| `text-button`       | body        | `--text-sm` (14)   | 600    | none        | normal            | Button labels                                |
| `text-numeral-xl`   | display     | `--text-4xl` (48)  | 700    | none        | normal            | BST delta on the comparison card             |
| `text-numeral-lg`   | display     | `--text-3xl` (36)  | 700    | none        | normal            | BST delta on Home · "Tied" on the card       |
| `text-numeral-md`   | display     | `--text-2xl` (30)  | 700    | none        | normal            | "Tied" on Home                               |
| `text-meta`         | display     | `--text-xs` (12)   | 600    | snug        | normal            | Small display label in a chip/pill           |

That's **22 styles across 11 sizes** — the entire typographic surface of the site. Anything you're tempted to size by hand already has a home here.

**Why the numerals need their own styles.** `text-numeral-*` differ from
`text-display*` in exactly one property — `leading-none` instead of
`leading-tight` — and that is the whole point. The big BST figures are optically
centred inside **fixed-height bands** (the comparison card's `h-68` top zone,
the featured board's BST row); `leading-tight`'s half-leading would push them off
centre. They were hand-assembled for years because the scale had no style for
"display numeral in a band". Adding one is the fix §5 prescribes — the design was
right, the table was incomplete. ([D-035](03_decisions.md#d-035))

**On `text-stat-sm` sharing `text-diff`'s values.** They are identical today and
are still two styles, because §12 rule 2 is one style per **role**: a dex-table
cell and a comparison delta are different roles and are free to diverge. Naming
the role is the point — reusing `text-diff` in a table would make the next reader
think the number is a difference. ([D-039](03_decisions.md#d-039))

**The one permitted exception: inline emphasis.** Overriding **family and weight
only** — inheriting size and line-height from the surrounding named style — is
allowed for emphasis inside a run of text, the way `<strong>` works. The leader's
name in the comparison card's BST line (`font-display font-semibold` inside a
`text-body-sm` parent) is the single instance. Anything that also sets a **size**
is not inline emphasis and needs a named style.

---

## 6. Spacing Scale

4px base unit; use the scale for all margin, padding, and gap. No arbitrary spacing.

**No `--space-*` tokens are emitted, by design.** Tailwind v4's default spacing base (`--spacing: 0.25rem`) already produces this exact scale, so `src/index.css` keeps the default rather than redefining it — the utility _is_ the token. Write `p-6`, not `p-[var(--space-6)]`.

| Utility | rem     | px  |
| ------- | ------- | --- |
| `*-0`   | 0       | 0   |
| `*-1`   | 0.25rem | 4   |
| `*-2`   | 0.5rem  | 8   |
| `*-3`   | 0.75rem | 12  |
| `*-4`   | 1rem    | 16  |
| `*-5`   | 1.25rem | 20  |
| `*-6`   | 1.5rem  | 24  |
| `*-8`   | 2rem    | 32  |
| `*-10`  | 2.5rem  | 40  |
| `*-12`  | 3rem    | 48  |
| `*-16`  | 4rem    | 64  |
| `*-20`  | 5rem    | 80  |

**Applying spacing — the proximity rule (`internal ≤ external`).** Spacing communicates grouping, so it must be _relative_, never uniform. Inside a group (a label and its value, an eyebrow and its content) use a **tight** gap (`gap-1`/`gap-2`). Between groups (one section and the next, the stats and the footer) use a **generous** gap (`gap-4`+). Uniform gaps make everything read as one undifferentiated block ("claustrophobic"); the contrast between tight and loose is what creates hierarchy and breathing room. ([D-019](03_decisions.md#d-019))

**Never touch a divider or edge.** Any content adjacent to a border/divider or the card edge gets padding on both sides (≥ `p-3`), so nothing looks cramped against a line.

**Vertical rhythm.** Component band and row heights follow the 8px rhythm (e.g. stat rows 36, footer 56, card 568). Keeping heights on multiples of 4/8 keeps rows aligned across components.

---

## 7. Radii, Borders & Elevation

**Radii**

| Token          | Value  | Use                                                                    |
| -------------- | ------ | ---------------------------------------------------------------------- |
| `--radius-xs`  | 4px    | tags, small chips                                                      |
| `--radius-sm`  | 6px    | inputs, buttons                                                        |
| `--radius-md`  | 10px   | cards inner, callouts                                                  |
| `--radius-lg`  | 16px   | panels, the comparison board                                           |
| `--radius-xl`  | 24px   | large hero cards                                                       |
| `rounded-full` | 9999px | stat bars, badges, pills, toggles — Tailwind built-in, no token needed |

**Borders** — `border` (1px) is the default width, `border-2` where a heavier rule is wanted; `:focus-visible` draws a 2px outline. No width tokens are emitted — Tailwind's defaults cover it. Color comes from `--color-border-subtle` / `--color-border-strong`; `index.css` sets `--color-border-subtle` as the global default border color so a bare `border` is already on-brand.

**Elevation** — dark UI favors borders over shadows. One shadow token, reserved for floating layers (dropdowns, menus):

| Token              | Value                        |
| ------------------ | ---------------------------- |
| `--shadow-overlay` | `0 8px 24px rgba(0,0,0,0.5)` |
| `--shadow-art`     | `0 8px 22px rgba(0,0,0,0.5)` |

`--shadow-overlay` is for floating layers (the search dropdown). `--shadow-art` is the lift under official artwork, applied via the `.drop-shadow-art` utility — it is a `filter: drop-shadow()`, not a `box-shadow`, so it follows the artwork's transparent silhouette rather than its bounding box. (No `--shadow-none` token — omit the shadow instead.)

---

## 8. Breakpoints & Layout

| Token             | Min-width | Note                                                                                      |
| ----------------- | --------- | ----------------------------------------------------------------------------------------- |
| `--breakpoint-xs` | 360px     | **the wordmark drops to the bare flame mark below this** ([D-054](03_decisions.md#d-054)) |
| `--breakpoint-sm` | 480px     | large phone                                                                               |
| `--breakpoint-md` | 768px     | **comparison collapses to per-stat cards below this** ([D-010](03_decisions.md#d-010))    |
| `--breakpoint-lg` | 1024px    | tablet / small laptop                                                                     |
| `--breakpoint-xl` | 1280px    | desktop                                                                                   |

Content max-width `--container-content: 1120px` (utility: `max-w-content`), centered. **Gutters are a uniform `px-4` (16px) at every width as built** — the responsive 24px desktop gutter originally specified here was never implemented; see [04_design §5](04_design.md).

---

## 9. Motion

| Token             | Value                        | Intended use          | Status                        |
| ----------------- | ---------------------------- | --------------------- | ----------------------------- |
| `--dur-fast`      | 120ms                        | hover, focus          | ✅ **the transition default** |
| `--dur-base`      | 180ms                        | most transitions      | scale rung, unconsumed        |
| `--dur-slow`      | 300ms                        | selection cross-fades | scale rung, unconsumed        |
| `--dur-bar`       | 450ms                        | stat-bar fill         | ✅ `.animate-grow-w`          |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | default               | ✅ `.animate-grow-w`          |

`--dur-fast` is wired as `--default-transition-duration`, so **every** `transition-*` utility picks it up with no per-component opt-in — write `transition-colors` and you get the documented 120ms. Override per element with `duration-*` when a specific motion needs it. ([D-033](03_decisions.md#d-033))

A second easing (`--ease-out-soft`) was specified here and referenced by nothing; it has been removed. The bar fill uses `--ease-standard`. Add an easing when a component actually needs one.

**Reduced motion is mandatory:** under `prefers-reduced-motion: reduce`, disable bar fills/staggers and render final state instantly; keep only opacity fades. ([04_design §7](04_design.md))

---

## 10. Z-Index Scale

| Token          | Value | Layer                                          |
| -------------- | ----- | ---------------------------------------------- |
| `--z-base`     | 0     | normal flow                                    |
| `--z-raised`   | 1     | lifted above sibling content, below all chrome |
| `--z-dropdown` | 1000  | search results, menus                          |
| `--z-sticky`   | 1100  | sticky header                                  |
| `--z-overlay`  | 1200  | modals / dialogs                               |
| `--z-toast`    | 1300  | toasts / copied-link confirmation              |

`--z-dropdown` (search results), `--z-sticky` (site header) and `--z-raised`
(the dex table's sticky column headers) are consumed. The unused rungs stay: a
z-index scale's whole value is being a **complete ladder** — an incomplete one
is what makes someone reach for `z-9999`. This is the opposite call from unused
semantic colour tokens, and deliberately so.

**`--z-raised` is that argument proving itself.** The ladder had no rung between
"normal flow" and "floating chrome", so a sticky table header that only needed
to out-paint its own rows had nowhere on the scale to sit — and shipped at
`z-index: auto`, where the rows' positioned cells painted over it. The rung was
added rather than reaching for a bare `z-10`. ([D-041](03_decisions.md#d-041))

---

## 11. Iconography

Vector icons via **`react-icons`** — primarily the Lucide set (`react-icons/lu`), with other sets used sparingly when a specific glyph is needed (e.g. `react-icons/fa6` carets for the diff indicator). Icons default to `1em` and inherit the surrounding text size; where a specific size is needed it is passed inline (`<LuGauge size={19} />`). No `--icon-*` tokens are emitted. Icons inherit `currentColor`; never introduce off-token colors.

**No emoji in the UI.** Emoji render inconsistently across platforms and read as unpolished ("vibe-coded"). Always use a vector icon instead. ([D-015](03_decisions.md#d-015))

---

## 12. Usage Rules (consistency guardrails)

1. **Tokens only.** No raw hex, px, or rem literals in components — reference a token. If the value you want doesn't exist, add it to this doc first. **This is enforced:** Tailwind's stock palette is cleared, so an off-palette colour class produces no CSS at all (§2).
2. **One style per role.** Every piece of text maps to exactly one Section 5 style. No hand-tuned sizes, weights, or spacing. The sole exception is **inline emphasis** (family/weight override inheriting size and leading) — see §5.
3. **Semantic over primitive.** Components use semantic tokens (`--color-primary`), not primitives (`--color-neutral-50`), so theming stays a one-layer swap.
4. **Sizes come from the ramp.** The only font sizes that exist are §4.3's eleven steps. This is the rule that fixes the "too many inconsistent sizes" habit.
5. **Accent is chrome-only.** The purple accent is for brand/actions/focus — never a stat/type color (§2, [04_design §2](04_design.md)).
6. **Never color alone.** Meaning always pairs color with text/number/icon (accessibility).
7. **Spacing from the scale.** All spacing uses §6 tokens; no arbitrary margins.
8. **Shared look lives in one module.** When two components should look alike, the class strings go in a shared constants module and the components add only what genuinely differs. `Button` is the component form of this; `components/chipStyles.jsx` is the constants form — one colour pair behind the three chip geometries ([04_design §6](04_design.md)), after the same four strings had been hand-copied into a third component. Note the constraint: such a module **must be `.jsx`** — Tailwind only scans `.jsx` (§13), so class strings in `lib/` are invisible to it, and `react-refresh` requires a component file to export only components. `components/dexColumns.jsx` is the other one.

---

## 12.1 The `/style` playground

The route at `/style` is the executable half of this document: it renders the
**real** tokens and components, never copies, so it cannot drift from the app.
Swatches read their values out of the live stylesheet, badges are `TypeBadge`,
the sample board is the actual `FeaturedComparison`, and all three chip
geometries sit side by side so a divergence is visible rather than theoretical.

It also **checks itself**. `readMissingTextStyles` walks the stylesheet for every
`.text-*` rule that bundles a font-family — i.e. a §5 named style rather than a
colour utility — and reports any the page has failed to list. That is what
caught `text-stat-sm` the moment it was added ([D-035](03_decisions.md#d-035)).

**One limit, learned the hard way.** "Renders the real thing" is a claim, not a
guarantee: the page shipped its own hand-written copy of the 18 type slugs for
months — a fourth copy, in the one file whose stated job is not to have one —
because [D-038](03_decisions.md#d-038) consolidated the copies it knew about and
missed this one. It now imports `TYPES`, and a test asserts no second list of
the 18 exists anywhere in `src/`. When this page needs data, it imports it.

---

## 13. How These Tokens Reach Tailwind (as built)

There is **no `tailwind.config.js`**. Tailwind v4 is CSS-first: `src/index.css` declares every token inside a single `@theme static { … }` block, and Tailwind generates the matching utilities from the token's namespace. That is the whole configuration.

| Token namespace                | Utilities generated                         | §       |
| ------------------------------ | ------------------------------------------- | ------- |
| `--color-*`                    | `bg-*`, `text-*`, `border-*`, `fill-*`      | 2–3     |
| `--text-*`                     | font-size utilities `text-2xs` … `text-5xl` | 4.3     |
| `--font-*`                     | `font-display`, `font-body`                 | 4.1     |
| `--font-weight-*`              | `font-regular` … `font-bold`                | 4.2     |
| `--leading-*` / `--tracking-*` | `leading-*` / `tracking-*`                  | 4.4–4.5 |
| `--radius-*`                   | `rounded-*`                                 | 7       |
| `--breakpoint-*`               | the `sm:` `md:` `lg:` `xl:` variants        | 8       |
| `--ease-*`                     | `ease-*`                                    | 9       |
| `--container-*`                | `max-w-content`                             | 8       |

**Spacing** is the deliberate exception: Tailwind's default `--spacing: 0.25rem` already yields our 4px scale, so it is left alone (§6). **Durations** and **z-index** live as plain `:root` custom properties rather than theme tokens, because they're consumed as `var(--z-sticky)` in inline styles, not as utilities.

### What Tailwind scans — why detection is off

`src/index.css` opens with **`@import "tailwindcss" source(none)`** plus two
explicit `@source` globs (`../index.html` and `./**/*.jsx`), rather than letting
Tailwind detect content automatically.

Automatic detection scans every non-gitignored file for class-name candidates,
**prose included** — so an ordinary English word that happens to be a utility
name silently ships that utility. Writing "a visible ring" in a source comment
emitted `.visible`, `.ring` and the whole ring/shadow `@property` block: 1.7 kB
of dead CSS from one sentence. Writing "filter" emitted `.filter`. Excluding
`docs/` (the previous fix) only ever addressed one directory.

Class names exist in exactly two places — `index.html` and the `.jsx`
components — so those are declared and nothing else is scanned. Narrowing a scan
can drop a real class, which is the [D-028](03_decisions.md#d-028) failure in
reverse, so the change was verified by diffing the emitted selector list before
and after: two selectors disappeared, both junk, none added.
**Limit:** comments inside `.jsx` files are still scanned and can still leak
(`.table`, `.fixed`, `.static` currently do). ([D-038](03_decisions.md#d-038))

### `@theme static` — why not plain `@theme`

Plain `@theme` **tree-shakes** any token Tailwind doesn't see referenced by a scanned class name. Statmon reads many tokens — above all the 18 `--color-type-*` — only through inline `var(--color-…)` built in JavaScript (`typeColorVar`), which the scanner cannot see. Under plain `@theme` those variables were dropped and **type colors vanished app-wide**. `static` forces every token to emit regardless of class usage; the cost is a slightly larger `:root`, which is negligible. ([D-028](03_decisions.md#d-028))

### The named text styles

The §5 styles are hand-written utility classes in an `@layer components` block in `src/index.css` — each bundles family + size + weight + line-height + tracking. A component writes `className="text-stat"` and never re-specifies any of it. That is the payoff: uniform, and hard to drift.

**Status:** every call site now uses a named style; `/style` walks the stylesheet
at render and warns if one is missing from its own list, which is what caught
`text-stat-sm` the moment it was added. The BST numerals and chip labels that used to hand-assemble type were resolved by _adding_ the four styles they needed (`text-numeral-*`, `text-meta`) rather than bending the design to fit the table ([D-035](03_decisions.md#d-035)). The single remaining family/weight override is the documented inline-emphasis case in §5.
