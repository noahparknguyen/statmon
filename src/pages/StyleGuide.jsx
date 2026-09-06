// Style-guide playground — the living reference for the design system, at the
// /style route. It renders the REAL tokens and components (not hand-rolled
// copies) so it can never drift from the app: swatches read CSS vars, badges use
// <TypeBadge>, and the sample comparison is the actual <FeaturedComparison>.
// See docs/06_style_guide.md (tokens) and docs/04_design.md (rationale).

import { useState } from "react";
import { LuX } from "react-icons/lu";
import Button from "../components/Button";
import PageHeader from "../components/PageHeader";
import { PAGE_CONTENT } from "../components/pageChrome";
import TypeBadge from "../components/TypeBadge";
import FeaturedComparison from "../components/FeaturedComparison";
import SearchBar from "../components/SearchBar";
import FormChips from "../components/FormChips";
import AbilityChips from "../components/AbilityChips";
import StabChip, { StabCaption, StabLabel } from "../components/StabChip";
import GenerationStrip from "../components/GenerationStrip";
import { getBySlug } from "../lib/pokemon";
import { generationOptions } from "../lib/eras";
import { TYPES, capitalize, typeColorVar, typeTextVar } from "../lib/types";
import {
  CHIP,
  CHIP_OFF,
  CHIP_ON,
  CHIP_ON_FILLED,
} from "../components/chipStyles";

const noop = () => {};

// Reads each token's computed value from the live stylesheet, so a swatch can
// never disagree with src/index.css. Read once in a lazy initialiser rather
// than an effect: the stylesheet is static for the session, so there is nothing
// to subscribe to, and this avoids a second render pass. Guarded for the
// no-DOM case so the component stays server-renderable.
function readTokenValues(names) {
  if (typeof document === "undefined") return {};
  const cs = getComputedStyle(document.documentElement);
  return Object.fromEntries(
    names.map((n) => [n, cs.getPropertyValue(n).trim()]),
  );
}

// Guards against this page silently falling behind the stylesheet: finds every
// `.text-*` rule that bundles a font-family (i.e. a §5 named style, not a colour
// utility like `text-primary`) and reports any the page forgot to list. Same
// idea as `npm run check:docs` — a consistency claim that isn't checked degrades
// the moment attention moves on. This page previously listed 14 of 17.
function readMissingTextStyles(listed) {
  if (typeof document === "undefined") return [];
  const found = new Set();
  const walk = (rules) => {
    for (const r of rules) {
      if (r.cssRules) walk(r.cssRules);
      if (!r.selectorText || !r.style?.fontFamily) continue;
      for (const m of r.selectorText.matchAll(/\.(text-[a-z0-9-]+)\b/g))
        found.add(m[1]);
    }
  };
  for (const sheet of document.styleSheets) {
    try {
      walk(sheet.cssRules);
    } catch {
      /* cross-origin sheet — nothing to read */
    }
  }
  return [...found].filter((c) => !listed.includes(c)).sort();
}

// Literal `rounded-*` strings so Tailwind's scanner keeps the utilities.
const RADII = [
  ["rounded-xs", "xs · 4"],
  ["rounded-sm", "sm · 6"],
  ["rounded-md", "md · 10"],
  ["rounded-lg", "lg · 16"],
  ["rounded-xl", "xl · 24"],
  ["rounded-full", "full · pill"],
];

// [label, CSS var, note] — the value is read from the live stylesheet at
// runtime (see useTokenValue), never hardcoded here. A literal hex in this file
// would be a second source of truth and would drift the moment a token moved.
const NEUTRALS = [
  ["base", "--color-base", "page background"],
  ["surface", "--color-surface", "cards / surfaces"],
  ["elevated", "--color-elevated", "elevated / inputs / tracks"],
  ["border-subtle", "--color-border-subtle", "default border"],
  ["border-strong", "--color-border-strong", "hover/focus border"],
  ["tertiary", "--color-tertiary", "hints, captions, overlines"],
  ["secondary", "--color-secondary", "labels, secondary text"],
  ["primary", "--color-primary", "headings, values, body"],
];

const ACCENTS = [
  ["accent-core", "--color-accent-core", "flame core"],
  ["accent", "--color-accent", "actions, links, focus"],
  ["accent-hover", "--color-accent-hover", "hover / active"],
  ["accent-blue", "--color-accent-blue", "flame blue"],
  ["accent-contrast", "--color-accent-contrast", "text on an accent fill"],
];

// Semantic tokens that aren't part of the neutral or accent ramps.
const OTHER_TOKENS = [
  ["diff-tie", "--color-diff-tie", "zero-difference state"],
  ["track-glass", "--color-track-glass", "bar track over artwork"],
];

// ALL 22 named styles from 06_style_guide §5. Kept complete on purpose: a
// partial list makes this page look authoritative while quietly omitting styles
// (it previously showed 14 of 17). checkStyleCoverage below fails loudly if a
// style exists in the stylesheet but is missing here.
const TEXT_STYLES = [
  ["text-display-hero", "Display hero", "48 · 700"],
  ["text-display", "Display", "36 · 700"],
  ["text-h1", "Heading 1", "30 · 700"],
  ["text-h2", "Heading 2", "24 · 500"],
  ["text-h3", "Heading 3 · Pokémon name", "20 · 500"],
  ["text-h4", "Heading 4", "18 · 500"],
  ["text-body-lg", "Body large — lead paragraph text.", "18 · 400"],
  ["text-body", "Body — the default paragraph size for reading.", "16 · 400"],
  ["text-body-sm", "Body small — secondary and helper text.", "14 · 400"],
  ["text-label", "Label — form and UI labels", "14 · 500"],
  ["text-caption", "Caption — hints and footnotes", "12 · 500"],
  ["text-overline", "Overline · stat labels", "11 · 500"],
  ["text-numeral-xl", "+123", "48 · 700 · display numeral"],
  ["text-numeral-lg", "+123", "36 · 700 · display numeral"],
  ["text-numeral-md", "Tied", "30 · 700 · display numeral"],
  ["text-stat-lg", "1234567890 — BST (tabular)", "20 · 600"],
  ["text-stat", "1234567890 — stat value (tabular)", "18 · 600"],
  ["text-stat-sm", "1234567890 — dex table cell (tabular)", "14 · 600"],
  ["text-diff", "+42 — difference value (tabular)", "14 · 600"],
  ["text-meta", "Fire ½× — chip / pill label", "12 · 600"],
  ["text-badge", "TYPE BADGE", "11 · 600"],
  ["text-button", "Button label", "14 · 600"],
];

// A labelled specimen row, so each chip family is captioned with what makes its
// geometry different rather than left to be compared by eye.
function ChipRow({ label, note, children }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-overline text-tertiary">{label}</span>
      {children}
      <span className="text-caption text-tertiary">{note}</span>
    </div>
  );
}

// The dex's filter chip, rebuilt from the shared constants rather than imported:
// DexFilters keeps its Chip private and wires it to URL state, which this page
// has none of. It is the one specimen here that is a copy, so it uses the same
// exported classes the real one does — if those change, this changes with them.
function DemoChip({ label, color, active = false }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`${CHIP} min-h-9 gap-1.5 px-3 py-1.5 transition-colors ${
        active ? (color ? CHIP_ON_FILLED : CHIP_ON) : CHIP_OFF
      }`}
      style={
        active && color
          ? { backgroundColor: typeColorVar(color), color: typeTextVar() }
          : undefined
      }
    >
      {!active && color && (
        <span
          aria-hidden
          className="size-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: typeColorVar(color) }}
        />
      )}
      {label}
      {active && <LuX aria-hidden />}
    </button>
  );
}

function Section({ title, children }) {
  return (
    <section className="border-t border-border-subtle py-10">
      <h2 className="text-overline text-tertiary mb-6">{title}</h2>
      {children}
    </section>
  );
}

function Swatch({ label, cssVar, value, note }) {
  return (
    <div className="w-32">
      <div
        className="h-12 rounded-md border border-border-subtle"
        style={{ backgroundColor: `var(${cssVar})` }}
      />
      <div className="mt-2">
        <div className="text-caption text-secondary">{label}</div>
        <div className="text-caption text-tertiary">{value || "\u00a0"}</div>
        {note ? <div className="text-caption text-tertiary">{note}</div> : null}
      </div>
    </div>
  );
}

const SWATCH_VARS = [...NEUTRALS, ...ACCENTS, ...OTHER_TOKENS].map(
  ([, cssVar]) => cssVar,
);
const LISTED_TEXT_STYLES = TEXT_STYLES.map(([cls]) => cls);

export default function StyleGuide() {
  const [tokenValues] = useState(() => readTokenValues(SWATCH_VARS));
  const [missingStyles] = useState(() =>
    readMissingTextStyles(LISTED_TEXT_STYLES),
  );
  const volcarona = getBySlug("volcarona");
  const chandelure = getBySlug("chandelure");
  const charizard = getBySlug("charizard"); // has Mega forms → FormChips demo
  // Chandelure is the AbilityChips demo because it shows all three states at
  // once: Flash Fire is in the effect table (dot), Flame Body is not, and
  // Infiltrator is hidden (icon). A one-ability Pokémon demonstrates neither
  // marker, which is the whole point of the row.
  // Derived, never listed: three quoted type names in a row is exactly what the
  // "only one list of the 18" guard in types.test.js fails on, and this page is
  // the file that already broke that rule once (D-048).
  const [t0, t1, t2, t3] = TYPES;

  return (
    <div className={PAGE_CONTENT}>
      {/* This page of all pages renders through the shared shell: it had its own
          `px-6` gutter against the uniform `px-4` every other route uses
          (06_style_guide §8) and its own `text-display` title against their
          `text-h1` — drift in the one file whose stated job is not to have any. */}
      <PageHeader
        title="Style guide"
        subtitle="Every color, text style, and core component — rendered from the live tokens and real components, so this page can't drift from the app."
      />

      <Section title="Core palette">
        <div className="flex flex-wrap gap-3">
          {NEUTRALS.map(([l, v, n]) => (
            <Swatch
              key={l}
              label={l}
              cssVar={v}
              value={tokenValues[v]}
              note={n}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-6">
          {ACCENTS.map(([l, v, n]) => (
            <Swatch
              key={l}
              label={l}
              cssVar={v}
              value={tokenValues[v]}
              note={n}
            />
          ))}
          <div className="w-32">
            <div className="h-12 rounded-md bg-flame border border-border-subtle" />
            <div className="mt-2 text-caption text-secondary">flame</div>
            <div className="text-caption text-tertiary">
              gradient · BST delta + speed banner only
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-6">
          {OTHER_TOKENS.map(([l, v, n]) => (
            <Swatch
              key={l}
              label={l}
              cssVar={v}
              value={tokenValues[v]}
              note={n}
            />
          ))}
        </div>
        <p className="text-caption text-tertiary mt-4">
          Values are read from the live stylesheet at runtime — this page cannot
          disagree with <code>src/index.css</code>.
        </p>
      </Section>

      <Section title="18 type colors — TypeBadge">
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <TypeBadge key={t} type={t} />
          ))}
        </div>
        <p className="text-caption text-tertiary mt-4">
          All badges use near-black text on the type color (AA — D-027).
        </p>
      </Section>

      <Section title="Type scale — named text styles">
        {missingStyles.length > 0 && (
          <p className="text-body-sm text-primary bg-elevated border border-border-strong rounded-md p-3 mb-6">
            ⚠ {missingStyles.length} named style(s) exist in the stylesheet but
            are missing from this page: <code>{missingStyles.join(", ")}</code>.
            Add them to <code>TEXT_STYLES</code>.
          </p>
        )}
        <div className="flex flex-col gap-5">
          {TEXT_STYLES.map(([cls, sample, spec]) => (
            <div
              key={cls}
              className="grid grid-cols-[1fr_auto] items-baseline gap-4 border-b border-border-subtle pb-4"
            >
              <div className={cls}>{sample}</div>
              {/* No whitespace-nowrap: the longest spec ("text-numeral-xl · 48 ·
                  700 · display numeral") cannot shrink below its own width, and
                  pushed this page 6px past the viewport at 390px. The auto grid
                  column still takes max-content whenever there is room, so this
                  only wraps on a narrow screen. */}
              <div className="text-caption text-tertiary text-right">
                <span className="text-secondary">{cls}</span> · {spec}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Radii">
        <div className="flex flex-wrap gap-6">
          {RADII.map(([cls, label]) => (
            <div key={cls} className="flex flex-col items-center gap-2">
              <div
                className={`w-16 h-16 bg-elevated border border-border-strong ${cls}`}
              />
              <span className="text-caption text-tertiary">{label}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Controls">
        <div className="flex flex-col gap-6 max-w-md">
          <SearchBar label="Search a Pokémon" onSelect={noop} />
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary action</Button>
            <Button variant="secondary" size="sm">
              Secondary
            </Button>
            <Button variant="secondary" size="sm" disabled>
              Disabled
            </Button>
          </div>
        </div>
      </Section>

      {/* All four chip families side by side. They share one colour pair
          (components/chipStyles.jsx) and differ only in geometry, so seeing
          them together is the check that they still agree — the same reason
          this page renders real components instead of copies. */}
      <Section title="Chips — one colour pair, four geometries">
        <div className="flex flex-col gap-6">
          <ChipRow
            label="Form chips · compact, sharing the card's 88px controls band"
            note="The one known WCAG 2.5.8 spacing exception (D-042)."
          >
            {/* Shown at roughly the width of the card band they live in, so
                the wrapping reads as the real layout it is. Left-aligned since
                D-080 put them in a labelled column beside FORM. */}
            <div className="max-w-72 rounded-md border border-dashed border-border-subtle p-2">
              {charizard ? (
                <FormChips pokemon={charizard} onSelect={noop} />
              ) : null}
            </div>
          </ChipRow>

          <ChipRow
            label="Generation strip · 36px, near-square around one numeral"
            note="A dot marks a generation whose board differs from today (D-046)."
          >
            {charizard ? (
              <GenerationStrip
                label="Stats as of"
                options={generationOptions([charizard])}
                asof={1}
                onSelect={noop}
              />
            ) : null}
          </ChipRow>

          <ChipRow
            label="Filter chips · 36px, with a colour dot and a dismiss ×"
            note="Selected type chips take the audited TypeBadge pairing (D-027)."
          >
            <div className="flex flex-wrap gap-1.5">
              <DemoChip label={capitalize(t1)} color={t1} />
              <DemoChip label={capitalize(t2)} color={t2} active />
              <DemoChip label="Gen 5" />
              <DemoChip label="Gen 6" active />
            </div>
          </ChipRow>

          <ChipRow
            label="Ability chips · compact, exactly one always selected"
            note="A dot marks an ability that changes type matchups; the icon marks the hidden one (D-073)."
          >
            {chandelure ? (
              <AbilityChips
                abilities={chandelure.abilities}
                selected={chandelure.abilities[0]?.slug}
                onSelect={noop}
                label="Ability (demo)"
              />
            ) : null}
          </ChipRow>

          <ChipRow
            label="Ability chips · read-only, as Home renders them"
            note="No onSelect ⇒ pills, not buttons: a button that does nothing is worse than a label (D-078)."
          >
            {chandelure ? (
              <AbilityChips
                abilities={chandelure.abilities}
                selected={chandelure.abilities[0]?.slug}
                label="Ability (read-only demo)"
              />
            ) : null}
          </ChipRow>
        </div>
      </Section>

      {/* StabChip only ever appeared on this page incidentally, inside the
          FeaturedComparison below — so its four tiers and its corrected state
          had no reference anywhere. That is the drift this page exists to
          prevent, in the file whose job is preventing it (D-079). */}
      <Section title="STAB chips — the four effectiveness tiers">
        <div className="flex flex-col gap-6">
          <ChipRow
            label="md · the comparison board"
            note="Content-sized pills; never colour alone, so every chip states its multiplier as text and carries a tier icon."
          >
            <div className="flex flex-wrap gap-2">
              <StabChip type={t1} mult={2} />
              <StabChip type={t2} mult={1} />
              <StabChip type={t3} mult={0.5} />
              <StabChip type={t0} mult={0} />
            </div>
          </ChipRow>

          <ChipRow
            label="md · corrected by the defender's ability"
            note="The chart's own answer stays on screen, struck through. The ability is named by the surface, never on the chip (D-079)."
          >
            <div className="flex flex-col items-start gap-2">
              <div className="flex flex-wrap gap-2">
                <StabChip type={t0} mult={0} baseMult={2} via="levitate" />
                <StabChip type={t1} mult={2} baseMult={1} via="fluffy" />
              </div>
              {/* The real component, not a copy of its markup — which is this
                  page's whole contract, and which a hand-copy here had already
                  broken inside one session (D-090). */}
              <StabCaption types={[t2]} via="levitate" />
            </div>
          </ChipRow>

          <ChipRow
            label="sm · Home's three-column head"
            note="Geometry only — the fill, border weight, tier colour and icon are identical to md (D-058)."
          >
            <div className="flex flex-col items-start gap-1.5">
              <StabLabel>STAB</StabLabel>
              <div className="flex flex-wrap gap-1">
                <StabChip type={t1} mult={2} size="sm" />
                <StabChip
                  type={t0}
                  mult={0}
                  baseMult={2}
                  via="levitate"
                  size="sm"
                />
              </div>
            </div>
          </ChipRow>
        </div>
      </Section>

      <Section title="FeaturedComparison — the live comparison board">
        {volcarona && chandelure ? (
          <div className="max-w-2xl">
            <FeaturedComparison p1={volcarona} p2={chandelure} />
          </div>
        ) : (
          <p className="text-body-sm text-tertiary">Data not loaded.</p>
        )}
      </Section>

      <footer className="border-t border-border-subtle py-10 text-caption text-tertiary">
        Style-guide playground · tokens in src/index.css · see
        docs/06_style_guide.md
      </footer>
    </div>
  );
}
