import { LuChevronsUp, LuChevronsDown, LuMinus, LuBan } from "react-icons/lu";
import { abilityLabel } from "../lib/abilities";
import { capitalize, typeColorVar } from "../lib/types";
import { formatMult } from "../lib/typeChart";

// One of the attacker's same-type-bonus types, and what it does to the
// defender.
//
// Used on the comparison board and on Home's preview of it, with one design:
// the fill, border strength, tier colour, and tier icon are identical on both,
// and `size` is all that differs (`sm` for Home's tight three-column head, `md`
// for the board). Both are pills, sized by their content like every other chip
// on the site, rather than bars stretched to fill their container.
//
// The border carries information: a 2× chip is drawn more strongly than a
// resisted one, so the tier reads before the number does.
//
// Never colour alone: every chip states its multiplier as text, and the icon is
// a third cue on top of that.
//
// The struck-through original is `secondary` text, not `tertiary`, for the
// contrast reason under `tier` below. It recedes through its strike, not its
// colour.

// Effectiveness tier: icon, text colour, and border strength.
//
// Only 2× gets a colour of its own. The quieter tiers use `secondary` text,
// because `tertiary` over this 14% type fill falls below AA contrast on most
// types, and a lighter fill can't fix that without losing the tint. `secondary`
// passes on every type (worst 5.17:1, checked by `npm run audit:contrast`), and
// the tier is still carried by two other cues: the icon and the border
// strength. A multiplier shouldn't rely on colour to say "resisted" anyway.
//
// Two border strengths: 2× is the one loud tier and the rest are quiet. Both
// are tokens in index.css (`--mix-stab-border*`).
const LOUD = "var(--mix-stab-border-strong)";
const QUIET = "var(--mix-stab-border)";

function tier(mult) {
  if (mult === 0)
    return { Icon: LuBan, color: "text-secondary", border: QUIET };
  if (mult >= 2)
    return { Icon: LuChevronsUp, color: "text-primary", border: LOUD };
  if (mult < 1)
    return { Icon: LuChevronsDown, color: "text-secondary", border: QUIET };
  return { Icon: LuMinus, color: "text-secondary", border: QUIET };
}

// Written out in full rather than built up, so Tailwind's scanner sees every
// class. Both are pills, because `rounded-full` is the shape of every control
// on the site. The dot is 6px in both, like every marker dot on the site.
const SHAPE = {
  md: "gap-2 px-3 py-1.5 rounded-full",
  sm: "gap-2 px-2 py-1 rounded-full",
};

export default function StabChip({
  type,
  mult,
  baseMult = mult,
  via = null,
  size = "md",
}) {
  const { Icon, color, border } = tier(mult);
  const tc = typeColorVar(type);
  // `via` is set only when the defender's ability changed the number:
  // lib/typeChart's stabMatchup decides that, so this doesn't work it out again.
  const corrected = via != null;
  return (
    <div
      className={`inline-flex items-center ${SHAPE[size]}`}
      // One fill share for both sizes: `--mix-stab-fill` in index.css, which
      // `npm run audit:contrast` reads.
      style={{
        backgroundColor: `color-mix(in srgb, ${tc} var(--mix-stab-fill), var(--color-elevated))`,
        border: `1px solid color-mix(in srgb, ${tc} ${border}, transparent)`,
      }}
    >
      <span className="flex items-center gap-1.5">
        <span
          className="size-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: tc }}
        />
        <span className="text-meta">{capitalize(type)}</span>
      </span>
      {/* `text-diff` on the group rather than on each figure, so the tier icon
          takes its size from the multiplier beside it. */}
      <span className={`flex items-center gap-1 text-diff ${color}`}>
        {/* The correction is the interesting part: "Ground would be 2×, and is
            0×" says more than "Ground is 0×", so the chart's own answer stays
            on screen with a line through it, at both sizes. `line-through` is
            decoration, so the change is also stated for a screen reader, and
            neutrally: Fluffy doubles Fire, so "reduced to" would be wrong for
            the one ability that makes its holder worse off.

            The ability's name isn't on the chip. A defender has exactly one
            ability, so the surface names it once instead: in the caption under
            the chips on /compare, and in the defender's heading on Home. */}
        {corrected && (
          <>
            <span aria-hidden className="text-secondary line-through">
              {formatMult(baseMult)}
            </span>
            <span className="sr-only">
              {formatMult(baseMult)} on the chart, and{" "}
            </span>
          </>
        )}
        <span>{formatMult(mult)}</span>
        <Icon aria-hidden />
      </span>
    </div>
  );
}

// The label above a group of StabChips, with the abbreviation spelled out as
// screen-reader text, which a keyboard, a touch screen, and a screen reader can
// all reach, unlike a `title=` tooltip.
export function StabLabel({ children }) {
  return (
    <span className="text-overline text-tertiary">
      {children}
      <span className="sr-only">
        , same type attack bonus: the damage from moves matching the attacker's
        own type
      </span>
    </span>
  );
}

// The line under a group of StabChips: what's being attacked, and, once rather
// than on every chip, the ability that changed the answer.
//
// A component because it has two callers: the comparison board and /style,
// which shows real components rather than copies.
//
// `via` is the ability slug or null. It comes from `stabMatchup`, which sets it
// only when the ability changed a number, so a Levitate that changed nothing is
// never announced as though it had.
export function StabCaption({ types, via = null }) {
  return (
    <span className="text-caption text-tertiary">
      vs{" "}
      <span className="text-secondary">
        {types.map(capitalize).join(" / ")}
      </span>
      {via && (
        <>
          <span aria-hidden>{" · "}</span>
          {/* The dot means something: it's AbilityChips' "changes type
              matchups" marker. So it's also said in words, rather than leaving
              a screen reader with a bare ability name and no reason for it.
              Never colour alone. */}
          <span
            aria-hidden
            className="mr-1 inline-block size-1.5 rounded-full bg-accent align-middle"
          />
          <span className="sr-only">changed by </span>
          <span className="text-secondary">{abilityLabel(via)}</span>
        </>
      )}
    </span>
  );
}
