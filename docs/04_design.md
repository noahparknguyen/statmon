# Statmon — Design (Step 4)

_The style guide: color scheme, per-type bar colors, typography, dark mode, layout, components, motion, and accessibility. This is the source of truth for the design tokens Phase 2 of the [05_roadmap](05_roadmap.md) builds. Values here are the working system — anything marked **⚠ contrast-check** must be validated against WCAG at implementation time._

> Grounded in [D-007](03_decisions.md) (horizontal type-colored bars) and [D-008](03_decisions.md) (Inter + Space Grotesk). Dark mode is canonical; light mode is a [V2] token swap (§8).
>
> **This doc explains the _why_.** For the exhaustive, authoritative token list — every color, the complete font-size ramp, all 17 named text styles, spacing, radii, motion — see **[06_style_guide](06_style_guide.md)**. When a concrete value is needed, 06 is the source of truth.

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

| Token              | Hex       | Use                                      |
| ------------------ | --------- | ---------------------------------------- |
| `--bg-base`        | `#0B0C0F` | Page background                          |
| `--bg-surface`     | `#14161B` | Cards, panels, the comparison board      |
| `--bg-elevated`    | `#1C1F27` | Inputs, raised elements, stat-bar tracks |
| `--border`         | `#2A2E37` | Hairline borders, dividers               |
| `--border-strong`  | `#3A3F4B` | Focused/hover borders                    |
| `--text-primary`   | `#F4F5F7` | Headings, stat values, primary text      |
| `--text-secondary` | `#A8AEBA` | Labels, secondary text                   |
| `--text-tertiary`  | `#6B7280` | Hints, disabled, captions                |

### Accent (Chandelure flame — pastel purple → blue)

Derived from Chandelure's official artwork (soft periwinkle purple `#757CBB`, deep flame-core `#7352E6`, pastel blue `#A8C3DD`, pale highlight `#D2DEF1`), lifted slightly for pop on the near-black background.

| Token               | Hex       | Use                                                           |
| ------------------- | --------- | ------------------------------------------------------------- |
| `--accent`          | `#9AA0E8` | Primary actions, links, brand, focus glow (pastel periwinkle) |
| `--accent-hover`    | `#B3B8F0` | Hover/active state                                            |
| `--accent-blue`     | `#A8C3DD` | Flame's blue stop; secondary highlight / gradient end         |
| `--accent-muted`    | `#34355C` | Subtle accent fills, tags on dark                             |
| `--accent-contrast` | `#12121C` | Text/icon on top of a solid accent fill                       |

The **flame gradient** (`#7352E6` → `#9AA0E8` → `#A8C3DD`) is allowed **only** in the hero/home area (e.g. behind the mascot) — never behind data.

> **Note:** the accent purple is reserved for chrome (brand, actions, links, focus) and deliberately kept bluer/lighter than the purple-family type colors (Ghost `#9075B8`, Flying `#B7A2FF`, Dragon `#9268FF`) so it never reads as a type on the stat board.

### Advantage / difference cues

To avoid clashing with 18 type colors and to stay colorblind-safe, the difference indicator relies on **position + sign + caret**, not a red/green pair:

| Token          | Hex       | Use                                                              |
| -------------- | --------- | ---------------------------------------------------------------- |
| `--diff-favor` | `#F4F5F7` | Signed value of the winning side (bold, high-contrast) + ▲ caret |
| `--diff-muted` | `#6B7280` | The tie / zero-difference state                                  |

The favored value sits in the winning Pokémon's column, prefixed with a directional caret (▲ toward the winner). Optionally tint the caret with that Pokémon's type color for extra signal — but the number and position carry the meaning on their own.

---

## 3. Color — The 18 Type Colors

Each type has a color tuned to stay **vibrant on `--bg-base`**. Several canonical type colors (Normal, Dark, Rock, Ghost) are too muddy on dark backgrounds and are brightened here. These fill the stat bars and tint type badges.

| Type     | Hex       | Notes                                                   |
| -------- | --------- | ------------------------------------------------------- |
| Normal   | `#B5B394` | brightened ⚠ contrast-check                             |
| Fire     | `#FF9741` |                                                         |
| Water    | `#5AA2FF` |                                                         |
| Electric | `#F5D93B` | high-luminance; use dark text on badge                  |
| Grass    | `#86D95C` |                                                         |
| Ice      | `#A6E4E1` | high-luminance; dark text on badge                      |
| Fighting | `#E64640` | brightened                                              |
| Poison   | `#C255C0` |                                                         |
| Ground   | `#E8C86F` |                                                         |
| Flying   | `#B7A2FF` |                                                         |
| Psychic  | `#FF6E9A` |                                                         |
| Bug      | `#BCCF2A` | brightened                                              |
| Rock     | `#CBB44A` | brightened                                              |
| Ghost    | `#9075B8` | brightened                                              |
| Dragon   | `#9268FF` | brightened; lightened for AA ([D-027](03_decisions.md)) |
| Dark     | `#9A7E68` | strongly brightened ⚠ contrast-check                    |
| Steel    | `#C4C4DA` | high-luminance; dark text on badge                      |
| Fairy    | `#E79EC2` |                                                         |

**Rules:**

- A Pokémon's **primary type** colors its stat bars; the secondary type appears as a badge next to its name.
- On **type badges**, all labels use near-black text (`--color-base`) — every type color is light enough on the dark UI that dark text maximizes contrast, and it reads uniformly. (Audited to AA in [D-027](03_decisions.md); the earlier per-type black/white split is superseded.)
- Bar fills sit on `--bg-elevated` tracks; every fill must clear **3:1** against that track (decorative-informational). Since bars always carry a numeric label, this is a "clarity" target rather than a hard text-contrast requirement.
- Ship this as a single `type → { fill, badgeText }` map generated alongside the data ([01_spec §4](01_spec.md)).

---

## 4. Typography

Two families ([D-008](03_decisions.md)):

- **Space Grotesk** — logo/wordmark, page titles, section headers, big numbers in the hero. Weights 500 / 700. Slightly tight tracking on large sizes.
- **Inter** — all body, labels, UI, and **stat values** with tabular figures: `font-feature-settings: "tnum" 1;` so digits align in the difference column. Weights 400 / 500 / 600.

### Type scale

The intent: **Space Grotesk** carries display/heading weight; **Inter** carries body, UI, and tabular stat numbers. The **complete, authoritative ramp** — every one of the 11 sizes and all 17 named text styles (with exact rem/px, weight, line-height, and tracking) — lives in **[06_style_guide §4–5](06_style_guide.md)** and is the single source of truth. Do not re-specify sizes here; reference the named styles (`text-h1`, `text-stat`, …).

- **Stat numbers** use `text-stat` / `text-stat-lg`, always Inter with `tnum`.
- Load both from Google Fonts (self-hosting via the build for performance/privacy is a [V2] nicety); include `font-display: swap`.

---

## 5. Layout & Spacing

- **Spacing scale (4px base)** and **radii** are defined authoritatively in [06_style_guide §6–7](06_style_guide.md); use those tokens (`--space-*`, `--radius-*`) rather than raw values.
- **Max content width:** ~1120px, centered, with 24px gutters (16px on mobile).
- **Elevation:** in dark mode prefer **borders over shadows**; a soft shadow is reserved for overlays/dropdowns only.

### Comparison layout (the core screen) — as built

A **three-card board**: two Pokémon cards flanking a center comparison card. All three share one **8pt vertical spec** (top zone 272 + stats 240 + footer 56 = **568px**) so they're equal height with **row-aligned stats**. **P1 is the attacker, P2 the defender**; a **Swap** button flips them. ([D-017](03_decisions.md), [D-018](03_decisions.md), [D-019](03_decisions.md))

**Pokémon card (TCG-inspired):**

- Official **artwork as a bold square backdrop** (full card width, `object-contain`) that bleeds down **behind the stat bars**; a **scrim** fades it into the surface so bars stay legible, and bar tracks use the translucent `--color-track-glass` token so the art shows through. Lazy-loaded, self-hosted ([D-002](03_decisions.md)).
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

**StatBar** — track `--bg-elevated`, fill = primary type color, height 10–12px, `--radius-pill`. Fill width is scaled against a **fixed reference of 255** (the maximum possible base stat) so bars are globally comparable across every comparison. Label (Inter 500) + value (Inter 600, tnum) flank the bar.

**Difference cell** (center of each comparison row) — the **signed magnitude** (`+N`, bold) sits on the **row's centerline, aligned with the flanking bars** (bars + number share one data line), with the small **stat label** as a **caption above** it (overline). A **directional caret** occupies a fixed side slot on the winner's side (◀ left if Pokémon 1 leads, ▶ right if Pokémon 2 leads — both slots reserved so the number never shifts). Ties show "—" in `--diff-tie`; the empty state shows "–" in `--text-tertiary`. Never color-only (§2). Vector caret icons, never a text glyph or emoji ([D-015](03_decisions.md)).

**Buttons** — Primary: solid `--accent`, text `--accent-contrast`, hover `--accent-hover`. Secondary: `--bg-elevated` + `--border`, text `--text-primary`. Ghost: transparent, text `--text-secondary`, hover surface. All: `--radius-md`, 150ms transitions, visible focus ring.

**Search input** — `--bg-elevated`, `--border`, placeholder `--text-tertiary`; focus = `--border-strong` + 2px `--accent` focus ring. Results are a dropdown of rows: pixel sprite + name + type badges.

**Type badge** — pill, `--radius-pill`, background = type color, text = near-black (`--color-base`) for all types (§3, [D-027](03_decisions.md)).

**Cards / panels** — `--bg-surface`, `--border`, `--radius-lg`, generous padding (`--space-6`).

---

## 7. Motion

- **Bar fill:** grow from 0 to value using `--dur-bar` + `--ease-out`, optional slight stagger down the six rows.
- **Hover/focus:** `--dur-fast`.
- **Selection/swap:** cross-fade at `--dur-slow`.
- **`prefers-reduced-motion: reduce`:** disable fills/staggers — render final state instantly, keep only opacity fades. Non-negotiable.
- Duration/easing tokens are defined in [06_style_guide §9](06_style_guide.md).

---

## 8. Dark / Light Mode

Dark is canonical and the only mode at MVP. Light mode is a **[V2]** deliverable implemented purely by swapping the token values in §2 (e.g. `--bg-base: #FAFAFB`, inverted text ramp) — because every color is a CSS variable, no component needs to change. Type colors (§3) may need a **⚠ contrast-check** and slight darkening for light backgrounds. Toggle persists via a class on `:root`.

---

## 9. Accessibility (design-level)

- **Text contrast:** body ≥ 4.5:1, large text ≥ 3:1 against its background. The neutral ramp in §2 is chosen to meet this on `--bg-base`/`--bg-surface`.
- **Not color alone:** type identity is always paired with the type name/badge text; advantage is conveyed by number, sign, and caret (§2).
- **Focus:** every interactive element has a visible 2px `--accent` focus ring with offset.
- **Motion:** reduced-motion fully honored (§7).
- **Targets:** interactive hit areas ≥ 44×44px on touch.
- **Semantics:** stat rows use proper labels/structure so a screen reader announces "Speed, Pokémon 1 100, Pokémon 2 55, difference 45 in favor of Pokémon 1."

---

## 10. Brand & Assets

- **Wordmark:** "Statmon" set in Space Grotesk 700, with the pastel-purple accent on a single detail (e.g. the dot/tittle or a subtle underline glow) — not the whole word.
- **Mascot:** Volcarona featured on Home; the purple→blue flame gradient is allowed only there.
- **Favicon / OG:** derive from the wordmark + accent on `--bg-base`; per-comparison OG images are a [Someday] stretch ([00_brainstorm §10](00_brainstorm.md)).
- **Iconography:** a single lightweight line-icon set (e.g. Lucide), stroke-based, matching the minimalist tone.

---

## 11. Token Summary (for implementation)

All of the above ships as CSS custom properties on `:root` plus a Tailwind theme extension. The three generated/maintained artifacts:

1. **Core tokens** — the §2 palette, §4 font tokens, §5 spacing/radii.
2. **Type-color map** — `type → { fill, badgeText }`, generated with the dataset (§3).
3. **Component classes** — built on the tokens (§6).

Open follow-ups fold into Phase 2 of the [05_roadmap](05_roadmap.md). **The ⚠ contrast-checks are complete** ([D-027](03_decisions.md)): every pairing passes WCAG AA, verified reproducibly via `npm run audit:contrast`. Adjustments made: Dragon lightened to `#9268FF`, and `--text-tertiary` / `--diff-tie` moved to `neutral-400`.
