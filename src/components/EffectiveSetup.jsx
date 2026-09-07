import ChipGroup from "./ChipGroup";
import FilterChip from "./FilterChip";
import GameSetup from "./GameSetup";
import GenerationStrip from "./GenerationStrip";
import { allGenerations } from "../lib/eras";
import { generationsFor, typesFor } from "../lib/dexTable";
import {
  DEFAULT_SETTINGS,
  TIERS,
  TIER_DESC,
  TIER_LABEL,
  answersFor,
  canPlay,
  defendersFor,
  setAsOf,
  setTier,
  toggleGen,
  toggleType,
  usesPool,
} from "../lib/effective";
import { formatMult } from "../lib/typeChart";
import { capitalize } from "../lib/types";

// The type game's half of the setup panel (D-104).
//
// **The pool groups exist only in Hard**, because only Hard draws from the dex.
// In Easy and Medium the defender is a typing, so a generation filter and a
// forms toggle would be controls that do nothing — and the URL does not carry
// them there either, which is what keeps one canonical link per game.
//
// **Types is the one filter that means something in all three**, and it means
// the same thing in each: the defending typing contains at least one of these.
// In Easy that picks the defender outright, in Medium it requires a pairing to
// include it, and in Hard it is `filterRows`' own type filter.
export default function EffectiveSetup({ draft, onChange, ...shell }) {
  const playable = draft ? canPlay(draft) : false;
  const answers = draft ? answersFor(draft) : [];
  const defenders = draft ? defendersFor(draft).length : 0;

  return (
    <GameSetup
      game="effective"
      topicLabel={capitalize}
      open={draft != null}
      onReset={() => onChange(DEFAULT_SETTINGS)}
      playable={playable}
      status={
        draft && (
          <>
            {defenders === 0
              ? "Nothing to attack"
              : `${answers.length} answers · ${defenders.toLocaleString()} defenders`}
            {defenders > 0 && !playable && " · not enough to make a question"}
          </>
        )
      }
      {...shell}
    >
      {draft && (
        <>
          <div className="border-b border-border-subtle pb-5">
            {/* The lens matters more here than anywhere on the site: the chart
                itself has changed six times, so a Gen 1 game is the 15×15 grid
                where Ghost does nothing to Psychic (D-047). */}
            <GenerationStrip
              label="Chart as of"
              options={allGenerations()}
              asof={draft.asof}
              onSelect={(next) => onChange(setAsOf(draft, next))}
            />
          </div>

          <ChipGroup label="Difficulty">
            {TIERS.map((tier) => (
              <FilterChip
                key={tier}
                active={tier === draft.tier}
                removable={false}
                label={TIER_LABEL[tier]}
                onClick={() => onChange(setTier(draft, tier))}
              />
            ))}
          </ChipGroup>

          {/* One at a time, so the selected one can explain itself. A chip
              cannot carry a sentence and "Medium" does not explain itself. */}
          <p className="-mt-3 text-body-sm text-secondary">
            {TIER_DESC[draft.tier]}
          </p>

          <ChipGroup label="Defending types" hint="leave empty for all">
            {typesFor(draft.asof).map((type) => (
              <FilterChip
                key={type}
                active={draft.types.includes(type)}
                label={capitalize(type)}
                color={type}
                onClick={() => onChange(toggleType(draft, type))}
              />
            ))}
          </ChipGroup>

          {usesPool(draft.tier) && (
            <>
              <ChipGroup label="Introduced in" hint="leave empty for all">
                {generationsFor(draft.asof).map((gen) => (
                  <FilterChip
                    key={gen}
                    active={draft.gens.includes(gen)}
                    label={`Gen ${gen}`}
                    onClick={() => onChange(toggleGen(draft, gen))}
                  />
                ))}
              </ChipGroup>

              <ChipGroup label="Options">
                <FilterChip
                  active={draft.includeForms}
                  label="Alternate forms"
                  onClick={() =>
                    onChange({ ...draft, includeForms: !draft.includeForms })
                  }
                />
              </ChipGroup>
            </>
          )}

          {/* What you will be asked to choose between. It is the clearest
              statement of what a tier actually IS — Easy has four answers and
              Medium six — and it is the thing the filters can quietly destroy,
              so it is on screen while you set them. */}
          <ChipGroup label="Answers you will choose from">
            {answers.map((m) => (
              <span
                key={m}
                className="text-badge inline-flex min-h-9 items-center rounded-full border border-border-strong bg-elevated px-3 text-secondary"
              >
                {formatMult(m)}
              </span>
            ))}
          </ChipGroup>
        </>
      )}
    </GameSetup>
  );
}
