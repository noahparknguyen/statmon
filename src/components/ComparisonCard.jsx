import { LuChevronsUp, LuChevronsDown, LuMinus, LuBan } from "react-icons/lu";
import { STAT_LABEL } from "../lib/stats";
import { typeColorVar, capitalize } from "../lib/types";
import { stabMatchup, formatMult } from "../lib/typeChart";
import CmpStatCard from "./CmpStatCard";
import CmpRow from "./CmpRow";
import SpeedBanner from "./SpeedBanner";

// Center comparison card. Vertical spec matches PokemonCard on an 8pt rhythm:
// top zone 272 (= head+body+chips) so the mirrored stat rows line up, stats
// (pt-2 + 6×h-9 + pb-4 = 240), footer 56 → 568 total — or five rows and 532
// in a Generation 1 view, which all three cards switch to together (D-045).
// P1 attacker, P2 defender.
// Spacing follows the proximity rule: tight gaps inside a group, wide between.
// The mirrored stat rows and the speed banner are shared with Home's
// FeaturedComparison (CmpRow / SpeedBanner) so the two boards cannot drift.
//
// `v1`/`v2` are the era views of p1/p2 (lib/eras.js) — the stats, typing and
// BST to render — while p1/p2 remain the identities behind them. `keys` is the
// board's stat list, passed in rather than read off a view so the empty state
// keeps the same height as the cards beside it.

export default function ComparisonCard({ p1, p2, v1, v2, keys }) {
  const ready = p1 && p2;

  return (
    <div className="flex flex-col overflow-hidden bg-surface border border-border-subtle rounded-lg">
      <h2 className="sr-only">Comparison</h2>
      {/* Top zone: BST summary + type matchup (groups separated generously) */}
      <div className="h-68 flex flex-col items-center justify-center gap-4 px-4 text-center overflow-hidden">
        {ready ? (
          <>
            <Summary p1={p1} p2={p2} v1={v1} v2={v2} />
            <div className="w-full border-t border-border-subtle" />
            <TypeMatchup attacker={p1} attack={v1} defend={v2} />
          </>
        ) : (
          <span className="text-body-sm text-tertiary">
            Pick two Pokémon to compare.
          </span>
        )}
      </div>

      {/* Stats: mirrored bars + centered difference (≥768px, D-010) */}
      <div className="hidden md:block px-3 pt-2 pb-4">
        {keys.map((k) => (
          <CmpRow
            key={k}
            label={STAT_LABEL[k]}
            a={ready ? v1.stats[k] : null}
            b={ready ? v2.stats[k] : null}
            aColor={ready ? v1.types[0] : null}
            bColor={ready ? v2.types[0] : null}
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
          />
        ))}
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

// Effectiveness tier → icon, text color, and border strength for the chip.
function tier(mult) {
  if (mult === 0) return { Icon: LuBan, color: "text-tertiary", border: 28 };
  if (mult >= 2)
    return { Icon: LuChevronsUp, color: "text-primary", border: 55 };
  if (mult < 1)
    return { Icon: LuChevronsDown, color: "text-tertiary", border: 28 };
  return { Icon: LuMinus, color: "text-secondary", border: 30 };
}

function EffChip({ type, mult }) {
  const { Icon, color, border } = tier(mult);
  const tc = typeColorVar(type);
  return (
    <div
      className="flex items-center justify-between gap-2 w-full px-3 py-2 rounded-md"
      style={{
        backgroundColor: `color-mix(in srgb, ${tc} 14%, var(--color-elevated))`,
        border: `1px solid color-mix(in srgb, ${tc} ${border}%, transparent)`,
      }}
    >
      <span className="flex items-center gap-2">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: tc }}
        />
        <span className="text-meta">{capitalize(type)}</span>
      </span>
      <span className={`flex items-center gap-1 ${color}`}>
        <span className="text-diff">{formatMult(mult)}</span>
        <Icon aria-hidden size={14} />
      </span>
    </div>
  );
}

// The attacker's STAB into the defender, scored on the chart in force in the
// selected era (D-045) — in Gen 1 that means no Dark, Steel or Fairy, Bug
// hitting Poison for 2×, and Ghost doing nothing to Psychic.
function TypeMatchup({ attacker, attack, defend }) {
  const stab = stabMatchup(attack, defend, attack.gen);
  return (
    <div className="flex flex-col items-center gap-2.5 w-full">
      <span
        className="text-overline text-tertiary"
        title="Same Type Attack Bonus — damage from moves matching the attacker's own type"
      >
        {attacker.name}&apos;s STAB
      </span>
      <div className="flex flex-col gap-2 w-full">
        {stab.map(({ type, mult }) => (
          <EffChip key={type} type={type} mult={mult} />
        ))}
      </div>
      <span className="text-caption text-tertiary">
        vs{" "}
        <span className="text-secondary">
          {defend.types.map(capitalize).join(" / ")}
        </span>
      </span>
    </div>
  );
}
