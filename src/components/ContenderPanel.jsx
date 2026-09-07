import { LuCheck, LuX } from "react-icons/lu";
import TypeBadge from "./TypeBadge";
import { artworkFor } from "../lib/pokemon";
import { statName } from "../lib/games";
import { PANEL_BOX, ring, tintFor } from "./gameChrome";

// One Pokémon in a round: the thing you click, and then the thing that tells
// you what it was worth (D-091, rebuilt as an arena panel by D-096).
//
// **Deliberately not `PokemonCard`.** That is the comparison board's 616px spec
// sheet and it opens with six stat bars — it would print the answer on screen
// before the question was asked.
//
// **This is where the games take their exception to 04_design §1** (D-096). The
// design principles scope themselves to the *tools*, where chrome competing
// with the data is a defect. In a game the Pokémon **are** the data, so the
// panel is deliberately enormous: full viewport height, artwork as the subject
// rather than as a backdrop, and the controls somewhere else entirely. Home
// already holds the site's other stated exception (D-070); this is the second,
// and like that one it is an entry rather than a drift.
//
// **Tinted by primary type**, which is the site's oldest visual idea rather
// than a new one (04_design §3: a Pokémon's primary type colours its
// representation). It also does the arena's structural work — two panels of
// different colours read as two sides without needing a heavier divider — and
// it costs no new colour system. Audited as group 10 of `npm run audit:contrast`.
//
// **Right and wrong without a red/green pair** (D-093): the palette has none, on
// purpose, so the winner takes the accent and everything else recedes by a step,
// on D-051's one-loud-state-and-three-quiet-ones scale. Every marked panel
// carries an icon and screen-reader text, never colour alone.

// How much of the primary type sits over the page background. Low, because it
// is a whole panel rather than a chip: at 14% (the STAB chip's number) four
// panels of saturated type colour fought the artwork they exist to show.
// Three densities, and they are densities rather than styles: the same panel
// with more or less room around it. `lg` is a two-up round, where each panel
// owns half the screen; `md` is a four-up, where it owns a quarter and the name
// has to survive 160px at 320px wide; `sm` is the games-index thumbnail.
//
// The name and value are picked per size rather than made responsive, because
// **a responsive variant of a named text style generates no CSS**: the styles
// are hand-written `@layer components` classes, so `lg:text-h2` is silently
// nothing (06_style_guide §13, the D-065 finding). A prop is the only way to
// change one.
// The vendored official artwork is exactly 475x475 — every file, checked across
// a 400-file sample — so a box larger than that upscales it (D-109).
const ART_CAP = "max-h-[475px] max-w-[475px]";

const SIZES = {
  lg: {
    box: "h-full",
    pad: "gap-3 p-3 sm:p-4",
    name: "text-h2",
    value: "text-numeral-xl",
    // The band has to clear its own numeral: `text-numeral-*` is `leading-none`
    // by design (D-035), so the glyph is the full font size and a 48px figure
    // in a 36px band is a figure with its feet cut off. One rung above the
    // type size, each time.
    band: "h-14",
    badge: "md",
  },
  md: {
    box: "h-full",
    pad: "gap-2 p-2 sm:p-4",
    name: "text-h3",
    value: "text-numeral-lg",
    band: "h-11",
    badge: "md",
  },
  // The games index thumbnail (D-043: a preview is the real component, not a
  // mockup). Short and fixed, so two of them sit inside a card.
  sm: {
    box: "h-32",
    pad: "gap-1 p-2",
    name: "text-caption",
    value: "text-stat-sm",
    band: "h-6",
    badge: "sm",
  },
};

export default function ContenderPanel({
  pokemon,
  stat,
  value,
  resolved = false,
  picked = false,
  won = false,
  onPick = null,
  size = "md",
  className = "",
  shake = false,
}) {
  const S = SIZES[size];
  // The whole typing, not just the primary: a dual type gets both colours
  // (D-107). `background` rather than `backgroundColor` because that value is a
  // gradient for two types, and a background-color would silently drop it.
  const tint = tintFor(pokemon.types);

  // Four states on one scale: the winner is loud, your wrong pick is present,
  // the rest recede. Opacity rather than a fourth colour.
  const mark = !resolved
    ? null
    : won
      ? ring("--color-accent")
      : picked
        ? ring("--color-border-strong")
        : null;

  return (
    <button
      type="button"
      // Inert once resolved, and inert with no handler at all — that is how the
      // thumbnails and Home's preview render it. A button that does nothing is
      // worse than a label (the D-078 rule Home's ability pills follow).
      disabled={resolved || !onPick}
      onClick={onPick ?? undefined}
      // No aria-label: the accessible name is computed from the contents — the
      // Pokémon's name and its types — which is what a speech-control user
      // would actually say (WCAG 2.5.3, the FilterChip reasoning).
      // `className` is a layout hook only — the same contract TypeBadge's is
      // under. It exists for **corner radius**, and for a specific reason: the
      // winner's marking is an INSET ring, so it traces the panel's own box. In
      // a thumbnail clipped by a card's `rounded-lg`, a square panel gave the
      // ring square corners that the card then sliced off — the ring has to be
      // told about the curve, it cannot infer it from its container. Safe to
      // append here because the panel sets no radius of its own, so there is no
      // collision of the kind TypeBadge's `radius` prop exists to avoid.
      className={`${PANEL_BOX} ${S.box} ${
        resolved && !won && !picked ? "opacity-50" : ""
      } ${className}`}
      style={{ background: tint, ...mark }}
    >
      {/* The panel is static and its CONTENT is what moves (D-102). The clash
          shakes what is inside each panel rather than the panel itself, because
          shaking the panels would flicker the gaps between them open and shut
          a dozen times a round — the fault D-100 exists to have fixed. It also
          reads better: boxes collide, the things inside them rattle.

          `overflow-hidden` on the button above is what keeps a shaking
          contender from spilling into its neighbour. Every shake parameter is
          inherited from the grid cell the page sets it on, so this component
          needs to know nothing about the variation. */}
      <span
        className={`flex h-full min-h-0 w-full flex-col items-center justify-center ${
          S.pad
        } ${shake ? "animate-clash-shake" : ""}`}
      >
        {/* A flexible box with the image contained inside it, never a square
          sized by the panel's WIDTH — that is the D-081 runaway, measured at
          718px inside a 767px viewport. Here the window is whatever the labels
          leave and the artwork fits itself into it, so the same panel works at
          320px and at 1440px. `min-h-0` because a flex child will not shrink
          below its content otherwise, which is what lets tall artwork push the
          name off the bottom of the panel. */}
        <span className="flex min-h-0 w-full flex-1 items-center justify-center">
          {/* Fills its box, but **stops at 475px** (D-109). D-096 deliberately
            let this upscale, on the argument that capping at the artwork's own
            size left a 700px panel with a band of dead space above the name —
            and that argument holds right up to the point where the upscale
            becomes visible. The vendored art is exactly 475x475, so a panel
            taller than that is enlarging a bitmap, and on a large monitor the
            softness shows.
            The cap only bites where the fault is: below 475 nothing changes at
            all, and above it the panel trades a little dead space for an image
            that is not blown up. */}
          <img
            src={artworkFor(pokemon)}
            alt=""
            decoding="async"
            className={`h-full w-full object-contain ${ART_CAP}`}
          />
        </span>

        <span className={`${S.name} break-words text-primary`}>
          {pokemon.name}
        </span>

        {/* Both arena densities, not just `md` — the thumbnail is the only size
          with no room for them. */}
        {size !== "sm" && (
          <span className="flex flex-wrap justify-center gap-1">
            {pokemon.types.map((t) => (
              <TypeBadge key={t} type={t} size={S.badge} />
            ))}
          </span>
        )}

        {/* The value band holds its space from the start, so revealing an answer
          does not change the panel's height and shove the row below it — the
          D-050 rule about controls that arrive and push the layout around,
          applied to a number that arrives every round. */}
        <span className={`flex ${S.band} shrink-0 items-center gap-1.5`}>
          {resolved ? (
            <>
              {won && (
                <>
                  <LuCheck aria-hidden className="text-accent" />
                  <span className="sr-only">
                    Highest {statName(stat)}
                    {picked ? ", your pick" : ""}.{" "}
                  </span>
                </>
              )}
              {picked && !won && (
                <>
                  <LuX aria-hidden className="text-secondary" />
                  <span className="sr-only">Your pick. </span>
                </>
              )}
              <span
                className={`${S.value} ${won ? "text-primary" : "text-secondary"}`}
              >
                {value}
              </span>
            </>
          ) : (
            // The dash is the empty state the comparison's diff cell already uses
            // for "no value yet" (04_design §6), rather than a blank that reads
            // as a rendering failure.
            <span aria-hidden className={`${S.value} text-tertiary`}>
              –
            </span>
          )}
        </span>
      </span>
    </button>
  );
}
