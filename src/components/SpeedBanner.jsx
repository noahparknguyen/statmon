import { LuGauge } from "react-icons/lu";

// The full-width flame speed verdict that closes a comparison board: the
// answer to the question the whole project started from, "who moves first?".
// Shared by ComparisonCard and Home's FeaturedComparison.
//
// One of only two uses of the Chandelure flame gradient, with the "Higher
// total" figure. Kept that rare so it stays special.
//
// The two speeds are passed in rather than read from p1 and p2, because Speed
// has been revised for some Pokémon (Pidgeot went from 91 to 101 in Gen 6, and
// Electrode from 140 to 150 in Gen 7), so who moves first depends on the
// generation the board is read at.
//
// The text stays off the flame's dark end. The gradient's first stop measures
// 3.61:1 against the banner's near-black text, under AA, and a long name like
// "Squawkabilly Green Plumage moves first" would reach it on a phone.
// `.flame-inset` holds the text inside the middle 64%, where the worst point is
// 4.71, and a name that doesn't fit wraps to a second line instead.
// `npm run audit:contrast` reads the inset and checks that number.
export default function SpeedBanner({ p1, p2, a, b }) {
  const tie = a === b;
  const faster = a > b ? p1 : p2;
  return (
    // `text-button` on the banner rather than the label, so the gauge takes
    // its size from the words beside it: 1em, like every icon.
    <div className="flame-inset flex h-14 items-center justify-center gap-2 bg-flame text-button text-accent-contrast">
      <LuGauge aria-hidden className="shrink-0" />
      <span className="min-w-0 text-center">
        {tie ? "Same speed" : `${faster.name} moves first`}
      </span>
    </div>
  );
}
