import { STAT_LABEL } from "../lib/stats";
import { stabMatchup } from "../lib/typeChart";
import CmpStatCard from "./CmpStatCard";
import StabChip, { StabCaption, StabLabel } from "./StabChip";
import CmpRow from "./CmpRow";
import SpeedBanner from "./SpeedBanner";

// Center comparison card. Vertical spec matches PokemonCard on an 8pt rhythm:
// top zone 320 (= head 56 + controls 88 + body 176) so the mirrored
// stat rows line up, stats (pt-2 + 6×h-9 + pb-4 = 240), footer 56 → 616 total
// — or five rows and 580 in a Generation 1 view, which all three cards switch
// to together (D-045). The top zone grew by the 48 the ability band added to
// the cards beside it (D-073); it is one number in three files and they have
// to agree, which is why each of them writes the arithmetic down.
// P1 attacker, P2 defender.
// Spacing follows the proximity rule: tight gaps inside a group, wide between.
// The mirrored stat rows and the speed banner are shared with Home's
// FeaturedComparison (CmpRow / SpeedBanner) so the two boards cannot drift.
//
// `v1`/`v2` are the era views of p1/p2 (lib/eras.js) — the stats, typing and
// BST to render — while p1/p2 remain the identities behind them. `keys` is the
// board's stat list, passed in rather than read off a view so the empty state
// keeps the same height as the cards beside it. `ability` is P2's, the only one
// that can change what this card says.

export default function ComparisonCard({ p1, p2, v1, v2, keys, ability }) {
  const ready = p1 && p2;

  // What the bars are showing, as a string. Changing selection, swapping, or
  // moving the generation lens all change it; choosing an ability does not.
  const barKey = ready
    ? keys.map((k) => `${v1.stats[k]}/${v2.stats[k]}`).join(",")
    : "empty";

  return (
    <div className="flex flex-col overflow-hidden bg-surface border border-border-subtle rounded-lg">
      <h2 className="sr-only">Comparison</h2>
      {/* Top zone: BST summary + type matchup (groups separated generously) */}
      {/* Fixed height only from md, where it has to match PokemonCard's top
          zone so the mirrored stat rows line up. Below md the three cards are
          stacked and nothing aligns, so a fixed height there is pure dead space
          — and it was: the ability band pushed this to 320px against about 250
          of content, leaving a ~70px hole above the stats on a phone. That is
          the metric D-057 exists to protect (it took /compare from 2,727px to
          2,343px), so the 48px this feature added is given back where it buys
          nothing. */}
      <div className="flex flex-col items-center justify-center gap-6 px-4 py-6 text-center overflow-hidden md:h-80 md:py-0">
        {ready ? (
          <>
            <Summary p1={p1} p2={p2} v1={v1} v2={v2} />
            <div className="w-full border-t border-border-subtle" />
            <TypeMatchup
              attacker={p1}
              attack={v1}
              defend={v2}
              ability={ability}
            />
          </>
        ) : (
          <span className="text-body-sm text-tertiary">
            Pick two Pokémon to compare.
          </span>
        )}
      </div>

      {/* Stats: mirrored bars + centered difference (≥768px, D-010) */}
      {/* **The bars grow in, and `barKey` is what makes them do it again**
          (D-124). Home's board has animated since D-023 and the tool's never
          did — the last of D-043's "partially shipped" items. A CSS animation
          runs on mount, so re-running it needs the element to be new: keying
          this wrapper remounts the six rows inside it.

          The key is the NUMBERS, not the slugs or a counter. That is the exact
          condition worth animating on — the bars re-grow when they would move,
          and not when something that does not touch them changes. Picking an
          ability re-renders this card (it re-scores the STAB chips above) and
          leaves the stats alone, so it leaves the bars alone too.

          Both surfaces, because below `md` the per-stat cards are the ONLY
          stats surface (D-057); animating one and not the other would make the
          phone the odd one out. Reduced motion is handled globally by the rule
          that collapses animation duration (index.css). */}
      <div key={barKey}>
        <div className="hidden md:block px-3 pt-2 pb-4">
          {keys.map((k) => (
            <CmpRow
              key={k}
              label={STAT_LABEL[k]}
              a={ready ? v1.stats[k] : null}
              b={ready ? v2.stats[k] : null}
              aColor={ready ? v1.types[0] : null}
              bColor={ready ? v2.types[0] : null}
              animate
            />
          ))}
        </div>

        {/* Stats: per-stat cards (<768px, D-010) */}
        <div className="md:hidden flex flex-col gap-2 px-3 pt-2 pb-4">
          {keys.map((k) => (
            <CmpStatCard
              key={k}
              label={STAT_LABEL[k]}
              a={ready ? v1.stats[k] : null}
              b={ready ? v2.stats[k] : null}
              aName={ready ? p1.name : null}
              bName={ready ? p2.name : null}
              aColor={ready ? v1.types[0] : null}
              bColor={ready ? v2.types[0] : null}
              animate
            />
          ))}
        </div>
      </div>

      {/* Speed verdict — full-width banner */}
      {ready ? (
        <SpeedBanner p1={p1} p2={p2} a={v1.stats.speed} b={v2.stats.speed} />
      ) : (
        <div className="h-14 border-t border-border-subtle" />
      )}
    </div>
  );
}

function Summary({ p1, p2, v1, v2 }) {
  const delta = v1.bst - v2.bst;
  if (delta === 0) {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-overline text-tertiary">Base stat total</span>
        <span className="text-numeral-lg">Tied</span>
        <span className="text-body-sm text-secondary">Both {v1.bst}</span>
      </div>
    );
  }
  const leader = delta > 0 ? p1 : p2;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-overline text-tertiary">Higher total</span>
      <span className="text-numeral-xl bg-flame bg-clip-text text-transparent">
        +{Math.abs(delta)}
      </span>
      <span className="text-body-sm text-secondary">
        <span className="font-display font-semibold text-primary">
          {leader.name}
        </span>
        {" · "}
        {v1.bst} vs {v2.bst}
      </span>
    </div>
  );
}

// The attacker's STAB into the defender, scored on the chart in force in the
// selected era (D-045) — in Gen 1 that means no Dark, Steel or Fairy, Bug
// hitting Poison for 2×, and Ghost doing nothing to Psychic — and then through
// the DEFENDER's ability (D-073), which is the last word: Ground is 2× into an
// Electric type and 0× into one with Levitate.
//
// The ability is the defender's alone. This card shows one direction and Swap
// flips it, so the attacker's ability is on its own card as identity and starts
// mattering the moment the board turns around.
function TypeMatchup({ attacker, attack, defend, ability }) {
  const stab = stabMatchup(attack, defend, attack.gen, ability);
  // Named only when it actually moved a number. A Levitate that changed nothing
  // about this matchup is not something to advertise as if it had — `via` is
  // already exactly that test (lib/typeChart), so nothing is recomputed here.
  const changedBy = stab.find((s) => s.via)?.via ?? null;
  return (
    <div className="flex flex-col items-center gap-2.5 w-full">
      <StabLabel>{attacker.name}&apos;s STAB</StabLabel>
      {/* A centred wrapping row of content-sized pills, rather than a stacked
          list of full-width bars (D-079). The group does the layout, so the
          chips never stretch — at 320px they wrap to two rows on their own and
          from about 400px they sit on one. */}
      <div className="flex flex-wrap justify-center gap-2">
        {stab.map(({ type, mult, baseMult, via }) => (
          <StabChip
            key={type}
            type={type}
            mult={mult}
            baseMult={baseMult}
            via={via}
          />
        ))}
      </div>
      {/* The caption states the context the chips are read against: what is
          being attacked, and — once, not per chip — the ability that bent the
          answer. Shared with /style so the two cannot drift (D-090). */}
      <StabCaption types={defend.types} via={changedBy} />
    </div>
  );
}
