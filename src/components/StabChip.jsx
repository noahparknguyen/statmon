import { LuChevronsUp, LuChevronsDown, LuMinus, LuBan } from "react-icons/lu";
import { abilityLabel } from "../lib/abilities";
import { capitalize, typeColorVar } from "../lib/types";
import { formatMult } from "../lib/typeChart";

// One of the attacker's STAB types, and what it does to the defender.
//
// This was two components saying the same thing in two visual languages:
// `ComparisonCard`'s `EffChip` (14% fill, a tier-dependent 28–55% border,
// `rounded-md`, full width, a tier icon) and `FeaturedComparison`'s `StabPill`
// (16% fill, a flat 32% border, `rounded-full`, inline, no icon). Same data,
// same meaning, different numbers — on exactly the two surfaces D-032 exists to
// keep from drifting, since Home's board is meant to advertise the tool.
//
// They are now one component with one variant, and the variant is **geometry
// only**: the fill, the border weight, the tier colour and the tier icon are the
// encoding, and are identical on both surfaces. `size` is all that differs —
// `sm` for Home's tight three-column head, `md` for the comparison board.
//
// **And the variant is now only a size, because the chip is a pill on both**
// (D-079). It used to be a `w-full justify-between` bar here and an inline pill
// on Home, which is why they needed different names: the bar was sized by its
// container rather than by its content, so it stretched to **686px at 767px
// wide and 819px at 900px** to hold about 120px of text. `ComparisonCard` is
// `md:col-span-2`, so below `lg` it spans the whole board and the bar went with
// it. Every other chip on this site is a content-sized pill (chipStyles.jsx);
// this was the one stretched control, and it was the one that looked wrong.
//
// The tool's treatment is the one that survived the merge, because its border
// carries information the flat 32% did not: a 2× chip is drawn more strongly
// than a resisted one, so the tier reads before the number does. Home's pill
// gains the tier icon it was missing for the same reason.
//
// Never colour alone (04_design §9): every chip states its multiplier as text,
// and the icon is a third cue on top of that.
//
// **Both new pieces of text are `secondary`, and that is the audit talking.**
// The ability caption and the struck-through original sit on the same 14% type
// fill as everything else in here, and `tertiary` over that fill measures
// 3.59–4.38 — failing AA on seventeen of the eighteen types. That is precisely
// the bug D-058 found and fixed; writing either of them in `tertiary` would
// have reintroduced it on a surface group 7 of `npm run audit:contrast` already
// covers. The struck value recedes by its strike, not by its colour.

// Effectiveness tier → icon, text color, and border strength for the chip.
//
// **Only 2× gets a colour of its own.** The resisted and immune tiers used to
// take `text-tertiary`, and consolidating the two copies is what finally put
// this pairing in front of `audit:contrast`: tertiary over a 14% type fill
// measures 3.59–4.38 across the eighteen types and **fails AA on seventeen of
// them**. It had been shipping that way on both surfaces since the chip was
// written, unnoticed because neither copy looked like a text-on-fill pairing
// worth auditing.
//
// Lightening the fill cannot rescue it — tertiary needs the fill down around 5%
// to clear 4.5, which is no tint at all — so the muting moves off the text.
// `secondary` clears AA on every type with room to spare (worst 5.17), and the
// tier is still carried by two other cues that cost nothing: the icon, and the
// border strength. That is the direction 04_design §9 pushes anyway — the
// multiplier should never have been leaning on colour to say "resisted".
//
// **Two border strengths, not four** (D-135): 2× is the one loud tier and the
// rest are quiet, the scale D-051 set. Neutral used to be 30% against the
// resisted tiers' 28%, a difference nobody chose and nobody could see. Both
// numbers are component tokens in index.css (`--mix-stab-border*`).
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

// Written out in full rather than composed, so Tailwind's scanner sees every
// utility (cf. D-028). Both are pills: `rounded-full` is the shape of every
// control on this site (04_design §6), and the chip has no reason to be the
// exception. The dot is 6px in both, like every marker dot on the site; the
// board's chip had a 10px one of its own (D-135).
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
  // `via` is set only when the defender's ability actually moved the number
  // (lib/typeChart's stabMatchup decides that, so this does not recompute it).
  const corrected = via != null;
  return (
    <div
      className={`inline-flex items-center ${SHAPE[size]}`}
      // The type fill is one share for both sizes — the two copies had drifted
      // to 14% and 16%. It is `--mix-stab-fill`, audited as group 7 of
      // `npm run audit:contrast`, which reads it from the stylesheet.
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
          takes its size from the multiplier it sits beside (1em, §11). */}
      <span className={`flex items-center gap-1 text-diff ${color}`}>
        {/* The correction is the interesting fact — "Ground is 0×" is worth
            less than "Ground WOULD be 2×, and is 0×" — so the chart's own
            answer stays on screen with a line through it. Both variants show
            it: D-058 allows them to differ in geometry, not in what they
            encode. `line-through` is decoration, so the change is stated for a
            screen reader too, and stated NEUTRALLY: Fluffy doubles Fire, so
            "reduced to" would be wrong on the one entry that makes its holder
            worse off.

            **What is NOT here is the ability's name** (D-079). It used to sit
            under the type as a second line, which made a corrected chip 43px
            against its sibling's 32 and put 11px text under 12px text. A
            defender has exactly one ability, so naming it per chip was
            redundant by construction — the surface names it once instead: the
            caption under this group on /compare, the defender's head on Home. */}
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

// The label above a group of StabChips, and the expansion of the abbreviation
// under it. Both surfaces used to hang this on a `title=` attribute of a plain
// <span>: invisible to keyboards, invisible on touch, and inconsistently
// exposed by screen readers — a tooltip nobody who needed it could reach. The
// expansion is `sr-only` text instead, which every one of them can. (D-065)
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

// The line under a group of StabChips: what is being attacked, and — once, not
// on every chip — the ability that bent the answer (D-079).
//
// A component rather than markup on the page because it has two callers, which
// is the D-058 rule for when a block stops being page markup. The second caller
// is `/style`, and it having a hand-copy of this was live drift within a
// session: the copy kept the accent dot and missed the `sr-only` expansion the
// real one grew, in the file whose entire stated purpose is rendering the real
// components instead of copies. Three exports from one file is the shape this
// module already had. (D-090)
//
// `via` is the ability slug or null; it comes from `stabMatchup`, which sets it
// only when the ability actually moved a number, so a Levitate that changed
// nothing is never advertised as though it had.
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
          {/* The dot carries meaning — it is AbilityChips' "changes type
              matchups" marker — so it says so out loud rather than leaving a
              screen reader a bare ability name with no reason for it. Never
              colour alone (04_design §9). */}
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
