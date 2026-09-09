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

// Whatever is left under the two bars, rather than a height computed from
// them (D-110).
//
// It was `calc(100svh - 7rem)` — the two 56px bars subtracted by hand — and it
// was 2px short, because each of those bars also carries a 1px bottom border
// the arithmetic did not know about. Every game scrolled by a few pixels
// forever. `flex-1` inside a viewport-height shell asks for the space that is
// actually left, so there is no sum to get wrong and no border that can
// reintroduce it.
//
// The floor stops a landscape phone crushing the panels to nothing; it may
// scroll there, which is the right trade.
// One `min-h-*` only. `min-h-0 ... min-h-[26rem]` was two conflicting
// utilities in one string, and Tailwind resolves that by stylesheet order
// rather than by the order they are written — the trap D-042 documents and
// TypeBadge's `radius` prop exists to avoid. `flex-1` already sets
// `flex-basis: 0`, so nothing needed `min-h-0` here; the floor is the one that
// means something.
export const BOARD = "flex-1 min-h-[26rem]";

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
//
// **Raised from 10 to 16 (D-133).** At 10 neither hue of a dual type actually
// registered as colour over near-black, so the only thing the eye could find on
// the panel was the seam between them — the artifact was more legible than the
// thing it was an artifact of. 16 is still a field rather than a fill, and the
// contrast audit has room: worst-case secondary text over a tint is 6.18 at 16
// against groups 10/11's AA floor of 4.5, and does not reach it until past 20.
export const TINT = 16;

const tintOf = (type) =>
  `color-mix(in srgb, var(--color-type-${type}) ${TINT}%, var(--color-base))`;

/**
 * A panel's background for a whole TYPING rather than one type (D-107).
 *
 * A dual type gets a diagonal gradient between its two tints, which is the one
 * place on this site a gradient sits behind content — 04_design §2 reserves the
 * *flame* gradient for the hero and says never behind data, and this is a
 * different thing: two type colours saying "this is two types", which is the
 * §3 idea (a Pokémon's typing colours its representation) finally able to say
 * both halves. Volcarona has been rendering as Bug alone since the arena
 * shipped.
 *
 * **The stops are back to 25/75, and 45/55 was the mistake (D-133).** The
 * measurement that produced 45/55 optimised the wrong quantity. It asked what
 * FRACTION OF THE SURFACE was visibly desaturated and drove it from 29.7% to
 * 5.9% — but the eye does not detect absolute desaturation, it detects rate of
 * change. Compressing the whole A→B transition into a tenth of the gradient
 * made the muddy region small and the gradient STEEP, and a steep transition
 * across a 300px panel is a visible band. Every dual-type panel had a diagonal
 * stripe across it that read as a light leak. The mud was traded for an edge,
 * and the edge is far more noticeable than the mud ever was.
 *
 * At panel scale a long blend is the right answer, because it spreads the
 * desaturated midpoint over hundreds of pixels where it reads as depth rather
 * than as a muddy zone. That is NOT true at bar scale, which is why `typeFill`
 * keeps 45/55 over its 28px height and solves the same problem by choosing a
 * better axis instead. Interpolating in oklab was measured and rejected — it
 * fixes gamma darkening, not opposite hues, and scored slightly worse (D-130).
 *
 * **`to bottom right`, not a fixed 135deg.** 135deg is 45° regardless of the
 * box, but these panels are not a fixed shape: a two-up board gives each one
 * roughly a square and a four-up board gives it something near 1:2. A keyword
 * corner tracks the panel's own diagonal at every count and width, so the wash
 * always runs corner to corner instead of slicing across at an angle the panel
 * does not have.
 *
 * Returns a **background**, not a background-color — a caller setting
 * `backgroundColor` from this will silently render nothing for a dual type.
 */
export function tintFor(types = []) {
  if (!types.length) return "var(--color-base)";
  if (types.length === 1) return tintOf(types[0]);
  const [a, b] = types;
  return `linear-gradient(to bottom right, ${tintOf(a)} 0%, ${tintOf(a)} 25%, ${tintOf(b)} 75%, ${tintOf(b)} 100%)`;
}

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
 *
 * **These are the panel's ENVELOPE, not the final motion.** Each part inside a
 * panel scales and re-phases them on its own (`--part-amp`, `--part-delay`,
 * `--part-dur` in index.css), so what these numbers set is how hard this
 * particular panel was hit, and the parts answer it independently.
 *
 * **The distances were raised, because the collision was too polite.** 7–13px
 * over a panel several hundred px wide is a nudge — legible in a diff and
 * almost invisible on screen — and the rotation topped out at 0.75°, which is
 * below the angle at which a tilt reads as a tilt. 13–25px and 0.7–1.6° land
 * where the contents visibly lurch and settle. The per-part multiplier tops out
 * at 1.22, so the widest any single element travels is about 30px.
 */
export function clashVars(i, n, dealt = 0) {
  const onward = i < n / 2 ? 1 : -1;
  const v = (dealt * 5 + i * 3) % 4;
  return {
    "--round-from": onward > 0 ? "-5rem" : "5rem",
    "--shake-x": `${onward * (13 + v * 4)}px`,
    // **Vertical is the jolt off the impact, not a second impact**, so it runs
    // at roughly half the horizontal throw and its sign comes from the SLOT
    // rather than from `onward` — neighbouring panels bob against each other,
    // where they all lurch the same way horizontally because they all hit the
    // same thing. Parts inside a panel then split again on `--part-y`.
    "--shake-y": `${(i % 2 ? -1 : 1) * (6 + v * 2)}px`,
    "--shake-r": `${onward * (0.7 + v * 0.3)}deg`,
    "--dur-shake": `${250 + v * 30}ms`,
  };
}
