import { FaCaretLeft, FaCaretRight } from "react-icons/fa6";
import StatBar from "./StatBar";
import { typeColorVar } from "../lib/types";

// The desktop (≥ md) mirrored stat row: P1's value + bar growing leftward from
// the centre, the difference cell, then P2's bar growing rightward + value.
//
// Shared by ComparisonCard (the live tool) and Home's FeaturedComparison so the
// two surfaces cannot drift — the same split already used for the mobile
// CmpStatCard (D-029). The only difference between the two callers is that Home
// animates its bars in on mount, hence `animate`.
//
// Column track: [value | bar | diff | bar | value]. Both value columns are fixed
// so the centre stays centred; the diff column is wide enough for "+150".
//
// **The values are `text-stat-sm`, not `text-diff`** (D-135). The two styles
// share their numbers today, and that is exactly why the role matters: a value
// set as a difference reads as one to the next person who touches it, and the
// two are free to diverge (06_style_guide §5). These are stat values in a
// dense row, which is `text-stat-sm`'s role, the one the dex table's cells use.
const ROW_COLS = "grid-cols-[1.6rem_1fr_3.25rem_1fr_1.6rem]";

export default function CmpRow({
  label,
  a,
  b,
  aColor,
  bColor,
  animate = false,
}) {
  const ready = a !== null && b !== null;
  const aWins = ready && a > b;
  const bWins = ready && b > a;

  return (
    <div className={`grid ${ROW_COLS} items-center gap-1.5 h-9`}>
      <span
        className={`text-stat-sm text-right ${aWins ? "text-primary" : "text-tertiary"}`}
      >
        {ready ? a : "–"}
      </span>
      <StatBar
        value={ready ? a : null}
        type={aColor}
        animate={animate}
        side="end"
      />
      <DiffCell
        label={label}
        d={ready ? a - b : null}
        aColor={aColor}
        bColor={bColor}
      />
      <StatBar value={ready ? b : null} type={bColor} animate={animate} />
      <span
        className={`text-stat-sm ${bWins ? "text-primary" : "text-tertiary"}`}
      >
        {ready ? b : "–"}
      </span>
    </div>
  );
}

// Centre cell: the magnitude sits on the row's centreline (aligned with the
// flanking bars), with the stat label as a caption above it. Both caret slots
// are reserved so the number never shifts. Magnitude + caret take the winner's
// primary type colour (D-023); ties are muted, the empty state is a dash.
function DiffCell({ label, d, aColor, bColor }) {
  return (
    <div className="relative h-9 flex items-center justify-center">
      <span className="absolute -top-1 inset-x-0 text-overline text-tertiary text-center">
        {label}
      </span>
      {d === null ? (
        <span className="text-diff text-tertiary">–</span>
      ) : d === 0 ? (
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
