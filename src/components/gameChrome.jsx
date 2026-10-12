// The look and the motion both games' boards share.
//
// Constants and helpers rather than a `GameArena` component, on purpose: the
// two boards aren't the same layout. In Higher the answer is the panels, so
// the question and verdict float in an overlay between them. In Effective the
// answers are buttons between the two panels, a column the other board
// doesn't have. One component covering both would grow a prop for every
// difference.
//
// What they do share is the board's size, the panel's look, and the clash
// animation, so those live here once, and each game lays out its own board.
// Like `chipStyles.jsx`, `dexColumns.jsx`, and `pageChrome.jsx`: when two
// components should look alike, the shared strings move to a constants module,
// and each keeps only what differs.
//
// A `.jsx` module for two reasons: Tailwind only scans `.jsx`, so class strings
// in `lib/` would be missed, and `react-refresh` needs a component file to
// export only components.

// Whatever space is left under the two bars, rather than a height worked out
// from them. A hand-written `calc(100svh - 7rem)` would miss each bar's 1px
// border and make every game scroll by a few pixels. `flex-1` in a
// screen-height shell asks for the space actually left, so there's no sum to
// get wrong.
//
// The minimum stops a phone in landscape crushing the panels to nothing. The
// board may scroll there, which is the right trade.
// One `min-h-*` only: two in one string would conflict, and Tailwind resolves
// that by stylesheet order rather than by the order they're written. `flex-1`
// already sets `flex-basis: 0`, so nothing needs `min-h-0` here.
export const BOARD = "flex-1 min-h-[26rem]";

// `gap-px` over the board's own background is the divider, so no panel needs a
// border, and it stays a hairline at every width.
//
// The background is `base`, not `border-subtle`. The panels charge in toward
// the centre, so during the clash the gap between the halves is open and shows
// whatever is behind them. Light grey would flash a bar down the screen every
// round; the page's near-black reads as the gap it is.
//
// `overflow-hidden` is load-bearing: the panels travel 5rem, and unclipped,
// that would make every width scroll sideways.
export const BOARD_SURFACE = "relative grid gap-px overflow-hidden bg-base";

/* -------------------------------------------------------------------------
   The panel's look.
   ---------------------------------------------------------------------- */

// How much of the type's colour sits over the page background:
// `--mix-panel-tint` in index.css, 16%, which `npm run audit:contrast` reads.
// Low, because it's a field behind artwork rather than a fill: enough to tell
// two panels apart at a glance, not enough to compete with what's on them, yet
// enough to register as a colour over near-black. The worst case for text is
// secondary text over Ice's tint, at 6.18:1 against AA's 4.5.
const tintOf = (type) =>
  `color-mix(in srgb, var(--color-type-${type}) var(--mix-panel-tint), var(--color-base))`;

/**
 * A panel's background: a tint of the Pokémon's primary type.
 *
 * One colour per panel, never two. At 16% over near-black, a yellow is olive,
 * an orange brown, and a red maroon, so two side by side read as camouflage,
 * and a blend between them is greyer still. One tint reads as its type, and the
 * badges under the name carry the full typing at full strength. `typeFill` in
 * lib/types.js applies the same rule to the dex's bars.
 *
 * Two panels of different colours also read as two sides of the board without
 * a heavier divider.
 */
export function tintFor(types = []) {
  if (!types.length) return "var(--color-base)";
  return tintOf(types[0]);
}

// The marking is an inset ring rather than a border, because the panels sit
// edge to edge in a grid, and a border would shift every neighbour by 2px when
// a round resolved. An inline `var()` rather than a class, as in TypeBadge and
// StabChip: the token is the value.
//
// The accent ring means one thing: this is the answer. The stat game rings the
// winner. The type game's answer is a button, so it rings no panel.
export const ring = (color) => ({ boxShadow: `inset 0 0 0 2px var(${color})` });

// The panel itself stays still, and its content is what moves.
export const PANEL_BOX =
  "block w-full overflow-hidden text-center transition-opacity";

/* -------------------------------------------------------------------------
   The clash.
   ---------------------------------------------------------------------- */

/**
 * The custom properties one panel needs for a round's collision, set on its
 * grid cell and inherited by the content inside, so a panel component only
 * knows that it's shaking, never how.
 *
 * `i` is the panel's slot and `n` how many there are: everything left of the
 * board's centre charges right, and everything right of it charges left.
 *
 * The shake varies per panel, and deliberately isn't random. A render can't be
 * a dice roll, since React may run one twice, so the amplitude, rotation, and
 * duration come from the round number and the slot. The same round always
 * shakes the same way, and the next one differs. `--shake-x` is signed and
 * points the way the panel was already moving, because on impact the contents
 * carry on for an instant before snapping back.
 *
 * These set how hard the panel was hit, not the final motion: each part inside
 * a panel scales and offsets them on its own (`--part-amp`, `--part-delay`,
 * `--part-dur` in index.css).
 *
 * 13 to 25px and 0.7 to 1.6° are where the contents visibly lurch and settle.
 * Less is a nudge that barely shows on a panel hundreds of pixels wide, and a
 * tilt under about a degree doesn't read as a tilt. The per-part multiplier
 * tops out at 1.22, so no single element travels more than about 30px.
 */
export function clashVars(i, n, dealt = 0) {
  const onward = i < n / 2 ? 1 : -1;
  const v = (dealt * 5 + i * 3) % 4;
  return {
    "--round-from": onward > 0 ? "-5rem" : "5rem",
    "--shake-x": `${onward * (13 + v * 4)}px`,
    // Vertical is the jolt off the impact, not a second impact, so it runs at
    // about half the horizontal throw, and its sign comes from the slot rather
    // than `onward`. Neighbouring panels bob against each other, while they
    // all lurch the same way horizontally because they hit the same thing.
    // Parts inside a panel split again on `--part-y`.
    "--shake-y": `${(i % 2 ? -1 : 1) * (6 + v * 2)}px`,
    "--shake-r": `${onward * (0.7 + v * 0.3)}deg`,
    "--dur-shake": `${250 + v * 30}ms`,
  };
}

/* -------------------------------------------------------------------------
   The cards around the games.
   ---------------------------------------------------------------------- */

// A game's card: a thumbnail band over a text body. The games index and the
// start screen show the same card at two sizes, so it's defined once. The body
// takes the 16px every surface takes.
//
// The whole card is the control, so the panels in its thumbnail take no
// handler and render as <div>s, never controls nested inside a control.
export const GAME_CARD =
  "group flex h-full w-full flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface text-left transition-colors hover:border-border-strong";
export const GAME_CARD_BODY = "flex flex-1 flex-col gap-1 p-4";
export const GAME_CARD_TITLE = "flex items-center gap-1.5 text-h4 text-primary";
// The arrow after a card's title responds to the card's hover.
export const GAME_CARD_ARROW =
  "text-tertiary transition-colors group-hover:text-secondary";

// The round's card, which carries the question and then the verdict on the
// board. A surface: 16px of padding, the lg radius, and the overlay shadow,
// because it floats over the panels. `pointer-events-auto` because the layer
// that positions it lets clicks through to the panels beneath.
export const ROUND_CARD =
  "pointer-events-auto max-w-full rounded-lg border border-border-subtle bg-surface text-center";

// Inline, because the shadow tokens are plain `:root` properties rather than
// theme tokens, used the way the z-index ladder is.
export const OVERLAY_SHADOW = { boxShadow: "var(--shadow-overlay)" };
