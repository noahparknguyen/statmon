import TypeBadge from "./TypeBadge";
import FormChips from "./FormChips";
import { STAT_ORDER, STAT_LABEL, statPct } from "../lib/stats";
import { typeColorVar } from "../lib/types";
import { artworkFor } from "../lib/pokemon";
import { dexNumberOf } from "../lib/dexTable";

// TCG-inspired card. Artwork is a bold square backdrop bleeding behind the
// stat bars; a scrim keeps them legible. Vertical spec is on an 8pt rhythm and
// is shared with ComparisonCard so all three cards are equal height with
// aligned stat rows: head 56 + body 176 + chips 40 (= 272 top zone),
// stats (pt-2 + 6×h-9 + pb-4 = 240), footer 56 → 568 total.
//
// In a Generation 1 view there are five stat rows, not six — Gen 1 had a single
// Special where the modern schema has Sp. Atk and Sp. Def (D-045) — so the
// stats band is 204 and the card 532. All three cards switch era together, so
// they stay equal height and the mirrored rows stay aligned either way.
//
// Stats, typing and BST come from the era view (lib/eras.js) rather than
// straight off the entry, so the card renders whichever generation is selected.
// `view` is always supplied; `eraView(p, null)` is today's values untouched.
const SCRIM =
  "linear-gradient(180deg, transparent 0%, transparent 38%," +
  " color-mix(in srgb, var(--color-surface) 35%, transparent) 52%," +
  " color-mix(in srgb, var(--color-surface) 80%, transparent) 66%," +
  " var(--color-surface) 90%)";
const shadowText = { textShadow: "0 1px 8px rgba(0,0,0,0.75)" };
const statsShadow = { textShadow: "0 1px 5px rgba(0,0,0,0.75)" };

export default function PokemonCard({ pokemon, view, keys, onSelectForm }) {
  // The empty card takes the board's stat list rather than assuming six, so a
  // half-filled Gen 1 board keeps both cards the same height.
  if (!pokemon) return <EmptyCard keys={keys} />;

  const primary = view.types[0];
  // Alternate forms (Mega/regional/…) share their species' National Dex number
  // — see dexNumberOf, which the dex table needs for every row.
  const dex = dexNumberOf(pokemon);

  return (
    <div className="relative flex flex-col overflow-hidden bg-surface border border-border-subtle rounded-lg">
      {/* Decorative: the <h2> below carries the same name, so alt text here
          only makes a screen reader announce it twice. */}
      <img
        src={artworkFor(pokemon)}
        alt=""
        loading="lazy"
        className="pointer-events-none absolute inset-x-0 top-7 z-0 w-full aspect-square object-contain drop-shadow-art"
      />
      <div
        className="pointer-events-none absolute inset-0 z-1"
        style={{ background: SCRIM }}
      />

      <div className="relative z-2 flex flex-col">
        {/* Head */}
        <div className="h-14 flex items-start justify-between gap-3 px-4 pt-4">
          <div className="min-w-0">
            <h2 className="text-h3 truncate" style={shadowText}>
              {pokemon.name}
            </h2>
            <div
              className="text-caption text-secondary mt-0.5"
              style={shadowText}
            >
              #{String(dex).padStart(4, "0")}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {view.types.map((t) => (
              <TypeBadge key={t} type={t} />
            ))}
          </div>
        </div>

        {/* Body — the boldest part of the artwork shows here */}
        <div className="h-44" />

        {/* Form chips */}
        <div className="h-10 flex items-end justify-center px-3">
          <FormChips pokemon={pokemon} onSelect={onSelectForm} />
        </div>

        {/* Stats over the lower artwork */}
        <div className="px-4 pt-2 pb-4" style={statsShadow}>
          {view.keys.map((k) => (
            <div
              key={k}
              className="grid grid-cols-[2rem_1fr_2.5rem] items-center gap-3 h-9"
            >
              <span className="text-overline text-secondary">
                {STAT_LABEL[k]}
              </span>
              <div className="h-2 rounded-full bg-track-glass overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: statPct(view.stats[k]),
                    backgroundColor: typeColorVar(primary),
                  }}
                />
              </div>
              <span className="text-stat text-primary text-right">
                {view.stats[k]}
              </span>
            </div>
          ))}
        </div>

        {/* BST */}
        <div className="h-14 mx-4 flex items-center justify-between border-t border-border-subtle">
          <span className="text-overline text-tertiary">Base stat total</span>
          <span className="text-stat-lg text-primary">{view.bst}</span>
        </div>
      </div>
    </div>
  );
}

function EmptyCard({ keys = STAT_ORDER }) {
  return (
    <div className="flex flex-col overflow-hidden bg-surface border border-dashed border-border-subtle rounded-lg">
      <div className="h-14" />
      <div className="h-44 flex items-center justify-center">
        <span className="text-body-sm text-tertiary">No Pokémon selected</span>
      </div>
      <div className="h-10" />
      <div className="px-4 pt-2 pb-4">
        {keys.map((k) => (
          <div
            key={k}
            className="grid grid-cols-[2rem_1fr_2.5rem] items-center gap-3 h-9"
          >
            <span className="text-overline text-tertiary">{STAT_LABEL[k]}</span>
            <div className="h-2 rounded-full bg-elevated" />
            <span className="text-stat text-tertiary text-right">–</span>
          </div>
        ))}
      </div>
      <div className="h-14 mx-4 flex items-center justify-between border-t border-border-subtle">
        <span className="text-overline text-tertiary">Base stat total</span>
        <span className="text-stat-lg text-tertiary">–</span>
      </div>
    </div>
  );
}
