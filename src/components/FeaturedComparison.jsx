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

// Home's flagship board: a fixed, non-interactive comparison (Volcarona vs
// Chandelure — the site's pseudo-mascots, D-023). It led the page until D-070
// put the sprite wall above it; "hero" now means the wall, and this is the
// first thing under it. It deliberately reuses the
// comparison tool's visual language — mirrored type-colored bars, type-tinted
// center diffs, the flame "Higher total" delta, and the flame speed banner — so
// Home and the tool read as one site — the mirrored rows and the speed banner
// are literally the tool's own components (CmpRow / SpeedBanner), not copies.
// Bars grow in once on mount (`animate`), which is the only difference.
//
// It used to carry an sr-only <h2> reading "Example comparison: Volcarona vs
// Chandelure" — the only heading the flagship had, and it named the mascots
// rather than the tool. Home now heads the section with /compare's own title
// and one-liner, visible to everyone, so this would be a second heading over
// the same content (D-067).
//
// **Its insets are the tool's** (D-135). Every band here was `px-5` against the
// tool's `px-3` and `px-4`, the stats band ran `pt-3 pb-2` against the tool's
// `pt-2 pb-4`, and the phone's per-stat cards did not grow in while the tool's
// did. A preview may subtract interactivity and add a frame (D-067); it may not
// be laid out by different numbers.

export default function FeaturedComparison({ p1, p2 }) {
  const delta = p1.bst - p2.bst;
  const tied = delta === 0;
  const p1Leads = delta > 0;
  return (
    <div className="flex flex-col overflow-hidden bg-surface border border-border-subtle rounded-lg">
      {/* Heads — below 768px the sprite+name+badges+STAB grid crushes names to
        a few px, so it stacks (P1 head, STAB, P2 head); unchanged at ≥768px. */}
      <div className="flex flex-col gap-3 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center px-4 py-4 border-b border-border-subtle">
        <MonHead p={p1} />
        <StabCenter attacker={p1} defender={p2} />
        <MonHead p={p2} right />
      </div>

      {/* Mirrored stat rows (≥768px, D-010) */}
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

      {/* Per-stat cards (<768px, D-010) */}
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

      {/* BST summary */}
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

      {/* Speed verdict. Home is always the current generation, so it hands the
          banner today's speeds. */}
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
        {/* Decorative: the name is the next thing in the DOM, so alt text here
            just makes a screen reader say it twice. */}
        <img
          src={spriteFor(p)}
          alt=""
          loading="lazy"
          className="w-full h-full object-contain [image-rendering:pixelated]"
        />
      </div>
      <div className="min-w-0">
        {/* A Pokémon's name at card scale is `text-h3` with `md` badges, the
            way PokemonCard sets it (§5). This head had `text-h4` and `sm`
            badges, which made the same two Pokémon read smaller on Home than
            on the tool it advertises. */}
        <div className="text-h3 truncate">{p.name}</div>
        <div className="text-caption text-tertiary">
          #{String(dexNumberOf(p)).padStart(4, "0")}
        </div>
        <div className={`flex gap-1.5 mt-1.5 ${right ? "md:justify-end" : ""}`}>
          {p.types.map((t) => (
            <TypeBadge key={t} type={t} />
          ))}
        </div>
        {/* Named, not chips: this board is not interactive, so a control would
            be a lie. It is here because the STAB pills beside it now read
            through this ability, and a 0× with no visible cause is the kind of
            thing that reads as a bug. */}
        <div className="text-caption text-tertiary mt-1 truncate">
          {abilityLabel(defaultAbility(p))}
        </div>
      </div>
    </div>
  );
}

// Center of the head: the attacker's STAB effectiveness into the defender —
// the one thing the full ComparisonCard shows that this preview otherwise drops.
// (attacker = p1 by convention; the pills match p1's type badges on the left.)
//
// **It scores through the defender's first ability, exactly as /compare does**
// (D-074). Not doing so would have left Home showing ½× where the tool it
// advertises shows 0×, on the one board D-032 exists to keep from drifting —
// Chandelure's first ability is Flash Fire, so Volcarona's Fire STAB does
// nothing to it. The board is a live preview of the tool, and a live preview
// that disagrees with the tool is a mockup.
function StabCenter({ attacker, defender }) {
  const ability = defaultAbility(defender);
  return (
    <div className="flex flex-col items-center gap-1.5">
      <StabLabel>STAB</StabLabel>
      {/* `items-center`, because a flex COLUMN stretches its children to the
          widest by default — which padded the shorter pill out to the corrected
          one's width and left dead space inside it. On /compare the group is a
          wrapping ROW, where stretch affects height rather than width, so only
          this surface had it (D-083). */}
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
