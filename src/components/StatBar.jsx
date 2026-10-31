import { statPct } from "../lib/stats";
import { typeColorVar } from "../lib/types";

// The one stat bar. Every bar on the comparison pages is this component: the
// Pokémon cards' rows, and the mirrored rows on the desktop's comparison card
// and on a phone's board. On a desktop board the side cards and the centre
// card share row lines, so two different bars would show the same stat at two
// thicknesses side by side.
//
// What may differ is a prop, and nothing else:
//   · `side`: which end the fill grows from. The mirrored row's left bar grows
//     from the centre outward, so it's justified to its end.
//   · `track`: `glass` only where the bar sits over artwork (the Pokémon
//     card), so the art shows through, and `solid` everywhere else.
//   · `animate`: grow in on mount. `--target` and `width` work differently, so
//     they stay two branches rather than one style object whose meaning
//     depends on a flag.
//
// A null `value` is the empty state: the track alone, no fill.
//
// Fill width is scaled against the fixed 255 every bar on the site shares, so
// a length means the same thing everywhere.
const TRACK = { solid: "bg-elevated", glass: "bg-track-glass" };

// Written out in full, so Tailwind's scanner sees each one.
const JUSTIFY = { start: "justify-start", end: "justify-end" };

export default function StatBar({
  value = null,
  type,
  side = "start",
  track = "solid",
  animate = false,
}) {
  return (
    <div
      className={`flex h-2 overflow-hidden rounded-full ${TRACK[track]} ${JUSTIFY[side]}`}
    >
      {value != null &&
        (animate ? (
          <div
            className="h-full rounded-full animate-grow-w"
            style={{
              "--target": statPct(value),
              backgroundColor: typeColorVar(type),
            }}
          />
        ) : (
          <div
            className="h-full rounded-full"
            style={{
              width: statPct(value),
              backgroundColor: typeColorVar(type),
            }}
          />
        ))}
    </div>
  );
}
