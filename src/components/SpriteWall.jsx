import { ALL_POKEMON, spriteFor } from "../lib/pokemon";

// Home's opening screen: a drifting wall of pixel sprites with the wordmark and
// tagline on a scrim over it, filling most of the first screen. The comparison
// board still shows at the bottom of the first screen, at 72% of its height, so
// the wall points to what's below rather than hiding it.
//
// Sampled, not listed: WALL_COLS × WALL_ROWS entries taken at even intervals
// across the default forms in dex order, so the wall spans all nine
// generations. Forms come after the 1,025 species in the dataset, so sampling
// everything would spend a corner of the wall on Megas.
//
// The block's size is set by the worst case for repetition. A seamless loop
// needs the layer to be four identical copies of one block, so any screen that
// shows more than one block sees the same Pokémon twice. 14 columns cover
// 2,688px of desktop at double-size tiles. 7 rows is what a 390px phone needs,
// where the tiles are half size and 72% of the screen is over six rows tall:
// with fewer, the top of the wall visibly repeats partway down. That's 98
// sprites.
const WALL_COLS = 14;
const WALL_ROWS = 7;
export const WALL_TILES = WALL_COLS * WALL_ROWS;

const SPECIES = ALL_POKEMON.filter((p) => p.isDefault);
const SAMPLE = Array.from(
  { length: WALL_TILES },
  (_, i) => SPECIES[Math.round((i * (SPECIES.length - 1)) / (WALL_TILES - 1))],
);

// One copy of the grid. The wall renders four of these in a 2×2, so the
// diagonal drift can move exactly -50%/-50% and land the fourth copy where the
// first started, with no seam. The movement is a percentage, so the responsive
// tile size below can't break it.
//
// From md up, tiles are twice the sprites' native 96px: `pixelated` at exactly
// double size is nearest-neighbour scaling, so it's crisper than any size in
// between. Native 96px below that, or a 390px phone would show two columns.
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

// `svh`, not `vh`. On a phone, `vh` is measured with the browser's toolbars
// hidden, so a 72vh hero is taller than 72% of what you can see when the page
// loads, which is why full-height heroes overshoot on iOS. `svh` measures the
// screen with the toolbars showing, so the hero fits at rest, and unlike `dvh`
// it doesn't resize as the address bar hides and shows, which would make the
// page jump as you scroll. On a desktop it's the same as `vh`.
export default function SpriteWall({ children }) {
  return (
    <section className="relative overflow-hidden h-[72svh] min-h-[26rem] flex items-center justify-center">
      {/* Decorative: 392 sprite names read out in a row would be noise, and the
          heading on top is what the section is about. */}
      <div aria-hidden className="absolute inset-0">
        <div className="grid w-max grid-cols-2 animate-wall [--wall-tile:6rem] md:[--wall-tile:12rem]">
          <Block />
          <Block />
          <Block />
          <Block />
        </div>
      </div>

      {/* The scrim. Its depth isn't a matter of taste: --hero-scrim is the value
          `npm run audit:contrast` checks text-primary against, over the worst
          backdrop a sprite can produce, a pure white pixel. The shared token
          stops one changing without the other. The gradients above it only
          ever deepen it, and let the wall end without a hard line. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--color-base) var(--hero-scrim), transparent)",
        }}
      />
      {/* Two gradients over the flat scrim, which only ever add more of the
          page colour, so --hero-scrim stays the true minimum and the audited
          contrast holds everywhere, while the text sits somewhere better than
          the minimum. A soft pool behind the wordmark, because a sprite right
          under it passes the contrast check but is still busy to look at, and
          a fade at the bottom, so the wall ends by becoming the page rather
          than by stopping. */}
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
