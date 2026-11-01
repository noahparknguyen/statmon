import { LuCheck, LuX } from "react-icons/lu";
import TypeBadge from "./TypeBadge";
import { artworkFor } from "../lib/pokemon";
import { statName } from "../lib/games";
import { PANEL_BOX, ring, tintFor } from "./gameChrome";

// One Pokémon in a round: what you click, and then what tells you what it was
// worth.
//
// Not `PokemonCard`, on purpose. That's the comparison board's spec sheet, and
// it opens with six stat bars: it would show the answer before the question.
//
// The games are an exception to the site's rule that chrome shouldn't compete
// with the data. That rule is for the tools. In a game the Pokémon are the
// data, so the panel is deliberately huge: full screen height, with the artwork
// as the subject rather than a backdrop, and the controls elsewhere.
//
// Tinted by its primary type, as everywhere on the site a Pokémon's type
// colours it. One colour even for a dual type, with the badges carrying the
// full typing. The tint also separates the panels: two of different colours
// read as two sides without a heavier divider. Its contrast is checked by
// `npm run audit:contrast`.
//
// Right and wrong without a red and green pair, since the palette has none on
// purpose: the winner takes the accent and everything else steps back. Every
// marked panel also has an icon and screen-reader text, never colour alone.

// Three sizes, which differ only in how much room the panel gets. `lg` is a
// two-up round, where each panel has half the screen. `md` is a four-up, where
// it has a quarter, and the name has to fit 160px on a 320px screen. `sm` is
// the games index thumbnail.
//
// The name and value styles are chosen per size rather than made responsive,
// because a responsive variant of a named text style produces no CSS: the
// styles are hand-written classes, so `lg:text-h2` would silently do nothing.
// A prop is the only way to change one.
//
// The artwork files are all exactly 475×475, so a bigger box would enlarge
// them.
const ART_CAP = "max-h-[475px] max-w-[475px]";

const SIZES = {
  lg: {
    box: "h-full",
    pad: "gap-3 p-3 sm:p-4",
    name: "text-h2",
    value: "text-numeral-xl",
    // The band has to clear its own numeral: the numeral styles have no
    // line-height padding, so the glyph is the full font size, and a 48px
    // figure in a 36px band would have its feet cut off. So each band is one
    // step taller than its figure.
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
  // The games index thumbnail, which is the real component rather than a
  // mock-up.
  sm: {
    // `h-full`, not a fixed height. This size only appears in `gameThumbs`'
    // band, which holds either two panels in a row or four in a 2×2, so a
    // fixed height would overflow in one case. The grid owns the height, and
    // the panel fills its cell.
    //
    // Below `sm` that band is 96px, and the name and value would leave the
    // artwork none of it, so a phone's thumbnail is the artwork alone, with
    // the winner's ring and the others dimmed.
    box: "h-full",
    pad: "gap-1 p-2",
    name: "text-caption max-sm:hidden",
    value: "text-stat-sm",
    band: "h-6 max-sm:hidden",
    badge: "sm",
  },
};

export default function ContenderPanel({
  pokemon,
  // The typing to show. A game set to an earlier generation passes that
  // generation's; everywhere else shows today's.
  types = pokemon.types,
  stat,
  value,
  resolved = false,
  picked = false,
  won = false,
  onPick = null,
  size = "md",
  className = "",
  shake = false,
  lazy = false,
}) {
  const S = SIZES[size];
  // The primary type's tint, one colour for a dual type too.
  const tint = tintFor(types);

  // Four states on one scale: the winner is loud, your wrong pick is present,
  // and the rest recede. Opacity rather than a fourth colour.
  const mark = !resolved
    ? null
    : won
      ? ring("--color-accent")
      : picked
        ? ring("--color-border-strong")
        : null;

  // A button only when it is one. With no `onPick` this is a thumbnail, on
  // Home's preview and the games index, where the index wraps it in a <Link>.
  // A <button> there would be a button inside a link, which is invalid HTML,
  // and a disabled one would swallow the clicks meant for the link. As
  // `AbilityChips` does, no handler means a label rather than a control.
  const Tag = onPick ? "button" : "div";

  return (
    <Tag
      {...(onPick
        ? { type: "button", disabled: resolved, onClick: onPick }
        : null)}
      // No aria-label: the accessible name comes from the contents, the
      // Pokémon's name and types, which is what a speech-control user would
      // say (WCAG 2.5.3).
      // `className` is for layout only: corner radius, and room at the top.
      // The winner's marking is an inset ring that traces the panel's own box,
      // so in a thumbnail clipped by a card's `rounded-lg`, a square panel
      // would get square ring corners that the card then cuts off. The ring
      // has to be told about the curve. The room is for a board whose
      // question card sits over its panels' tops (GameHigher). The panel sets
      // neither of its own, so appending one here can't clash.
      className={`${PANEL_BOX} ${S.box} ${
        resolved && !won && !picked ? "opacity-50" : ""
      } ${className}`}
      style={{ backgroundColor: tint, ...mark }}
    >
      {/* The panel stays still, and its content is what moves. The clash
          shakes what's inside each panel rather than the panel itself, because
          shaking the panels would flicker the gaps between them open and shut
          a dozen times a round. It reads better too: the boxes collide, and
          what's inside them rattles.

          `overflow-hidden` on the panel stops a shaking Pokémon spilling into
          its neighbour. The shake's settings are inherited from the grid cell
          the page sets them on, so this component needs to know nothing about
          them. */}
      <span
        className={`flex h-full min-h-0 w-full flex-col items-center justify-center ${
          S.pad
        } ${shake ? "animate-clash-shake" : ""}`}
      >
        {/* A flexible box with the image fitted inside it, never a square sized
          by the panel's width, which would grow to 718px on a 767px screen.
          The window is whatever space the labels leave, and the artwork fits
          itself into it, so the same panel works at 320px and at 1440px.
          `min-h-0` because a flex child won't shrink below its content
          otherwise, and tall artwork would push the name off the panel. */}
        <span className="flex min-h-0 w-full flex-1 items-center justify-center">
          {/* Fills its box, but stops at 475px, the artwork's real size: beyond
            that it would be enlarging a bitmap, and on a large monitor the
            softness shows. Below 475 the cap changes nothing, and above it the
            panel trades a little empty space for a sharp image. */}
          {/* `lazy` is off by default, on purpose. In a game the artwork is the
            subject and above the fold, so it should load right away: React 19
            preloads any image without `loading="lazy"`, which is what you want
            for the thing the round is about. Home's preview sits below the
            fold, so it passes `lazy`, like the other previews there. */}
          <img
            src={artworkFor(pokemon)}
            alt=""
            decoding="async"
            loading={lazy ? "lazy" : undefined}
            className={`h-full w-full object-contain ${ART_CAP}`}
          />
        </span>

        <span className={`${S.name} break-words text-primary`}>
          {pokemon.name}
        </span>

        {/* At both game sizes, not just `md`: only the thumbnail has no room
          for them. */}
        {size !== "sm" && (
          <span className="flex flex-wrap justify-center gap-1">
            {types.map((t) => (
              <TypeBadge key={t} type={t} size={S.badge} />
            ))}
          </span>
        )}

        {/* The value band holds its space from the start, so revealing an
          answer doesn't change the panel's height and shove the row below
          it. */}
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
            // The dash is the comparison board's "no value yet", rather than a
            // blank that would look like something failed to render.
            <span aria-hidden className={`${S.value} text-tertiary`}>
              –
            </span>
          )}
        </span>
      </span>
    </Tag>
  );
}
