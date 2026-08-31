import { LuGauge } from "react-icons/lu";

// The full-width flame speed verdict that closes a comparison board — the
// answer to the question that motivated the whole project ("who moves first?").
// Shared by ComparisonCard and Home's FeaturedComparison.
//
// One of only two places the Chandelure flame gradient is allowed; the gradient
// budget is deliberately tight (D-023).
export default function SpeedBanner({ p1, p2 }) {
  const tie = p1.stats.speed === p2.stats.speed;
  const faster = p1.stats.speed > p2.stats.speed ? p1 : p2;
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
