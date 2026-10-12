import ChipGroup from "./ChipGroup";
import FilterChip from "./FilterChip";
import GameSetup from "./GameSetup";
import GenerationStrip from "./GenerationStrip";
import { RULE_BELOW } from "./pageChrome";
import { allGenerations } from "../lib/eras";
import { generationsFor, typesFor } from "../lib/dexTable";
import {
  CONTENDER_COUNTS,
  SMALL_POOL,
  defaultSettings,
  poolFor,
  setAsOf,
  statName,
  statsFor,
  toggleGen,
  toggleStat,
  toggleType,
} from "../lib/games";
import { capitalize } from "../lib/types";

// The stat game's half of the setup panel: its groups and its status line, and
// nothing about how a dialogue behaves.
//
// The generation leads, above a divider, as in `DexFilters`: it decides what
// every group below it can offer. A Gen 1 game has five stats with a single
// Special, no Fairy chip, and no later origins. Reading top to bottom follows
// the dependency.
export default function HigherSetup({ draft, onChange, ...shell }) {
  const pool = draft ? poolFor(draft) : [];
  const playable = draft ? pool.length >= draft.n : false;

  return (
    <GameSetup
      game="higher"
      topicLabel={statName}
      open={draft != null}
      onReset={() => onChange(defaultSettings())}
      playable={playable}
      status={
        draft && (
          <>
            {pool.length === 0
              ? "No Pokémon match"
              : `${pool.length.toLocaleString()} Pokémon`}
            {pool.length > 0 && !playable && ` · not enough for ${draft.n}`}
            {playable && pool.length < SMALL_POOL && " · rounds will repeat"}
          </>
        )
      }
      {...shell}
    >
      {draft && (
        <>
          {/* A divider sits 16px from what it divides on both sides: this
              padding above it, the body's gap below. */}
          <div className={RULE_BELOW}>
            <GenerationStrip
              label="Stats as of"
              options={allGenerations()}
              asof={draft.asof}
              // Through `setAsOf`, which re-reads every group against the new
              // generation: a Sp. Atk game becomes a Special game in Gen 1, and
              // a Fairy filter is dropped rather than left to match nothing.
              onSelect={(next) => onChange(setAsOf(draft, next))}
            />
          </div>

          <ChipGroup label="Contenders">
            {CONTENDER_COUNTS.map((count) => (
              <FilterChip
                key={count}
                active={count === draft.n}
                removable={false}
                label={String(count)}
                onClick={() => onChange({ ...draft, n: count })}
              />
            ))}
          </ChipGroup>

          {/* The one group that doesn't follow the dex's rule that empty means
              no constraint, on purpose: these are the questions, not a filter
              over something visible. "Ask me about nothing" isn't a game, so
              every chip starts lit and the last one can't be turned off. The
              labels carry the difference: "Ask me about" reads as the rules,
              and "Introduced in" and "Types" read as filters. */}
          <ChipGroup label="Ask me about">
            {statsFor(draft.asof).map((stat) => (
              <FilterChip
                key={stat}
                active={draft.stats.includes(stat)}
                removable={false}
                label={statName(stat)}
                onClick={() => onChange(toggleStat(draft, stat))}
              />
            ))}
          </ChipGroup>

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

          <ChipGroup label="Types" hint="leave empty for all">
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

          <ChipGroup label="Options">
            {/* "Hide alternate forms", lit when they're hidden: the dex's exact
                  wording and polarity. Every other `FilterChip` on the site is
                  lit when it narrows something, and hiding 234 entries is a
                  narrowing. */}
            <FilterChip
              active={!draft.includeForms}
              label="Hide alternate forms"
              onClick={() =>
                onChange({ ...draft, includeForms: !draft.includeForms })
              }
            />
          </ChipGroup>
        </>
      )}
    </GameSetup>
  );
}
