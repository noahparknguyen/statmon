// Style-guide playground — the living reference for the design system, at the
// /style route. It renders the REAL tokens and components (not hand-rolled
// copies) so it can never drift from the app: swatches read CSS vars, badges use
// <TypeBadge>, and the sample comparison is the actual <FeaturedComparison>.
// See docs/06_style_guide.md (tokens) and docs/04_design.md (rationale).

import TypeBadge from "../components/TypeBadge";
import StatBar from "../components/StatBar";
import FeaturedComparison from "../components/FeaturedComparison";
import SearchBar from "../components/SearchBar";
import FormChips from "../components/FormChips";
import { getBySlug } from "../lib/pokemon";
import { STAT_ORDER, STAT_LABEL } from "../lib/stats";

const noop = () => {};

// Literal `rounded-*` strings so Tailwind's scanner keeps the utilities.
const RADII = [
  ["rounded-xs", "xs · 4"],
  ["rounded-sm", "sm · 6"],
  ["rounded-md", "md · 10"],
  ["rounded-lg", "lg · 16"],
  ["rounded-xl", "xl · 24"],
  ["rounded-full", "full · pill"],
];

// [label, CSS var (live color), hex (documentation), note]
const NEUTRALS = [
  ["base", "--color-base", "#0B0C0F", "page background"],
  ["surface", "--color-surface", "#14161B", "cards / surfaces"],
  ["elevated", "--color-elevated", "#1C1F27", "elevated / inputs / tracks"],
  ["border-subtle", "--color-border-subtle", "#2A2E37", "default border"],
  ["border-strong", "--color-border-strong", "#3A3F4B", "hover/focus border"],
  ["tertiary", "--color-tertiary", "#8A909C", "hints, captions, overlines"],
  ["secondary", "--color-secondary", "#A8AEBA", "labels, secondary text"],
  ["primary", "--color-primary", "#F4F5F7", "headings, values, body"],
];

const ACCENTS = [
  ["accent-core", "--color-accent-core", "#7352E6", "flame core"],
  ["accent", "--color-accent", "#9AA0E8", "actions, links, focus"],
  ["accent-hover", "--color-accent-hover", "#B3B8F0", "hover / active"],
  ["accent-blue", "--color-accent-blue", "#A8C3DD", "flame blue"],
];

const TYPES = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
];

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
  ["text-stat", "1234567890 — stat value (tabular)", "18 · 600"],
  ["text-button", "Button label", "14 · 600"],
];

function Section({ title, children }) {
  return (
    <section className="border-t border-border-subtle py-10">
      <h2 className="text-overline text-tertiary mb-6">{title}</h2>
      {children}
    </section>
  );
}

function Swatch({ label, cssVar, hex, note }) {
  return (
    <div className="w-32">
      <div
        className="h-12 rounded-md border border-border-subtle"
        style={{ backgroundColor: `var(${cssVar})` }}
      />
      <div className="mt-2">
        <div className="text-caption text-secondary">{label}</div>
        <div className="text-caption text-tertiary">{hex}</div>
        {note ? <div className="text-caption text-tertiary">{note}</div> : null}
      </div>
    </div>
  );
}

export default function StyleGuide() {
  const volcarona = getBySlug("volcarona");
  const chandelure = getBySlug("chandelure");
  const charizard = getBySlug("charizard"); // has Mega forms → FormChips demo

  return (
    <div className="max-w-content mx-auto px-6 py-10">
      <header className="pb-8">
        <h1 className="text-display">
          Style guide<span className="text-accent">.</span>
        </h1>
        <p className="text-body text-secondary mt-2">
          Every color, text style, and core component — rendered from the live
          tokens and real components, so this page can't drift from the app.
        </p>
      </header>

      <Section title="Core palette">
        <div className="flex flex-wrap gap-3">
          {NEUTRALS.map(([l, v, h, n]) => (
            <Swatch key={l} label={l} cssVar={v} hex={h} note={n} />
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-6">
          {ACCENTS.map(([l, v, h, n]) => (
            <Swatch key={l} label={l} cssVar={v} hex={h} note={n} />
          ))}
          <div className="w-32">
            <div className="h-12 rounded-md bg-flame border border-border-subtle" />
            <div className="mt-2 text-caption text-secondary">flame</div>
            <div className="text-caption text-tertiary">
              gradient · BST delta + speed banner only
            </div>
          </div>
        </div>
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
        <div className="flex flex-col gap-5">
          {TEXT_STYLES.map(([cls, sample, spec]) => (
            <div
              key={cls}
              className="grid grid-cols-[1fr_auto] items-baseline gap-4 border-b border-border-subtle pb-4"
            >
              <div className={cls}>{sample}</div>
              <div className="text-caption text-tertiary text-right whitespace-nowrap">
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
            <button
              type="button"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-accent text-accent-contrast text-button transition-colors hover:bg-accent-hover"
            >
              Primary action
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-elevated border border-border-subtle text-secondary text-button transition-colors hover:text-primary hover:border-border-strong"
            >
              Secondary
            </button>
          </div>
          {charizard ? <FormChips pokemon={charizard} onSelect={noop} /> : null}
        </div>
      </Section>

      <Section title="StatBar — reusable stat row">
        <div className="bg-surface border border-border-subtle rounded-lg p-6 max-w-md">
          {volcarona ? (
            STAT_ORDER.map((k) => (
              <StatBar
                key={k}
                label={STAT_LABEL[k]}
                value={volcarona.stats[k]}
                colorType={volcarona.types[0]}
              />
            ))
          ) : (
            <p className="text-body-sm text-tertiary">Data not loaded.</p>
          )}
        </div>
        <p className="text-caption text-tertiary mt-4">
          Bars scale to a fixed max of 255 (D-011); colored by the primary type.
          Kept for the future full-dex stats table.
        </p>
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
