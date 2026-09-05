import { LuChevronsUp, LuChevronsDown, LuMinus, LuBan } from "react-icons/lu";
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
// encoding, and are identical on both surfaces. `dense` is the inline pill that
// Home's three-column head has room for; the default is the full-width row the
// comparison card's stacked list wants.
//
// The tool's treatment is the one that survived the merge, because its border
// carries information the flat 32% did not: a 2× chip is drawn more strongly
// than a resisted one, so the tier reads before the number does. Home's pill
// gains the tier icon it was missing for the same reason.
//
// Never colour alone (04_design §9): every chip states its multiplier as text,
// and the icon is a third cue on top of that.

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
function tier(mult) {
  if (mult === 0) return { Icon: LuBan, color: "text-secondary", border: 28 };
  if (mult >= 2)
    return { Icon: LuChevronsUp, color: "text-primary", border: 55 };
  if (mult < 1)
    return { Icon: LuChevronsDown, color: "text-secondary", border: 28 };
  return { Icon: LuMinus, color: "text-secondary", border: 30 };
}

// The type fill, as a share of the chip's background. One number for both
// variants — the two files had drifted to 14% and 16%, which is a difference
// nobody chose and nobody could see. Audited as group 7 of `audit:contrast`.
const FILL = 14;

// Written out in full rather than composed, so Tailwind's scanner sees every
// utility (cf. D-028).
const SHAPE = {
  full: "w-full justify-between gap-2 px-3 py-2 rounded-md",
  dense: "gap-2 px-2 py-1 rounded-full",
};
const DOT = { full: "size-2.5", dense: "size-1.5" };

export default function StabChip({ type, mult, dense = false }) {
  const { Icon, color, border } = tier(mult);
  const key = dense ? "dense" : "full";
  const tc = typeColorVar(type);
  return (
    <div
      className={`flex items-center ${SHAPE[key]}`}
      style={{
        backgroundColor: `color-mix(in srgb, ${tc} ${FILL}%, var(--color-elevated))`,
        border: `1px solid color-mix(in srgb, ${tc} ${border}%, transparent)`,
      }}
    >
      <span className="flex items-center gap-1.5">
        <span
          className={`${DOT[key]} shrink-0 rounded-full`}
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

// The label above a group of StabChips, and the expansion of the abbreviation
// under it. Both surfaces used to hang this on a `title=` attribute of a plain
// <span>: invisible to keyboards, invisible on touch, and inconsistently
// exposed by screen readers — a tooltip nobody who needed it could reach. The
// expansion is `sr-only` text instead, which every one of them can.
export function StabLabel({ children }) {
  return (
    <span className="text-overline text-tertiary">
      {children}
      <span className="sr-only">
        {" "}
        — same type attack bonus, the damage from moves matching the attacker's
        own type
      </span>
    </span>
  );
}
