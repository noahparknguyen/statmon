import { FaCaretLeft, FaCaretRight } from "react-icons/fa6";
import { LuGauge } from "react-icons/lu";
import TypeBadge from "./TypeBadge";
import CmpStatCard from "./CmpStatCard";
import { STAT_ORDER, STAT_LABEL, statPct } from "../lib/stats";
import { typeColorVar, capitalize } from "../lib/types";
import { spriteFor } from "../lib/pokemon";
import { stabMatchup, formatMult } from "../lib/typeChart";

// The Home hero board: a fixed, non-interactive comparison (Volcarona vs
// Chandelure — the site's pseudo-mascots, D-023). It deliberately reuses the
// comparison tool's visual language — mirrored type-colored bars, type-tinted
// center diffs, the flame "Higher total" delta, and the flame speed banner — so
// Home and the tool read as one site. Bars grow in once on mount for life.
const ROW_COLS = "grid-cols-[1.6rem_1fr_3.25rem_1fr_1.6rem]";

export default function FeaturedComparison({ p1, p2 }) {
  const delta = p1.bst - p2.bst;
  const tied = delta === 0;
  const p1Leads = delta > 0;
  const faster =
    p1.stats.speed === p2.stats.speed
      ? null
      : p1.stats.speed > p2.stats.speed
        ? p1
        : p2;

  return (
    <div className="flex flex-col overflow-hidden bg-surface border border-border-subtle rounded-lg">
      <h2 className="sr-only">
        Example comparison: {p1.name} vs {p2.name}
      </h2>
      {/* Heads — below 768px the sprite+name+badges+STAB grid crushes names to
        a few px, so it stacks (P1 head, STAB, P2 head); unchanged at ≥768px. */}
      <div className="flex flex-col gap-3 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center px-5 py-4 border-b border-border-subtle">
        <MonHead p={p1} />
        <StabCenter attacker={p1} defender={p2} />
        <MonHead p={p2} right />
      </div>

      {/* Mirrored stat rows (≥768px, D-010) */}
      <div className="hidden md:block px-5 pt-3 pb-2">
        {STAT_ORDER.map((k) => (
          <Row
            key={k}
            label={STAT_LABEL[k]}
            a={p1.stats[k]}
            b={p2.stats[k]}
            aColor={p1.types[0]}
            bColor={p2.types[0]}
          />
        ))}
      </div>

      {/* Per-stat cards (<768px, D-010) */}
      <div className="md:hidden flex flex-col gap-2 px-5 pt-3 pb-2">
        {STAT_ORDER.map((k) => (
          <CmpStatCard
            key={k}
            label={STAT_LABEL[k]}
            a={p1.stats[k]}
            b={p2.stats[k]}
            aName={p1.name}
            bName={p2.name}
            aColor={p1.types[0]}
            bColor={p2.types[0]}
          />
        ))}
      </div>

      {/* BST summary */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 py-4 border-t border-border-subtle">
        <span
          className={`text-stat-lg ${p1Leads || tied ? "text-primary" : "text-tertiary"}`}
        >
          {p1.bst}
        </span>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-overline text-tertiary">
            {tied ? "Base stat total" : "Higher total"}
          </span>
          {tied ? (
            <span className="text-2xl font-display font-bold leading-none">
              Tied
            </span>
          ) : (
            <span className="text-3xl font-display font-bold leading-none bg-flame bg-clip-text text-transparent">
              +{Math.abs(delta)}
            </span>
          )}
        </div>
        <span
          className={`text-stat-lg text-right ${!p1Leads || tied ? "text-primary" : "text-tertiary"}`}
        >
          {p2.bst}
        </span>
      </div>

      {/* Speed verdict */}
      <div
        className="h-14 bg-flame flex items-center justify-center gap-2"
        style={{ color: "var(--color-accent-contrast)" }}
      >
        <LuGauge aria-hidden size={19} className="shrink-0" />
        <span className="text-button">
          {faster ? `${faster.name} moves first` : "Same Speed"}
        </span>
      </div>
    </div>
  );
}

function MonHead({ p, right = false }) {
  return (
    <div
      className={`flex items-center justify-center gap-3 min-w-0 md:justify-normal ${right ? "md:flex-row-reverse md:text-right" : ""}`}
    >
      <div className="w-14 h-14 shrink-0 rounded-md bg-elevated overflow-hidden flex items-center justify-center">
        <img
          src={spriteFor(p)}
          alt={p.name}
          loading="lazy"
          className="w-full h-full object-contain [image-rendering:pixelated]"
        />
      </div>
      <div className="min-w-0">
        <div className="text-h4 truncate">{p.name}</div>
        <div className="text-caption text-tertiary">
          #{String(p.id).padStart(4, "0")}
        </div>
        <div className={`flex gap-1.5 mt-1.5 ${right ? "md:justify-end" : ""}`}>
          {p.types.map((t) => (
            <TypeBadge key={t} type={t} size="sm" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Center of the head: the attacker's STAB effectiveness into the defender —
// the one thing the full ComparisonCard shows that this preview otherwise drops.
// (attacker = p1 by convention; the pills match p1's type badges on the left.)
function StabCenter({ attacker, defender }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-overline text-tertiary">STAB</span>
      <div className="flex flex-col gap-1">
        {stabMatchup(attacker, defender).map(({ type, mult }) => (
          <StabPill key={type} type={type} mult={mult} />
        ))}
      </div>
    </div>
  );
}

function StabPill({ type, mult }) {
  const tc = typeColorVar(type);
  return (
    <span
      className="flex items-center gap-1.5 rounded-full px-2 py-0.5"
      style={{
        backgroundColor: `color-mix(in srgb, ${tc} 16%, var(--color-elevated))`,
        border: `1px solid color-mix(in srgb, ${tc} 32%, transparent)`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: tc }}
      />
      <span className="text-caption text-secondary">{capitalize(type)}</span>
      <span className="text-caption font-display text-primary">
        {formatMult(mult)}
      </span>
    </span>
  );
}

function Row({ label, a, b, aColor, bColor }) {
  const aWins = a > b;
  const bWins = b > a;
  return (
    <div className={`grid ${ROW_COLS} items-center gap-1.5 h-9`}>
      <span
        className={`text-diff text-right ${aWins ? "text-primary" : "text-tertiary"}`}
      >
        {a}
      </span>
      <div className="h-1.5 rounded-full bg-elevated overflow-hidden flex justify-end">
        <div
          className="h-full rounded-full animate-grow-w"
          style={{
            "--target": statPct(a),
            backgroundColor: typeColorVar(aColor),
          }}
        />
      </div>
      <DiffCell label={label} d={a - b} aColor={aColor} bColor={bColor} />
      <div className="h-1.5 rounded-full bg-elevated overflow-hidden flex justify-start">
        <div
          className="h-full rounded-full animate-grow-w"
          style={{
            "--target": statPct(b),
            backgroundColor: typeColorVar(bColor),
          }}
        />
      </div>
      <span className={`text-diff ${bWins ? "text-primary" : "text-tertiary"}`}>
        {b}
      </span>
    </div>
  );
}

function DiffCell({ label, d, aColor, bColor }) {
  return (
    <div className="relative h-9 flex items-center justify-center">
      <span className="absolute -top-1 inset-x-0 text-overline text-tertiary text-center">
        {label}
      </span>
      {d === 0 ? (
        <span className="text-diff text-diff-tie">—</span>
      ) : (
        <span
          className="grid grid-cols-[0.55rem_auto_0.55rem] items-center justify-items-center text-diff"
          style={{ color: typeColorVar(d > 0 ? aColor : bColor) }}
        >
          <FaCaretLeft aria-hidden className={d > 0 ? "" : "invisible"} />
          <span>+{Math.abs(d)}</span>
          <FaCaretRight aria-hidden className={d < 0 ? "" : "invisible"} />
        </span>
      )}
    </div>
  );
}
