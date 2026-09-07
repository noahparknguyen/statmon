import { FaCaretUp, FaCaretDown } from "react-icons/fa6";
import { typeColorVar } from "../lib/types";
import { statPct } from "../lib/stats";

// Mobile (< md) per-stat card (D-010): replaces one mirrored CmpRow/Row with
// a stacked P1-over-P2 layout, since side-by-side bars + a center diff column
// get crushed below 768px. Shared by ComparisonCard (tool) and Home's
// FeaturedComparison board so both surfaces collapse identically.
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
      {/* No `title` tooltip on the truncation. It was the third `title=` on the
          site and the same anti-pattern as the other two — unreachable by
          keyboard, invisible on touch — and it was buying nothing here: this
          card only ever renders below md (D-065), where the full name is already on
          screen in the Pokémon card's own heading a short scroll away. */}
      <span className="text-caption text-secondary truncate">
        {name ?? "–"}
      </span>
      <div className="h-2 rounded-full bg-elevated overflow-hidden">
        {/* Same two branches as `CmpRow`'s bar, for the same reason: `--target`
            and `width` are different mechanisms and composing them into one
            element would mean a style object whose meaning depends on a flag.
            Below `md` this is the ONLY stats surface (D-057), so leaving it
            static while the desktop board animated would have made the phone
            the odd one out. */}
        {ready &&
          (animate ? (
            <div
              className="h-full rounded-full animate-grow-w"
              style={{
                "--target": statPct(value),
                backgroundColor: typeColorVar(color),
              }}
            />
          ) : (
            <div
              className="h-full rounded-full"
              style={{
                width: statPct(value),
                backgroundColor: typeColorVar(color),
              }}
            />
          ))}
      </div>
      <span
        className={`text-stat text-right ${win ? "text-primary" : "text-tertiary"}`}
      >
        {ready ? value : "–"}
      </span>
    </div>
  );
}

// Bars are stacked (not left/right) on mobile, so the diff uses a vertical
// caret instead of CmpRow's left/right pair.
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
