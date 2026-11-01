// The style guide at /style: a live reference for the design system. It renders
// the real tokens and components rather than copies, so it can't drift from the
// app: swatches read CSS variables, badges are <TypeBadge>, and the sample
// comparison is the actual <FeaturedComparison>.

import { useState } from "react";
import { LuArrowRight, LuX } from "react-icons/lu";
import { FaCaretDown } from "react-icons/fa6";
import Button from "../components/Button";
import ChipGroup from "../components/ChipGroup";
import Dialog from "../components/Dialog";
import IconButton from "../components/IconButton";
import StatBar from "../components/StatBar";
import PageHeader from "../components/PageHeader";
import { PAGE_CONTENT } from "../components/pageChrome";
import TypeBadge from "../components/TypeBadge";
import FeaturedComparison from "../components/FeaturedComparison";
import SearchBar from "../components/SearchBar";
import FormChips from "../components/FormChips";
import AbilityChips from "../components/AbilityChips";
import StabChip, { StabCaption, StabLabel } from "../components/StabChip";
import FilterChip from "../components/FilterChip";
import GenerationStrip from "../components/GenerationStrip";
import { getBySlug } from "../lib/pokemon";
import { generationOptions } from "../lib/eras";
import { TYPES, capitalize } from "../lib/types";

const noop = () => {};

// Reads each token's computed value from the live stylesheet, so a swatch can
// never disagree with src/index.css. Read once, in a lazy initialiser rather
// than an effect: the stylesheet doesn't change during a visit, so there's
// nothing to subscribe to, and it saves a second render. Guarded for when
// there's no DOM, so the component can still render on a server.
function readTokenValues(names) {
  if (typeof document === "undefined") return {};
  const cs = getComputedStyle(document.documentElement);
  return Object.fromEntries(
    names.map((n) => [n, cs.getPropertyValue(n).trim()]),
  );
}

// Stops this page silently falling behind the stylesheet: it finds every
// `.text-*` rule that sets a font family (a named text style, as opposed to a
// colour utility like `text-primary`) and reports any the page doesn't list. A
// consistency claim that nothing checks soon stops being true.
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
      /* A cross-origin stylesheet: nothing to read. */
    }
  }
  return [...found].filter((c) => !listed.includes(c)).sort();
}

// Literal `rounded-*` strings, so Tailwind's scanner keeps the classes. Each
// radius is a role, so each specimen is labelled with the job it does rather
// than only its size.
const RADII = [
  ["rounded-xs", "xs · 4 · grid cell"],
  ["rounded-sm", "sm · 6 · text field"],
  ["rounded-md", "md · 10 · inset"],
  ["rounded-lg", "lg · 16 · surface"],
  ["rounded-full", "full · control"],
];

// [label, CSS variable, note]. The value is read from the live stylesheet as
// the page runs (see useTokenValue), never written here: a literal hex in this
// file would be a second copy, and would drift the moment a token changed.
const NEUTRALS = [
  ["base", "--color-base", "page background"],
  ["surface", "--color-surface", "cards / surfaces"],
  ["elevated", "--color-elevated", "elevated / inputs / tracks"],
  ["border-subtle", "--color-border-subtle", "default border"],
  ["border-strong", "--color-border-strong", "chip edge, hover border"],
  ["border-field", "--color-border-field", "text field edge (3:1)"],
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
  ["accent-muted", "--color-accent-muted", "the correct answer's fill"],
];

// Semantic tokens that aren't part of the neutral or accent ramps.
const OTHER_TOKENS = [
  ["diff-tie", "--color-diff-tie", "zero-difference state"],
  ["track-glass", "--color-track-glass", "bar track over artwork"],
];

// All 22 named text styles. Kept complete on purpose, since a partial list would
// make this page look authoritative while quietly leaving styles out.
// checkStyleCoverage below reports any style in the stylesheet that's missing
// here.
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
  ["text-caption", "Caption — hints and footnotes", "12 · 500"],
  ["text-overline", "Overline · stat labels", "11 · 500"],
  ["text-overline-lg", "Overline large · arena role labels", "16 · 500"],
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

// A labelled specimen row, so each chip family is captioned with how its shape
// differs, rather than left to be compared by eye.
function ChipRow({ label, note, children }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-overline text-tertiary">{label}</span>
      {children}
      <span className="text-caption text-tertiary">{note}</span>
    </div>
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
  // Chandelure demonstrates AbilityChips because it shows all three states at
  // once: Flash Fire is in the effect table (a dot), Flame Body isn't, and
  // Infiltrator is hidden (an icon). A one-ability Pokémon would show neither
  // marker, and the markers are the point of the row.
  // Taken from TYPES rather than written out: three quoted type names in a row
  // is what types.test.js's "only one list of the 18" check fails on.
  const [t0, t1, t2, t3, t4, t5] = TYPES;
  // Which demo dialog is open: "sheet", "full", or neither.
  const [demo, setDemo] = useState(null);

  return (
    <div className={PAGE_CONTENT}>
      {/* Rendered through the shared page shell, with the same gutter and
          title as every other page: this is the one page that mustn't drift
          from the rest. */}
      <PageHeader
        title="Style guide"
        subtitle="Every colour, text style, and core component, rendered from the live tokens and real components, so this page can't drift from the app."
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

      <Section title="18 type colours — TypeBadge">
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <TypeBadge key={t} type={t} />
          ))}
        </div>
        <p className="text-caption text-tertiary mt-4">
          All badges use near-black text on the type colour, which passes AA.
        </p>
      </Section>

      <Section title="Type scale — named text styles">
        {missingStyles.length > 0 && (
          <p className="text-body-sm text-primary bg-elevated border border-border-strong rounded-md p-3 mb-6">
            {missingStyles.length} named style(s) exist in the stylesheet but
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
                  700 · display numeral") couldn't shrink below its own width,
                  and would push the page past the screen at 390px. The auto
                  grid column still takes its full width whenever there's room,
                  so this only wraps on a narrow screen. */}
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

      {/* Every box on the site is one of two kinds: a surface, with 16px of
          padding and a 16px radius, and an inset nested inside one, with 12px
          and 10px. Shown nested, because that's the only way an inset is
          used. */}
      <Section title="Surfaces — a surface and an inset">
        <div className="max-w-md rounded-lg border border-border-subtle bg-surface p-4">
          <span className="text-overline text-tertiary">
            Surface · p-4 · lg
          </span>
          <div className="mt-2 rounded-md border border-border-subtle p-3">
            <span className="text-caption text-secondary">
              Inset · p-3 · md
            </span>
          </div>
        </div>
      </Section>

      <Section title="Controls">
        <div className="flex flex-col gap-6 max-w-md">
          <ChipRow
            label="Text field · 44px, the 3:1 field edge, the focus ring on its wrapper"
            note="Shared by every text field on the site (fieldStyles.jsx)."
          >
            <SearchBar label="Search a Pokémon" onSelect={noop} />
          </ChipRow>
          <ChipRow
            label="Buttons · md 44px for a page's action, sm 36px inline, touch for a dialog's footer"
            note="Primary, secondary, and ghost for the quiet action. Disabled is 40%. Touch is md on a phone, where a dialog's action is the one a thumb is after, and sm from md."
          >
            <div className="flex flex-wrap items-center gap-3">
              <Button>
                Primary action
                <LuArrowRight aria-hidden />
              </Button>
              <Button variant="secondary" size="sm">
                Secondary
              </Button>
              <Button variant="ghost" size="sm">
                Ghost
              </Button>
              <Button variant="secondary" size="sm" disabled>
                Disabled
              </Button>
              <Button size="touch">Touch</Button>
            </div>
          </ChipRow>
          <ChipRow
            label="Icon buttons · 36px, a 16px icon"
            note="Ghost on its own, outline in a row of bordered controls."
          >
            <div className="flex items-center gap-3">
              <IconButton label="Close (demo)" onClick={noop}>
                <LuX aria-hidden />
              </IconButton>
              <IconButton
                variant="outline"
                label="Reverse (demo)"
                onClick={noop}
              >
                <FaCaretDown aria-hidden />
              </IconButton>
            </div>
          </ChipRow>
        </div>
      </Section>

      {/* The site's one stat bar, in each of the ways it's used. */}
      <Section title="Stat bars — one bar, 8px">
        {volcarona ? (
          <div className="flex max-w-md flex-col gap-6">
            <ChipRow
              label="Solid track · every comparison row, desktop and phone"
              note="Scaled to 255, the same length for the same number on every surface."
            >
              <StatBar value={volcarona.stats.spAtk} type={t0} />
            </ChipRow>
            <ChipRow
              label="Mirrored · a comparison row, one bar per side"
              note="The left bar grows from the centre outward."
            >
              <div className="grid grid-cols-2 gap-1.5">
                <StatBar value={volcarona.stats.speed} type={t1} side="end" />
                <StatBar value={volcarona.stats.hp} type={t2} />
              </div>
            </ChipRow>
            <ChipRow
              label="Glass track · over artwork, on the Pokémon card"
              note="The only bar that sits on art, so the only one the art shows through."
            >
              <StatBar value={volcarona.stats.speed} type={t3} track="glass" />
            </ChipRow>
            <ChipRow label="Empty · no Pokémon yet" note="The track alone.">
              <StatBar />
            </ChipRow>
          </div>
        ) : null}
      </Section>

      {/* Every chip family side by side. They share one colour pair
          (components/chipStyles.jsx) and differ only in shape, so seeing them
          together is the check that they still agree, which is also why this
          page renders real components instead of copies. */}
      <Section title="Chips — one colour pair, a shape for each place">
        <div className="flex flex-col gap-6">
          <ChipRow
            label="Form chips · compact, sharing the card's 88px controls band"
            note="21px tall, so they pass WCAG 2.5.8 by spacing rather than size: 27.1px between the tightest centres."
          >
            {/* Shown at about the width of the card band they live in, so the
                wrapping matches the real layout. Left-aligned, as in their
                labelled column beside FORM. */}
            <div className="max-w-72 rounded-md border border-dashed border-border-subtle p-2">
              {charizard ? (
                <FormChips pokemon={charizard} onSelect={noop} />
              ) : null}
            </div>
          </ChipRow>

          <ChipRow
            label="Generation strip · 36px, one line at every width"
            note="A dot marks a generation whose board differs from today. The strip never wraps: its chips share the width, from 36px down to about 25 on a 320px phone."
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

          {/* The real `FilterChip`, not a copy. A specimen page makes copies
              feel legitimate, so the rule here is that a specimen is a real use
              of the component. */}
          <ChipRow
            label="Filter chips · 36px, with a colour dot and a dismiss ×"
            note="Selected type chips take the audited TypeBadge pairing. The last pair is the single-select variant, which drops the × because nothing there can be dismissed."
          >
            <div className="flex flex-wrap gap-1.5">
              <FilterChip label={capitalize(t1)} color={t1} onClick={noop} />
              <FilterChip
                label={capitalize(t2)}
                color={t2}
                active
                onClick={noop}
              />
              <FilterChip label="Gen 5" onClick={noop} />
              <FilterChip label="Gen 6" active onClick={noop} />
              <FilterChip label="Speed" removable={false} onClick={noop} />
              <FilterChip label="Any" active removable={false} onClick={noop} />
            </div>
          </ChipRow>

          <ChipRow
            label="Filter chips as tiles · 44px, three even columns"
            note="A phone's type picker, where choosing a type is the page's main action. The same states: a dot, a fill and its ×, and dimmed once two are chosen."
          >
            <div className="max-w-sm">
              <ChipGroup label="Defending type" tiles>
                {[t0, t1, t2, t3, t4, t5].map((t, i) => (
                  <FilterChip
                    key={t}
                    label={capitalize(t)}
                    color={t}
                    active={i === 1 || i === 4}
                    unavailable={i !== 1 && i !== 4}
                    onClick={noop}
                    shape="tile"
                  />
                ))}
              </ChipGroup>
            </div>
          </ChipRow>

          <ChipRow
            label="Form and ability chips · md 36px, in a phone's dialog"
            note="The compact chips at the filter chips' height, where a thumb has to hit them."
          >
            {charizard ? (
              <FormChips pokemon={charizard} onSelect={noop} size="md" />
            ) : null}
          </ChipRow>

          <ChipRow
            label="Ability chips · compact, exactly one always selected"
            note="A dot marks an ability that changes type matchups; the icon marks the hidden one."
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
            note="No onSelect ⇒ pills, not buttons: a button that does nothing is worse than a label."
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

      {/* StabChip's four tiers and its corrected state, shown on their own,
          since the FeaturedComparison below only shows whichever the sample
          matchup happens to produce. */}
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
            note="The chart's own answer stays on screen, struck through. The ability is named by the surface, never on the chip."
          >
            <div className="flex flex-col items-start gap-2">
              <div className="flex flex-wrap gap-2">
                <StabChip type={t0} mult={0} baseMult={2} via="levitate" />
                <StabChip type={t1} mult={2} baseMult={1} via="fluffy" />
              </div>
              {/* The real component, not a copy of its markup, which is this
                  page's whole contract. */}
              <StabCaption types={[t2]} via="levitate" />
            </div>
          </ChipRow>

          <ChipRow
            label="sm · Home's three-column head"
            note="Geometry only: the fill, border weight, tier colour, and icon are identical to md."
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

      {/* The real Dialog, opened for real: a sheet for a short choice with the
          page in view above it, and the whole screen for a long task. Both are
          a centred panel from md, so on a desktop they look alike. */}
      <Section title="Dialogs — a sheet and the whole screen">
        <div className="flex max-w-md flex-col gap-6">
          <ChipRow
            label="One modal · a native dialog, a named Close, a footer of touch buttons"
            note="On a phone, a sheet sits along the bottom edge and a full dialog takes the screen; from md, both are a centred panel. Tap the backdrop or press Esc to close."
          >
            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDemo("sheet")}
              >
                Open a sheet
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDemo("full")}
              >
                Open a full dialog
              </Button>
            </div>
          </ChipRow>
        </div>
        <Dialog
          open={demo !== null}
          onClose={() => setDemo(null)}
          title={demo === "full" ? "Full dialog (demo)" : "Sheet (demo)"}
          placement={demo === "full" ? "full" : "sheet"}
          footer={
            <Button
              size="touch"
              onClick={() => setDemo(null)}
              className="ml-auto"
            >
              Done
            </Button>
          }
        >
          <p className="text-body-sm text-secondary">
            {demo === "full"
              ? "A long task, or one with the keyboard up: picking a Pokémon, or a game's setup."
              : "A short choice, with the page still in view above it: an ability, the dex's sort and filters, the type chart's controls."}
          </p>
        </Dialog>
      </Section>

      <Section title="FeaturedComparison — the live comparison board">
        {volcarona && chandelure ? (
          <div className="max-w-2xl">
            <FeaturedComparison p1={volcarona} p2={chandelure} />
          </div>
        ) : (
          <p className="text-body-sm text-tertiary">Data not loaded.</p>
        )}
        <p className="mt-4 text-caption text-tertiary">
          On a phone, the versus board the comparison tool uses, with its
          controls taken away.
        </p>
      </Section>

      <footer className="border-t border-border-subtle py-10 text-caption text-tertiary">
        Style-guide playground · tokens in src/index.css
      </footer>
    </div>
  );
}
