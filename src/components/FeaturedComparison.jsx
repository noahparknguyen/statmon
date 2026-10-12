import TypeBadge from "./TypeBadge";
import CmpStatCard from "./CmpStatCard";
import CmpRow from "./CmpRow";
import SpeedBanner from "./SpeedBanner";
import StabChip, { StabLabel } from "./StabChip";
import { STAT_ORDER, STAT_LABEL } from "../lib/stats";
import { spriteFor } from "../lib/pokemon";
import { dexNumberOf } from "../lib/dexTable";
import { defaultAbility, abilityLabel } from "../lib/abilities";
import { stabMatchup } from "../lib/typeChart";

// Home's comparison board: a fixed comparison of Volcarona and Chandelure, the
// site's unofficial mascots, which you can look at but not change. It uses the
// comparison tool's look (mirrored bars in type colours, the difference between
// them in the leader's colour, the flame "Higher total", and the flame speed
// banner), so Home and the tool read as one site. The mirrored rows and the
// speed banner are the tool's own components (CmpRow and SpeedBanner), not
// copies. The bars grow in once, when the board appears.
//
// Its spacing matches the tool's too: a preview can drop interactivity and add
// a frame, but it shouldn't be laid out by different numbers.

export default function FeaturedComparison({ p1, p2 }) {
  const delta = p1.bst - p2.bst;
  const tied = delta === 0;
  const p1Leads = delta > 0;
  return (
    <div className="flex flex-col overflow-hidden bg-surface border border-border-subtle rounded-lg">
      {/* The heads. Below 768px, a row of sprite, name, badges, and type chips
        would crush the names, so it stacks: P1's head, the type chips, then
        P2's head. */}
      <div className="flex flex-col gap-3 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center px-4 py-4 border-b border-border-subtle">
        <MonHead p={p1} />
        <StabCenter attacker={p1} defender={p2} />
        <MonHead p={p2} right />
      </div>

      {/* Mirrored stat rows, from 768px. */}
      <div className="hidden md:block px-4 pt-2 pb-4">
        {STAT_ORDER.map((k) => (
          <CmpRow
            key={k}
            label={STAT_LABEL[k]}
            a={p1.stats[k]}
            b={p2.stats[k]}
            aColor={p1.types[0]}
            bColor={p2.types[0]}
            animate
          />
        ))}
      </div>

      {/* One card per stat, below 768px. */}
      <div className="md:hidden flex flex-col gap-2 px-4 pt-2 pb-4">
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
            animate
          />
        ))}
      </div>

      {/* The BST summary. */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-4 border-t border-border-subtle">
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
            <span className="text-numeral-md">Tied</span>
          ) : (
            <span className="text-numeral-lg bg-flame bg-clip-text text-transparent">
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

      {/* The speed verdict. Home always shows today's generation, so it gives
          the banner today's speeds. */}
      <SpeedBanner p1={p1} p2={p2} a={p1.stats.speed} b={p2.stats.speed} />
    </div>
  );
}

function MonHead({ p, right = false }) {
  return (
    <div
      className={`flex items-center justify-center gap-3 min-w-0 md:justify-normal ${right ? "md:flex-row-reverse md:text-right" : ""}`}
    >
      <div className="w-14 h-14 shrink-0 rounded-md bg-elevated overflow-hidden flex items-center justify-center">
        {/* Decorative: the name comes right after it, so alt text would only
            make a screen reader say it twice. */}
        <img
          src={spriteFor(p)}
          alt=""
          loading="lazy"
          className="w-full h-full object-contain [image-rendering:pixelated]"
        />
      </div>
      <div className="min-w-0">
        {/* A Pokémon's name at card size is `text-h3` with `md` badges, as in
            PokemonCard, so the two Pokémon look the same size here as on the
            tool. */}
        <div className="text-h3 truncate">{p.name}</div>
        <div className="text-caption text-tertiary">
          #{String(dexNumberOf(p)).padStart(4, "0")}
        </div>
        <div className={`flex gap-1.5 mt-1.5 ${right ? "md:justify-end" : ""}`}>
          {p.types.map((t) => (
            <TypeBadge key={t} type={t} />
          ))}
        </div>
        {/* Named, not shown as chips: this board isn't interactive, so a
            control would be a lie. It's here because the type chips beside it
            are scored through this ability, and a 0× with no visible cause
            would look like a bug. */}
        <div className="text-caption text-tertiary mt-1 truncate">
          {abilityLabel(defaultAbility(p))}
        </div>
      </div>
    </div>
  );
}

// The middle of the heads: the attacker's same-type-bonus types against the
// defender, the one part of the full ComparisonCard this preview would
// otherwise drop. P1 attacks, so the chips match P1's type badges on the left.
//
// It scores through the defender's first ability, as /compare does, so the
// preview agrees with the tool: Chandelure's first ability is Flash Fire, so
// Volcarona's Fire attacks do nothing to it. A preview that disagreed with the
// tool would be a mock-up.
function StabCenter({ attacker, defender }) {
  const ability = defaultAbility(defender);
  return (
    <div className="flex flex-col items-center gap-1.5">
      <StabLabel>STAB</StabLabel>
      {/* `items-center`, because a flex column stretches its children to the
          widest by default, which would pad the shorter chip out to the
          corrected one's width. On /compare the chips sit in a wrapping row,
          where stretching affects height, not width. */}
      <div className="flex flex-col items-center gap-1">
        {stabMatchup(attacker, defender, null, ability).map(
          ({ type, mult, baseMult, via }) => (
            <StabChip
              key={type}
              type={type}
              mult={mult}
              baseMult={baseMult}
              via={via}
              size="sm"
            />
          ),
        )}
      </div>
    </div>
  );
}
