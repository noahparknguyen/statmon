import TypeBadge from "./TypeBadge";
import FormChips from "./FormChips";
import { STAT_ORDER, STAT_LABEL, statPct } from "../lib/stats";
import { typeColorVar } from "../lib/types";
import { artworkFor, formsOf } from "../lib/pokemon";

// TCG-inspired card. Artwork is a bold square backdrop bleeding behind the
// stat bars; a scrim keeps them legible. Vertical spec is on an 8pt rhythm and
// is shared with ComparisonCard so all three cards are equal height with
// aligned stat rows: head 56 + body 176 + chips 40 (= 272 top zone),
// stats (pt-2 + 6×h-9 + pb-4 = 240), footer 56 → 568 total.
const SCRIM =
  "linear-gradient(180deg, transparent 0%, transparent 38%," +
  " color-mix(in srgb, var(--color-surface) 35%, transparent) 52%," +
  " color-mix(in srgb, var(--color-surface) 80%, transparent) 66%," +
  " var(--color-surface) 90%)";
const artFilter = { filter: "drop-shadow(0 8px 22px rgba(0,0,0,0.5))" };
const shadowText = { textShadow: "0 1px 8px rgba(0,0,0,0.75)" };
const statsShadow = { textShadow: "0 1px 5px rgba(0,0,0,0.75)" };

export default function PokemonCard({ pokemon, onSelectForm }) {
  if (!pokemon) return <EmptyCard />;

  const primary = pokemon.types[0];
  // Alternate forms (Mega/regional/…) share their species' National Dex number.
  // Form entries have synthetic ids > 10000, so read the dex from the default
  // form in the group (its id is the dex number).
  const dex = (formsOf(pokemon).find((f) => f.isDefault) ?? pokemon).id;

  return (
    <div className="relative flex flex-col overflow-hidden bg-surface border border-border-subtle rounded-lg">
      <img
        src={artworkFor(pokemon)}
        alt={pokemon.name}
        loading="lazy"
        className="pointer-events-none absolute inset-x-0 top-7 z-0 w-full aspect-square object-contain"
        style={artFilter}
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
            {pokemon.types.map((t) => (
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
          {STAT_ORDER.map((k) => (
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
                    width: statPct(pokemon.stats[k]),
                    backgroundColor: typeColorVar(primary),
                  }}
                />
              </div>
              <span className="text-stat text-primary text-right">
                {pokemon.stats[k]}
              </span>
            </div>
          ))}
        </div>

        {/* BST */}
        <div className="h-14 mx-4 flex items-center justify-between border-t border-border-subtle">
          <span className="text-overline text-tertiary">Base Stat Total</span>
          <span className="text-stat-lg text-primary">{pokemon.bst}</span>
        </div>
      </div>
    </div>
  );
}

function EmptyCard() {
  return (
    <div className="flex flex-col overflow-hidden bg-surface border border-dashed border-border-subtle rounded-lg">
      <div className="h-14" />
      <div className="h-44 flex items-center justify-center">
        <span className="text-body-sm text-tertiary">No Pokémon selected</span>
      </div>
      <div className="h-10" />
      <div className="px-4 pt-2 pb-4">
        {STAT_ORDER.map((k) => (
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
        <span className="text-overline text-tertiary">Base Stat Total</span>
        <span className="text-stat-lg text-tertiary">–</span>
      </div>
    </div>
  );
}
