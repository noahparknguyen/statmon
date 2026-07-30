# Statmon — Style Guide (Step 6)

_The complete, authoritative token reference. Where [04_design](04_design.md) explains the **rationale** (why the palette, why these fonts), this doc is the **exhaustive spec**: every color, every font size, every spacing step — named as a token — so nothing on the site is ever an ad-hoc value. If a value isn't in this document, it doesn't get used._

> **The one rule:** components reference **tokens**, never raw hex/px/rem literals. This is what keeps the whole site uniform. Section 12 lists the guardrails; Section 13 maps everything to the Tailwind theme (next build step).

---

## 1. Token Architecture

Three tiers, following standard design-system practice ([research](02_research.md)):

1. **Primitive tokens** — raw values, the palette of possible choices (e.g. `--neutral-900`, `--fs-lg`). Never used directly in components.
2. **Semantic tokens** — role-based aliases that point at primitives (e.g. `--bg-surface` → `--neutral-900`, `--text-primary` → `--neutral-50`). **These are what components use.**
3. **Component tokens** — per-component overrides, only when a component needs its own knob (e.g. `--statbar-track` → `--bg-elevated`). Introduced as needed.

**Naming convention:** `category-property-modifier` — lowercase, hyphenated, no abbreviations beyond the established set (`bg`, `fs`, `fw`, `lh`, `ls`). Examples: `--color-accent-hover`, `--fs-2xl`, `--space-6`. Theming (e.g. future light mode) swaps only the **semantic** layer — primitives and components stay put.

---

## 2. Color — Primitive Palette

### Neutrals (dark-first ramp)

| Token           | Hex       |                   |
| --------------- | --------- | ----------------- |
| `--neutral-950` | `#0B0C0F` | ▉ page background |
| `--neutral-900` | `#14161B` | ▉ surfaces        |
| `--neutral-850` | `#1C1F27` | ▉ elevated        |
| `--neutral-800` | `#23262F` | ▉                 |
| `--neutral-700` | `#2A2E37` | ▉ borders         |
| `--neutral-600` | `#3A3F4B` | ▉ strong borders  |
| `--neutral-500` | `#6B7280` | ▉                 |
| `--neutral-400` | `#8A909C` | ▉ tertiary text   |
| `--neutral-300` | `#A8AEBA` | ▉ secondary text  |
| `--neutral-100` | `#D7DAE0` | ▉                 |
| `--neutral-50`  | `#F4F5F7` | ▉ primary text    |

### Accent (Chandelure flame — periwinkle purple → blue)

| Token               | Hex       |                                    |
| ------------------- | --------- | ---------------------------------- |
| `--accent-300`      | `#B3B8F0` | ▉ lighter / hover                  |
| `--accent-400`      | `#9AA0E8` | ▉ **base accent**                  |
| `--accent-500`      | `#7E85D8` | ▉ pressed                          |
| `--accent-600`      | `#6A70C4` | ▉ deep                             |
| `--accent-blue`     | `#A8C3DD` | ▉ flame blue stop                  |
| `--accent-core`     | `#7352E6` | ▉ flame gradient start (hero only) |
| `--accent-muted`    | `#34355C` | ▉ subtle fills / tags              |
| `--accent-contrast` | `#12121C` | ▉ text/icon on a solid accent fill |

Flame gradient (hero only): `linear-gradient(90deg, var(--accent-core), var(--accent-400), var(--accent-blue))`.

### Type colors (18)

The per-type primitives, tuned for the dark background. Full table with badge-text rules and ⚠ contrast-checks lives in [04_design §3](04_design.md); tokens are `--type-<name>` (e.g. `--type-fire: #FF9741`). Shipped as a generated `type → { fill, badgeText }` map ([01_spec §4](01_spec.md)).

---

## 3. Color — Semantic Tokens

**These are the only color tokens components should reference.**

| Semantic token      | → Primitive         | Use                                      |
| ------------------- | ------------------- | ---------------------------------------- |
| `--bg-base`         | `--neutral-950`     | Page background                          |
| `--bg-surface`      | `--neutral-900`     | Cards, panels, the comparison board      |
| `--bg-elevated`     | `--neutral-850`     | Inputs, raised elements, stat-bar tracks |
| `--border`          | `--neutral-700`     | Hairlines, dividers                      |
| `--border-strong`   | `--neutral-600`     | Hover/focus borders                      |
| `--text-primary`    | `--neutral-50`      | Headings, stat values, primary text      |
| `--text-secondary`  | `--neutral-300`     | Labels, secondary text                   |
| `--text-tertiary`   | `--neutral-400`     | Hints, captions, overlines (AA — D-027)  |
| `--accent`          | `--accent-400`      | Actions, links, brand, focus             |
| `--accent-hover`    | `--accent-300`      | Hover/active                             |
| `--accent-contrast` | `--accent-contrast` | Text/icon on accent fills                |
| `--focus-ring`      | `--accent-400`      | 2px focus outline                        |
| `--diff-favor`      | `--neutral-50`      | Winning stat value (bold + caret)        |
| `--diff-tie`        | `--neutral-400`     | Zero-difference state                    |
| `--track-glass`     | `neutral-50 @ 16%`  | Translucent stat-bar track over artwork  |

---

## 4. Typography — Foundations

### 4.1 Families

| Token            | Stack                            | Role                         |
| ---------------- | -------------------------------- | ---------------------------- |
| `--font-display` | `'Space Grotesk', sans-serif`    | Logo, headings, titles, hero |
| `--font-body`    | `'Inter', system-ui, sans-serif` | Body, UI, **stat numbers**   |

Stat numbers always add tabular figures: `font-feature-settings: "tnum" 1;`.

### 4.2 Weight tokens

| Token           | Value | Family availability   |
| --------------- | ----- | --------------------- |
| `--fw-regular`  | 400   | Inter                 |
| `--fw-medium`   | 500   | Inter · Space Grotesk |
| `--fw-semibold` | 600   | Inter                 |
| `--fw-bold`     | 700   | Space Grotesk         |

### 4.3 Font-size ramp (primitive)

Anchored at `--fs-base: 1rem` (16px, the accessibility floor), stepping at ≈1.2 (compact enough for a data UI, with room for a dramatic hero). **All sizes in `rem`** so they honor user zoom. This is the complete set — no size exists outside this ramp.

| Token       | rem       | px  | Step role                      |
| ----------- | --------- | --- | ------------------------------ |
| `--fs-2xs`  | 0.6875rem | 11  | micro / overline               |
| `--fs-xs`   | 0.75rem   | 12  | caption / badge                |
| `--fs-sm`   | 0.875rem  | 14  | small UI / labels              |
| `--fs-base` | 1rem      | 16  | body (base)                    |
| `--fs-md`   | 1.125rem  | 18  | large body / stat value        |
| `--fs-lg`   | 1.25rem   | 20  | h3 / card title                |
| `--fs-xl`   | 1.5rem    | 24  | h2                             |
| `--fs-2xl`  | 1.875rem  | 30  | h1                             |
| `--fs-3xl`  | 2.25rem   | 36  | display                        |
| `--fs-4xl`  | 3rem      | 48  | hero display                   |
| `--fs-5xl`  | 3.75rem   | 60  | home marketing hero (optional) |

### 4.4 Line-height tokens

| Token          | Value | Use                                           |
| -------------- | ----- | --------------------------------------------- |
| `--lh-tight`   | 1.1   | Display / hero                                |
| `--lh-snug`    | 1.2   | Headings                                      |
| `--lh-base`    | 1.5   | Body                                          |
| `--lh-relaxed` | 1.6   | Long-form paragraphs                          |
| `--lh-none`    | 1     | Single-line UI (buttons, badges, stat digits) |

### 4.5 Letter-spacing tokens

| Token          | Value   | Use                                   |
| -------------- | ------- | ------------------------------------- |
| `--ls-tighter` | -0.02em | Display / hero                        |
| `--ls-tight`   | -0.01em | H1 / H2                               |
| `--ls-normal`  | 0       | Body, most UI                         |
| `--ls-wide`    | 0.02em  | Stat digits, badges                   |
| `--ls-wider`   | 0.14em  | Uppercase overlines / stat-row labels |

---

## 5. Typography — Semantic Text Styles (the exhaustive scale)

**Every text style used anywhere on the site.** Each is a named style bundling family + size + weight + line-height + letter-spacing. Use these by name — do not hand-assemble type. If a design needs a style not listed here, the style gets **added to this table**, not improvised.

| Style token         | Family      | Size             | Weight | Line-height | Tracking          | Used for                                     |
| ------------------- | ----------- | ---------------- | ------ | ----------- | ----------------- | -------------------------------------------- |
| `text-display-hero` | display     | `--fs-4xl` (48)  | 700    | tight       | tighter           | Home hero headline / wordmark                |
| `text-display`      | display     | `--fs-3xl` (36)  | 700    | tight       | tighter           | Big page display titles                      |
| `text-h1`           | display     | `--fs-2xl` (30)  | 700    | snug        | tight             | Primary page heading (one per page)          |
| `text-h2`           | display     | `--fs-xl` (24)   | 500    | snug        | tight             | Section headings                             |
| `text-h3`           | display     | `--fs-lg` (20)   | 500    | snug        | normal            | Subsections · card titles · **Pokémon name** |
| `text-h4`           | display     | `--fs-md` (18)   | 500    | snug        | normal            | Minor headings                               |
| `text-body-lg`      | body        | `--fs-md` (18)   | 400    | relaxed     | normal            | Lead paragraphs                              |
| `text-body`         | body        | `--fs-base` (16) | 400    | base        | normal            | Default body text                            |
| `text-body-sm`      | body        | `--fs-sm` (14)   | 400    | base        | normal            | Secondary / helper text                      |
| `text-label`        | body        | `--fs-sm` (14)   | 500    | none        | normal            | Form + UI labels                             |
| `text-caption`      | body        | `--fs-xs` (12)   | 500    | snug        | normal            | Captions, hints, footnotes                   |
| `text-overline`     | display     | `--fs-2xs` (11)  | 500    | none        | wider · UPPERCASE | Eyebrows · **stat-row labels** (HP, Atk…)    |
| `text-stat`         | body (tnum) | `--fs-md` (18)   | 600    | none        | wide              | Stat values in the comparison                |
| `text-stat-lg`      | body (tnum) | `--fs-lg` (20)   | 600    | none        | wide              | BST · emphasized stat                        |
| `text-diff`         | body (tnum) | `--fs-sm` (14)   | 600    | none        | wide              | Difference value + caret                     |
| `text-badge`        | display     | `--fs-2xs` (11)  | 600    | none        | wide              | Type badges                                  |
| `text-button`       | body        | `--fs-sm` (14)   | 600    | none        | normal            | Button labels                                |

That's **17 styles across 11 sizes** — the entire typographic surface of the site. Anything you're tempted to size by hand already has a home here.

---

## 6. Spacing Scale

4px base unit; use tokens for all margin, padding, and gap. No arbitrary spacing.

| Token        | rem     | px  |
| ------------ | ------- | --- |
| `--space-0`  | 0       | 0   |
| `--space-1`  | 0.25rem | 4   |
| `--space-2`  | 0.5rem  | 8   |
| `--space-3`  | 0.75rem | 12  |
| `--space-4`  | 1rem    | 16  |
| `--space-5`  | 1.25rem | 20  |
| `--space-6`  | 1.5rem  | 24  |
| `--space-8`  | 2rem    | 32  |
| `--space-10` | 2.5rem  | 40  |
| `--space-12` | 3rem    | 48  |
| `--space-16` | 4rem    | 64  |
| `--space-20` | 5rem    | 80  |

**Applying spacing — the proximity rule (`internal ≤ external`).** Spacing communicates grouping, so it must be _relative_, never uniform. Inside a group (a label and its value, an eyebrow and its content) use a **tight** gap (`--space-1`/`--space-2`). Between groups (one section and the next, the stats and the footer) use a **generous** gap (`--space-4`+). Uniform gaps make everything read as one undifferentiated block ("claustrophobic"); the contrast between tight and loose is what creates hierarchy and breathing room. ([D-019](03_decisions.md))

**Never touch a divider or edge.** Any content adjacent to a border/divider or the card edge gets padding on both sides (≥ `--space-3`), so nothing looks cramped against a line.

**Vertical rhythm.** Component band and row heights follow the 8px rhythm (e.g. stat rows 36, footer 56, card 568). Keeping heights on multiples of 4/8 keeps rows aligned across components.

---

## 7. Radii, Borders & Elevation

**Radii**

| Token           | Value | Use                          |
| --------------- | ----- | ---------------------------- |
| `--radius-xs`   | 4px   | tags, small chips            |
| `--radius-sm`   | 6px   | inputs, buttons              |
| `--radius-md`   | 10px  | cards inner, callouts        |
| `--radius-lg`   | 16px  | panels, the comparison board |
| `--radius-xl`   | 24px  | large hero cards             |
| `--radius-pill` | 999px | stat bars, badges, toggles   |

**Borders** — width `--border-w: 1px` default, `--border-w-strong: 2px` for focus. Color from `--border` / `--border-strong`.

**Elevation** — dark UI favors borders over shadows. One shadow token, reserved for floating layers (dropdowns, menus):

| Token              | Value                        |
| ------------------ | ---------------------------- |
| `--shadow-overlay` | `0 8px 24px rgba(0,0,0,0.5)` |
| `--shadow-none`    | `none`                       |

---

## 8. Breakpoints & Layout

| Token     | Min-width | Note                                                                             |
| --------- | --------- | -------------------------------------------------------------------------------- |
| `--bp-sm` | 480px     | large phone                                                                      |
| `--bp-md` | 768px     | **comparison collapses to per-stat cards below this** ([D-010](03_decisions.md)) |
| `--bp-lg` | 1024px    | tablet / small laptop                                                            |
| `--bp-xl` | 1280px    | desktop                                                                          |

Content max-width `--content-max: 1120px`, centered; gutters `--space-6` (desktop) / `--space-4` (mobile).

---

## 9. Motion

| Token             | Value                        | Use                   |
| ----------------- | ---------------------------- | --------------------- |
| `--dur-fast`      | 120ms                        | hover, focus          |
| `--dur-base`      | 180ms                        | most transitions      |
| `--dur-slow`      | 300ms                        | selection cross-fades |
| `--dur-bar`       | 450ms                        | stat-bar fill         |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | default               |
| `--ease-out`      | `cubic-bezier(0, 0, 0.2, 1)` | entrances (bar fill)  |

**Reduced motion is mandatory:** under `prefers-reduced-motion: reduce`, disable bar fills/staggers and render final state instantly; keep only opacity fades. ([04_design §7](04_design.md))

---

## 10. Z-Index Scale

| Token          | Value | Layer                             |
| -------------- | ----- | --------------------------------- |
| `--z-base`     | 0     | normal flow                       |
| `--z-dropdown` | 1000  | search results, menus             |
| `--z-sticky`   | 1100  | sticky header                     |
| `--z-overlay`  | 1200  | modals / dialogs                  |
| `--z-toast`    | 1300  | toasts / copied-link confirmation |

---

## 11. Iconography

Vector icons via **`react-icons`** — primarily the Lucide set (`react-icons/lu`), with other sets used sparingly when a specific glyph is needed (e.g. `react-icons/fa6` carets for the diff indicator). Sizes tied to text: `--icon-sm 16px`, `--icon-md 20px`, `--icon-lg 24px`. Stroke width 1.75–2. Icons inherit `currentColor`; never introduce off-token colors.

**No emoji in the UI.** Emoji render inconsistently across platforms and read as unpolished ("vibe-coded"). Always use a vector icon instead. ([D-015](03_decisions.md))

---

## 12. Usage Rules (consistency guardrails)

1. **Tokens only.** No raw hex, px, or rem literals in components — reference a token. If the value you want doesn't exist, add it to this doc first.
2. **One style per role.** Every piece of text maps to exactly one Section 5 style. No hand-tuned sizes, weights, or spacing.
3. **Semantic over primitive.** Components use semantic tokens (`--text-primary`), not primitives (`--neutral-50`), so theming stays a one-layer swap.
4. **Sizes come from the ramp.** The only font sizes that exist are §4.3's eleven steps. This is the rule that fixes the "too many inconsistent sizes" habit.
5. **Accent is chrome-only.** The purple accent is for brand/actions/focus — never a stat/type color (§2, [04_design §2](04_design.md)).
6. **Never color alone.** Meaning always pairs color with text/number/icon (accessibility).
7. **Spacing from the scale.** All spacing uses §6 tokens; no arbitrary margins.

---

## 13. Mapping to Tailwind (next build step)

When I build the Tailwind theme ([05_roadmap](05_roadmap.md) Phase 0), tokens map straight onto theme keys:

- **Colors** → `theme.extend.colors` (semantic names: `bg-base`, `surface`, `accent`, `type-fire`, …), sourced from CSS variables so runtime theming stays possible.
- **Font sizes** → `theme.fontSize` keyed by the §4.3 tokens (`2xs`…`5xl`), each with paired `lineHeight` + `letterSpacing`.
- **Font families** → `theme.fontFamily.display` / `.body`.
- **Spacing** → `theme.spacing` from §6.
- **Radii** → `theme.borderRadius` from §7.
- **Screens** → `theme.screens` from §8.
- **Timing** → `theme.transitionDuration` / `transitionTimingFunction` from §9.
- **Z-index** → `theme.zIndex` from §10.

The §5 semantic text styles become small utility classes (or a typography plugin config) named `text-h1`, `text-stat`, etc., so a component writes `class="text-stat"` and never re-specifies size/weight/leading. That is the payoff: uniform, professional, and impossible to drift.
