// The look and the choreography both games' boards share (D-105).
//
// A constants-and-helpers module rather than a `GameArena` component, and that
// is a deliberate call rather than a smaller ambition. The two arenas are NOT
// the same layout: `Higher.`'s answer *is* its panels, so its question and
// verdict live in an overlay between them; `Effective.`'s answer is a rail of
// multipliers along the bottom, so its board has a row the other one does not.
// A component covering both would have grown a prop for every difference and
// stopped being an abstraction of anything.
//
// What they genuinely share is the **board's size**, the **panel's look** and
// the **clash** — so those live here, once, and each game lays out its own
// board. That is the 06_style_guide §12 rule 8 pattern (`chipStyles.jsx`,
// `dexColumns.jsx`, `pageChrome.jsx`): when two components should look alike,
// the shared strings move to a constants module and each keeps only what
// genuinely differs.
//
// A `.jsx` module for the usual two reasons: Tailwind only scans `.jsx`, so
// these class strings would be invisible from `lib/`, and `react-refresh`
// requires a component file to export only components.

// The site header is 56px and the game bar is another 56. `svh` rather than
// `vh` so a mobile browser's collapsing toolbar cannot make the board taller
// than the screen — the unit Home's wall already uses (D-070). The floor stops
// a landscape phone from crushing the panels to nothing; it may scroll there,
// which is the right trade.
export const BOARD = "h-[calc(100svh-7rem)] min-h-[26rem]";

// `gap-px` over the board's own background is the divider — no border on any
// panel, and it stays a hairline at every width.
//
// **The background is `base`, not `border-subtle`** (D-100). The panels
// converge on the centre, so for the length of the clash the gap between the
// two halves is open and filled with whatever is behind them. In the divider's
// light grey that read as a bar flashing down the middle of the screen every
// round; in the page's own near-black it reads as what it is.
//
// **`overflow-hidden` is not decoration.** The panels travel 5rem, and without
// clipping that reaches the document and scrolls every width sideways — the
// same fault as the type grid leaking its overflow until `contain: paint`
// (D-052).
export const BOARD_SURFACE = "relative grid gap-px overflow-hidden bg-base";

/* -------------------------------------------------------------------------
   The panel's look.
   ---------------------------------------------------------------------- */

// How much of the defending type's colour sits over the page background. Low,
// because it is a field behind artwork rather than a fill: enough to tell two
// panels apart at a glance, not enough to compete with what is on them.
export const TINT = 10;

export const tintFor = (type) =>
  type
    ? `color-mix(in srgb, var(--color-type-${type}) ${TINT}%, var(--color-base))`
    : "var(--color-base)";

// The marking is an INSET ring rather than a border, because these panels sit
// edge to edge in a grid — a border would move every neighbour by 2px the
// moment a round resolved. Inline `var()` rather than a utility for the reason
// TypeBadge and StabChip already use one: the token is the value.
export const ring = (color) => ({ boxShadow: `inset 0 0 0 2px var(${color})` });

// The panel itself is a static box; its CONTENT is what moves (D-102).
export const PANEL_BOX =
  "block w-full overflow-hidden text-center transition-opacity";

/* -------------------------------------------------------------------------
   The clash (D-100, D-101, D-102).
   ---------------------------------------------------------------------- */

/**
 * The custom properties one panel needs to take part in a round's collision,
 * set on its grid cell and inherited by the content inside it — so a panel
 * component knows only that it is shaking, never how.
 *
 * `i` is the panel's slot and `n` how many there are: everything left of the
 * board's centre charges right and everything right of it charges left.
 *
 * **The shake varies per panel and is deliberately not random.** A render may
 * not be a dice roll — React is entitled to run one twice — so amplitude,
 * rotation and duration come from the round number and the slot. The same round
 * always shakes the same way and the next one differs. `--shake-x` is signed
 * and points the way the panel was already travelling, because on impact the
 * contents carry on for an instant before snapping back.
 */
export function clashVars(i, n, dealt = 0) {
  const onward = i < n / 2 ? 1 : -1;
  const v = (dealt * 5 + i * 3) % 4;
  return {
    "--round-from": onward > 0 ? "-5rem" : "5rem",
    "--shake-x": `${onward * (7 + v * 2)}px`,
    "--shake-r": `${onward * (0.3 + v * 0.15)}deg`,
    "--dur-shake": `${250 + v * 30}ms`,
  };
}
