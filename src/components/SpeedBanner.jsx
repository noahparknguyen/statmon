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
//
// **The text stays off the flame's dark end** (D-136). The gradient's first
// stop measures 3.61:1 against the banner's near-black text, under AA, and a
// long name reached it: "Squawkabilly Green Plumage moves first" started 9% in
// at 320px, about 4.1:1, and ran into both edges of a banner with no padding.
// `.flame-inset` holds the text inside the middle 64%, where the worst point is
// 4.71, and a name that does not fit wraps to a second line instead of
// reaching the ends. Group 13 of `npm run audit:contrast` reads the inset and
// re-checks that number.
export default function SpeedBanner({ p1, p2, a, b }) {
  const tie = a === b;
  const faster = a > b ? p1 : p2;
  return (
    // `text-button` on the banner rather than the label, so the gauge takes
    // its size from the words beside it: 1em, like every icon (§11). It was a
    // one-off 19px.
    <div className="flame-inset flex h-14 items-center justify-center gap-2 bg-flame text-button text-accent-contrast">
      <LuGauge aria-hidden className="shrink-0" />
      <span className="min-w-0 text-center">
        {tie ? "Same speed" : `${faster.name} moves first`}
      </span>
    </div>
  );
}
