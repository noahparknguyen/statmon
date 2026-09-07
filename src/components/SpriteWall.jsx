import { ALL_POKEMON, spriteFor } from "../lib/pokemon";

// Home's hero (D-070): a drifting wall of pixel sprites with the wordmark and
// tagline on a scrim over it, sized to own most of the first screen.
//
// This is the third greeting in one session and the first that is the whole
// screen. It reverses D-023's product-as-hero — the comparison board is no
// longer the first thing you see — which is a real trade recorded in the log
// rather than made quietly. The board still crests the fold at 72vh, so the
// hero promises something below it instead of hiding it.
//
// Sampled, not listed: WALL_COLS x WALL_ROWS entries taken at even intervals
// across the default forms in dex order, so the wall crosses all nine
// generations. Forms sit after the 1,025 species in the dataset, so sampling
// everything would spend a corner of the wall on Megas.
//
// The block's dimensions are set by the *worst case for repetition*, not by
// what looks like enough. A seam-free loop needs the layer to be four identical
// copies of one block, so any viewport that shows more than one block sees the
// same Pokémon twice. 14 columns covers 2688px of desktop at 2x tiles; 7 rows
// is what a 390px phone needs, where the tiles halve and 72vh is over six rows
// tall — at 4 rows the top of the wall visibly repeated a third of the way
// down. 98 sprites, ~108KB, and every one of them is already cached by the dex.
const WALL_COLS = 14;
const WALL_ROWS = 7;
export const WALL_TILES = WALL_COLS * WALL_ROWS;

const SPECIES = ALL_POKEMON.filter((p) => p.isDefault);
const SAMPLE = Array.from(
  { length: WALL_TILES },
  (_, i) => SPECIES[Math.round((i * (SPECIES.length - 1)) / (WALL_TILES - 1))],
);

// One copy of the grid. The wall renders four of these in an explicit 2x2 so
// the diagonal drift can translate exactly -50%/-50% and land copy four where
// copy one started, seam-free. The translation is a percentage, so the
// responsive tile size below cannot break it.
//
// Tiles are 2x the sprites' native 96px at md and up: `pixelated` at exactly
// double is nearest-neighbour, so it is crisper than any intermediate size.
// Native 96px below that, or a 390px phone shows two columns of a grid.
function Block() {
  return (
    <div
      className="grid shrink-0"
      style={{
        gridTemplateColumns: `repeat(${WALL_COLS}, var(--wall-tile))`,
        gridAutoRows: "var(--wall-tile)",
      }}
    >
      {SAMPLE.map((p, i) => (
        <img
          key={`${p.slug}-${i}`}
          src={spriteFor(p)}
          alt=""
          width="96"
          height="96"
          decoding="async"
          className="h-full w-full [image-rendering:pixelated]"
        />
      ))}
    </div>
  );
}

// `svh`, not `vh`. On a phone `vh` is measured against the viewport with the
// browser chrome RETRACTED, so a 72vh hero is taller than 72% of what you can
// actually see when the page loads — the classic reason full-height heroes
// overshoot on iOS. `svh` measures the chrome-visible viewport, so the hero fits
// at rest; and unlike `dvh` it does not resize while the URL bar hides and
// shows, which would make the whole page jump as you scroll. Identical to `vh`
// on desktop, so nothing above `md` changes.
export default function SpriteWall({ children }) {
  return (
    <section className="relative overflow-hidden h-[72svh] min-h-[26rem] flex items-center justify-center">
      {/* Decorative: 56 sprite names read out in sequence would be noise, and
          the heading on top is what the section is actually about. */}
      <div aria-hidden className="absolute inset-0">
        <div className="grid w-max grid-cols-2 animate-wall [--wall-tile:6rem] md:[--wall-tile:12rem]">
          <Block />
          <Block />
          <Block />
          <Block />
        </div>
      </div>

      {/* The scrim. Its depth is not a taste call: --hero-scrim is the number
          `npm run audit:contrast` checks text-primary against, over the worst
          backdrop a sprite can produce (a pure-white pixel). Changing one
          without the other is what the shared token prevents. The gradient on
          top only ever deepens it, and lets the wall end without a hard line. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--color-base) var(--hero-scrim), transparent)",
        }}
      />
      {/* Two gradients over the flat scrim, both of which only ever ADD base —
          so --hero-scrim stays the true floor and the audited guarantee holds
          everywhere, while the type sits somewhere better than the floor.
          A radial pool behind the wordmark, because a sprite landing directly
          under it is legible by the numbers and still busy to look at; and a
          bottom fade so the wall ends by becoming the page rather than by
          stopping. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 44% 38% at 50% 50%, var(--color-base) 0%, color-mix(in srgb, var(--color-base) 55%, transparent) 45%, transparent 75%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-40"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, transparent, var(--color-base))",
        }}
      />

      <div className="relative px-4 text-center">{children}</div>
    </section>
  );
}
