import { LuGauge } from "react-icons/lu";

// The full-width flame speed verdict that closes a comparison board — the
// answer to the question that motivated the whole project ("who moves first?").
// Shared by ComparisonCard and Home's FeaturedComparison.
//
// One of only two places the Chandelure flame gradient is allowed; the gradient
// budget is deliberately tight (D-023).
//
// The two speeds are passed in rather than read off p1/p2, because Speed is one
// of the stats that has been revised — Pidgeot went 91 → 101 and Electrode
// 140 → 150 in Gen 6 — so who moves first depends on which generation the board
// is being read at (D-045).
export default function SpeedBanner({ p1, p2, a, b }) {
  const tie = a === b;
  const faster = a > b ? p1 : p2;
  return (
    <div
      className="h-14 bg-flame flex items-center justify-center gap-2"
      style={{ color: "var(--color-accent-contrast)" }}
    >
      <LuGauge aria-hidden size={19} className="shrink-0" />
      <span className="text-button">
        {tie ? "Same speed" : `${faster.name} moves first`}
      </span>
    </div>
  );
}
