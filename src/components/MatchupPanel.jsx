import AbilityChips from "./AbilityChips";
import TypeBadge from "./TypeBadge";
import { PANEL_BOX, ring, tintFor } from "./gameChrome";
import { artworkFor } from "../lib/pokemon";
import { capitalize, typeColorVar } from "../lib/types";

// One side of a type-game round: the attacking type, or the defender (D-104).
//
// **The role label is not decoration.** The whole question is directional —
// Fire into Water is not Water into Fire — and the two panels are otherwise
// symmetrical, so "ATTACKING" and "DEFENDING" are the only thing distinguishing
// them. It is the first thing in each panel for that reason.
//
// **A Pokémon defender is not tinted until you answer**, which is the one place
// this panel departs from `ContenderPanel`. Every panel on this site is tinted
// by its primary type, and here that would print the answer: in Hard the typing
// is precisely the thing being recalled. So the tint arrives with the reveal,
// along with the type badges — and both are then part of the teaching, not part
// of the question.
//
// Sized in two densities like the stat game's panels, and for the identical
// reason: a responsive variant of a named text style generates no CSS, because
// the styles are hand-written `@layer components` classes (06_style_guide §13).
// A prop is the only way to change one.
// The vendored official artwork is exactly 475x475 — every file, checked across
// a 400-file sample — so a box any larger than that upscales it, which is the
// visible pixelation on a big screen. The cap is the source's own resolution
// rather than a number anyone chose (D-109).
const ART_CAP = "max-h-[475px] max-w-[475px]";

const SIZES = {
  lg: {
    box: "h-full",
    pad: "gap-3 p-4",
    type: "text-display",
    name: "text-h3",
    band: "h-6",
  },
  sm: {
    box: "h-32",
    pad: "gap-1 p-2",
    type: "text-h4",
    name: "text-caption",
    band: "h-0",
  },
};

export default function MatchupPanel({
  role,
  types,
  pokemon = null,
  ability = null,
  gen = null,
  reveal = false,
  shake = false,
  size = "lg",
  className = "",
}) {
  const S = SIZES[size];
  // A hidden typing means a hidden tint. `pokemon && !reveal` is the only case
  // that gets the bare page background.
  const hidden = pokemon != null && !reveal;
  const tint = hidden ? "var(--color-base)" : tintFor(types);

  return (
    <div
      className={`${PANEL_BOX} ${S.box} ${className}`}
      // `background`, not `backgroundColor`: a dual type's tint is a gradient
      // (D-107) and a background-color would drop it silently.
      style={{ background: tint, ...(reveal ? ring("--color-accent") : {}) }}
    >
      {/* The panel is static and its CONTENT is what moves (D-102): shaking the
          panels themselves would flicker the gap between them open and shut a
          dozen times a round. */}
      <span
        className={`flex h-full min-h-0 w-full flex-col items-center justify-center ${
          S.pad
        } ${shake ? "animate-clash-shake" : ""}`}
      >
        {/* 16px, not 11. This label carries the entire direction of the
            question — Fire into Water is not Water into Fire — and the two
            panels are otherwise symmetrical, so it cannot be the quietest
            thing on the board (D-107). */}
        <span className="text-overline-lg text-tertiary">{role}</span>

        {pokemon ? (
          <>
            <img
              src={artworkFor(pokemon)}
              alt=""
              decoding="async"
              className={`min-h-0 w-full flex-1 object-contain ${ART_CAP}`}
            />
            <span className={`${S.name} text-primary`}>{pokemon.name}</span>
            {/* Read-only: without an `onSelect` these render as pills rather
                than buttons, which is how Home previews them too — a button
                that does nothing is worse than a label (D-078). */}
            {ability && (
              <AbilityChips
                abilities={[{ slug: ability, hidden: false }]}
                selected={ability}
                gen={gen}
                // No effect dot until the round is over. The marker means "this
                // ability changes type matchups", which is the question — see
                // AbilityChips (D-104).
                markEffect={reveal}
              />
            )}
            {/* The typing, revealed with the answer — into space that was
                already held. The band keeps its height from the start, so the
                reveal does not shove the name and the ability up the panel
                (D-107). Same reservation `ContenderPanel` makes for its value.
                Two rows' worth, because a dual type wraps at a narrow width. */}
            <span
              className={`flex flex-wrap items-start justify-center gap-1 ${S.band}`}
            >
              {reveal &&
                types.map((t) => <TypeBadge key={t} type={t} size="sm" />)}
            </span>
          </>
        ) : (
          <span className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1">
            {types.map((t) => (
              // The type as coloured display text rather than as a badge: an
              // 11px pill is not a thing you read across a room, and this is
              // the whole content of the panel. Same treatment /types uses for
              // the typing in its readout heading (D-053).
              <span
                key={t}
                className={S.type}
                style={{ color: typeColorVar(t) }}
              >
                {capitalize(t)}
              </span>
            ))}
          </span>
        )}
      </span>
    </div>
  );
}
