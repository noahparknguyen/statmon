import { statPct } from "../lib/stats";
import { typeColorVar } from "../lib/types";

// The one stat bar (06_style_guide §12.2, D-135). Every bar on the comparison
// surfaces is this component: the Pokémon cards' rows, the mirrored rows on the
// comparison card, and the per-stat cards a phone gets instead.
//
// **They were three bars before, and two of them sat on the same line.** The
// side cards drew an 8px bar on the see-through track, the comparison card's
// mirrored rows a 6px bar on the solid one, and the phone cards an 8px bar on
// the solid one. On a desktop board the side cards and the centre card share
// row lines, so the same stat was drawn at two thicknesses side by side.
//
// What is allowed to differ is stated as props, and nothing else:
//   · `side`  — which end the fill grows from. The mirrored row's left bar
//               grows from the centre outward, so it is justified to its end.
//   · `track` — `glass` only where the bar sits over artwork (the Pokémon
//               card), so the art shows through; `solid` everywhere else.
//   · `animate` — grow in on mount (D-124). `--target` and `width` are two
//               mechanisms, so they stay two branches rather than one style
//               object whose meaning depends on a flag.
//
// `value` null is the empty state: the track alone, no fill.
//
// Fill width is scaled against the fixed 255 every bar on the site shares
// (D-011), so a length means the same thing on every surface.
const TRACK = { solid: "bg-elevated", glass: "bg-track-glass" };

// Written out in full, so Tailwind's scanner sees each one (cf. D-028).
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
