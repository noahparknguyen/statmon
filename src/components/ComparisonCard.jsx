import { STAT_LABEL } from "../lib/stats";
import { stabMatchup } from "../lib/typeChart";
import StabChip, { StabCaption, StabLabel } from "./StabChip";
import CmpRow from "./CmpRow";
import SpeedBanner from "./SpeedBanner";

// The comparison card in the middle of the desktop board, from `md` up. A
// phone gets `VersusBoard` instead, which reuses this card's two verdicts,
// `Summary` and `TypeMatchup`, exported below. Its heights match
// PokemonCard's on an 8px rhythm: a 320px top zone (head 56 + controls 88 +
// portrait 176) so the mirrored stat rows line up, then stats 240 (pt-2 +
// 6 × h-9 + pb-4) and the speed banner 56, for 616 in all. A Gen 1 view has
// five rows and 580, and all three cards switch together. The top zone is one
// number in three files that have to agree, which is why each writes the
// arithmetic down.
// P1 attacks and P2 defends.
// Spacing follows the proximity rule: tight within a group, wide between
// groups. The mirrored stat rows and the speed banner are shared with Home's
// FeaturedComparison (CmpRow and SpeedBanner), so the two boards can't drift.
//
// `v1` and `v2` are the era views of p1 and p2 (lib/eras.js), with the stats,
// typing, and BST to show, while p1 and p2 are the Pokémon behind them. `keys`
// is the board's stat list, passed in rather than read from a view so an empty
// card keeps the same height as the cards beside it. `ability` is P2's, the
// only one that can change what this card says.

export default function ComparisonCard({ p1, p2, v1, v2, keys, ability }) {
  const ready = p1 && p2;

  // What the bars show, as a string. Changing a Pokémon, swapping, or changing
  // the generation all change it; choosing an ability doesn't.
  const barKey = ready
    ? keys.map((k) => `${v1.stats[k]}/${v2.stats[k]}`).join(",")
    : "empty";

  return (
    <div className="flex flex-col overflow-hidden bg-surface border border-border-subtle rounded-lg">
      <h2 className="sr-only">Comparison</h2>
      {/* Top zone: the BST summary and the type matchup, with generous space
          between the two groups, in a fixed 320px that matches PokemonCard's
          top zone, so the mirrored stat rows line up across the board. */}
      <div className="flex h-80 flex-col items-center justify-center gap-6 px-4 text-center overflow-hidden">
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

      {/* Stats: mirrored bars and the difference between them. */}
      {/* The bars grow in, and `barKey` makes them do it again. A CSS
          animation runs when an element mounts, so re-running it needs a new
          element: keying this wrapper remounts the rows inside it.

          The key is the numbers, not the Pokémon or a counter, so the bars
          re-grow exactly when they'd move, and not when something that doesn't
          touch them changes. Picking an ability re-renders this card for the
          type chips above, but leaves the stats, and so the bars, alone.
          Reduced motion is handled site-wide, by the rule in index.css that
          shortens every animation. */}
      <div key={barKey}>
        {/* `px-4`, the padding every band on every card takes, so the board's
            three stats bands start at the same inset. */}
        <div className="px-4 pt-2 pb-4">
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
      </div>

      {/* The speed verdict, as a full-width banner. */}
      {ready ? (
        <SpeedBanner p1={p1} p2={p2} a={v1.stats.speed} b={v2.stats.speed} />
      ) : (
        <div className="h-14 border-t border-border-subtle" />
      )}
    </div>
  );
}

export function Summary({ p1, p2, v1, v2 }) {
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

// The attacker's same-type-bonus types against the defender, scored on the
// chart of the selected generation (in Gen 1: no Dark, Steel, or Fairy, Bug
// hitting Poison for 2×, and Ghost doing nothing to Psychic), then through the
// defender's ability, which has the last word: Ground is 2× into an Electric
// type, and 0× into one with Levitate.
//
// Only the defender's ability counts. This card shows one direction, and Swap
// reverses it, so the attacker's ability stays on its own card until the board
// turns around.
export function TypeMatchup({ attacker, attack, defend, ability }) {
  const stab = stabMatchup(attack, defend, attack.gen, ability);
  // Named only when it changed a number. A Levitate that changed nothing about
  // this matchup isn't worth announcing, and `via` already tests exactly that
  // (lib/typeChart), so nothing is worked out again here.
  const changedBy = stab.find((s) => s.via)?.via ?? null;
  return (
    <div className="flex flex-col items-center gap-2.5 w-full">
      <StabLabel>{attacker.name}&apos;s STAB</StabLabel>
      {/* A centred, wrapping row of content-sized pills. The row does the
          layout, so the chips never stretch: at 320px they wrap to two rows by
          themselves, and from about 400px they fit on one. */}
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
      {/* The caption gives the context the chips are read against: what's
          being attacked, and, once rather than per chip, the ability that
          changed the answer. Shared with /style, so the two can't drift. */}
      <StabCaption types={defend.types} via={changedBy} />
    </div>
  );
}
