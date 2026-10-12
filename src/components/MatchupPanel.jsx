import AbilityChips from "./AbilityChips";
import TypeBadge from "./TypeBadge";
import { PANEL_BOX, tintFor } from "./gameChrome";
import { artworkFor } from "../lib/pokemon";
import { capitalize, typeColorVar } from "../lib/types";

// One side of a type-game round: the attacking type, or the defender.
//
// The role label matters. The question has a direction (Fire into Water isn't
// Water into Fire), and the two panels are otherwise alike, so "ATTACKING" and
// "DEFENDING" are all that tells them apart. That's why it comes first in each
// panel.
//
// A Pokémon defender isn't tinted until you answer, the one way this panel
// differs from `ContenderPanel`. Every panel on the site is tinted by its
// primary type, and here that would give the answer away: in Hard, the typing
// is what you're recalling. So the tint arrives with the answer, along with the
// type badges.
//
// Sized in two densities like the stat game's panels, for the same reason: a
// responsive variant of a named text style produces no CSS, because the styles
// are hand-written classes. A prop is the only way to change one.
//
// The artwork files are all exactly 475×475, so a bigger box would enlarge
// them, which shows as pixelation on a big screen.
const ART_CAP = "max-h-[475px] max-w-[475px]";

// The role label is an overline at the panel's scale: `text-overline-lg` on the
// board, where it carries the direction of the question, and the plain overline
// in a thumbnail, where a bigger one would outweigh the Pokémon names.
//
// `lg` pads like `ContenderPanel`'s `lg`, 12px on a phone and 16 from `sm`, so
// both games' panels hold their contents at the same insets.
const SIZES = {
  lg: {
    box: "h-full",
    pad: "gap-3 p-3 sm:p-4",
    role: "text-overline-lg",
    type: "text-display",
    name: "text-h3",
    band: "h-6",
    // `md`, beside a card-sized name, as in ContenderPanel, so a name and
    // typing look the same size on both games' boards.
    badge: "md",
  },
  sm: {
    // `h-full`, not a fixed height. This size only appears in `gameThumbs`'
    // band, which holds either two panels in a row or four in a 2×2, so a fixed
    // height would overflow in one case. The grid owns the height, and the
    // panel fills its cell.
    box: "h-full",
    pad: "gap-1 p-2",
    role: "text-overline",
    type: "text-h4",
    name: "text-caption",
    // Not `h-0`: the Hard card on the start screen shows a Pokémon with its
    // typing, and the badges need a row's height. The artwork above is
    // `flex-1`, so it gives up the space.
    band: "h-5",
    badge: "sm",
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
  lazy = false,
}) {
  const S = SIZES[size];
  // A hidden typing means a hidden tint. `pokemon && !reveal` is the only case
  // that gets the bare page background.
  const hidden = pokemon != null && !reveal;
  const tint = hidden ? "var(--color-base)" : tintFor(types);

  return (
    <div
      className={`${PANEL_BOX} ${S.box} ${className}`}
      // No ring on reveal: the accent ring means "this is the answer" on both
      // boards, and a revealed defender isn't the answer. The multiplier is,
      // and its button says so.
      style={{ backgroundColor: tint }}
    >
      {/* The panel stays still, and its content is what moves: shaking the
          panels themselves would flicker the gap between them open and shut a
          dozen times a round. */}
      <span
        className={`flex h-full min-h-0 w-full flex-col items-center justify-center ${
          S.pad
        } ${shake ? "animate-clash-shake" : ""}`}
      >
        {/* 16px, not 11: this label carries the direction of the whole
            question, so it can't be the quietest thing on the board. */}
        <span className={`${S.role} text-tertiary`}>{role}</span>

        {pokemon ? (
          <>
            {/* `lazy` is off by default, since in a round the artwork is the
                subject and should load right away. The thumbnails turn it on,
                or React 19 would preload a picture of a game nobody has
                started. `ContenderPanel` has the same prop, for the same
                reason. */}
            {/* The artwork's box fills whatever the labels leave, and the image
                sits inside it, as in `ContenderPanel`. If the image itself
                grew, it would stop at its 475px cap, and on a tall board the
                spare space would float this panel's labels lower than the
                attacker's beside it. With a box that always fills, both labels
                sit at the top, and the name, ability, and typing at the foot.
                One element, so the clash shakes it as one part. */}
            <span className="flex min-h-0 w-full flex-1 items-center justify-center">
              <img
                src={artworkFor(pokemon)}
                alt=""
                decoding="async"
                loading={lazy ? "lazy" : undefined}
                className={`h-full w-full object-contain ${ART_CAP}`}
              />
            </span>
            <span className={`${S.name} text-primary`}>{pokemon.name}</span>
            {/* Read-only: without an `onSelect`, these render as pills rather
                than buttons, as on Home's preview. A button that does nothing
                is worse than a label. */}
            {ability && (
              <AbilityChips
                abilities={[{ slug: ability, hidden: false }]}
                selected={ability}
                gen={gen}
                // No effect dot until the round is over. The dot means "this
                // ability changes type matchups", which would answer the
                // question: see AbilityChips.
                markEffect={reveal}
              />
            )}
            {/* The typing, revealed with the answer into space already held.
                The band keeps its height from the start, so the reveal doesn't
                shove the name and ability up the panel, as `ContenderPanel`
                holds space for its value. */}
            <span
              className={`flex flex-wrap items-start justify-center gap-1 ${S.band}`}
            >
              {reveal &&
                types.map((t) => <TypeBadge key={t} type={t} size={S.badge} />)}
            </span>
          </>
        ) : (
          <span className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1">
            {types.map((t) => (
              // The type as coloured display text rather than a badge: an 11px
              // pill isn't readable from across a room, and here it's the whole
              // content of the panel. /types sets the typing in its readout
              // heading the same way.
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
