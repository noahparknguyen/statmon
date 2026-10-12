import { FaCaretLeft, FaCaretRight } from "react-icons/fa6";
import StatBar from "./StatBar";
import { typeColorVar } from "../lib/types";

// The mirrored stat row, from md up: P1's value and bar growing leftward from
// the centre, the difference cell, then P2's bar growing rightward and value.
//
// Shared by ComparisonCard (the tool) and Home's FeaturedComparison, so the
// two can't drift apart, as CmpStatCard is for phones. The only difference
// between the two callers is that Home animates its bars in on mount, hence
// `animate`.
//
// Columns: value, bar, difference, bar, value. Both value columns are fixed so
// the centre stays centred, and the difference column is wide enough for
// "+150".
//
// The values are `text-stat-sm`, not `text-diff`. The two styles look the same
// today, which is exactly why the choice matters: a value set as a difference
// reads as one to the next person who touches it, and the two styles are free
// to diverge. These are stat values in a dense row, `text-stat-sm`'s job, as in
// the dex table's cells.
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

// Centre cell: the difference sits on the row's centre line, level with the
// bars on either side, with the stat's label as a caption above it. Both caret
// slots are reserved, so the number never shifts. The difference and its caret
// take the leader's primary type colour. A tie is muted, and the empty state is
// a dash.
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
