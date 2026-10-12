import { FaCaretUp, FaCaretDown } from "react-icons/fa6";
import StatBar from "./StatBar";
import { typeColorVar } from "../lib/types";

// The per-stat card below md: it replaces one mirrored CmpRow with P1 stacked
// over P2, since side-by-side bars and a centre difference column get crushed
// below 768px. Shared by ComparisonCard (the tool) and Home's
// FeaturedComparison, so both collapse the same way.
export default function CmpStatCard({
  label,
  a,
  b,
  aName,
  bName,
  aColor,
  bColor,
  animate = false,
}) {
  const ready = a !== null && b !== null;
  const aWins = ready && a > b;
  const bWins = ready && b > a;
  const d = ready ? a - b : null;

  return (
    <div className="rounded-md border border-border-subtle p-3">
      <div className="flex items-center justify-between">
        <span className="text-overline text-tertiary">{label}</span>
        <MobileDiff d={d} aColor={aColor} bColor={bColor} />
      </div>
      <div className="mt-2 flex flex-col gap-1.5">
        <StatLine
          name={aName}
          value={a}
          color={aColor}
          win={aWins}
          ready={ready}
          animate={animate}
        />
        <StatLine
          name={bName}
          value={b}
          color={bColor}
          win={bWins}
          ready={ready}
          animate={animate}
        />
      </div>
    </div>
  );
}

function StatLine({ name, value, color, win, ready, animate }) {
  return (
    <div className="grid grid-cols-[5rem_1fr_2.25rem] items-center gap-2">
      {/* No `title` tooltip on the truncated name: a keyboard can't reach one,
          and touch never shows it. It wouldn't add anything either: this card
          only renders below md, where the full name is already on screen in
          the Pokémon card's heading, a short scroll away. */}
      <span className="text-caption text-secondary truncate">
        {name ?? "–"}
      </span>
      <StatBar value={ready ? value : null} type={color} animate={animate} />
      <span
        className={`text-stat text-right ${win ? "text-primary" : "text-tertiary"}`}
      >
        {ready ? value : "–"}
      </span>
    </div>
  );
}

// The bars are stacked here rather than mirrored, so the difference uses a
// vertical caret instead of CmpRow's left and right pair.
function MobileDiff({ d, aColor, bColor }) {
  if (d === null) return <span className="text-diff text-tertiary">–</span>;
  if (d === 0) return <span className="text-diff text-diff-tie">—</span>;
  const Caret = d > 0 ? FaCaretUp : FaCaretDown;
  return (
    <span
      className="inline-flex items-center gap-1 text-diff"
      style={{ color: typeColorVar(d > 0 ? aColor : bColor) }}
    >
      <Caret aria-hidden />
      {`+${Math.abs(d)}`}
    </span>
  );
}
