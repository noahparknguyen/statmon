import DexHeadLabel from "./DexHeadLabel";
import DexRow from "./DexRow";
import {
  COL,
  HEAD_ALIGN,
  HEAD_CELL,
  HEAD_INNER,
  ROW_HEIGHT_CLASS,
} from "./dexColumns";
import { artworkFor, getBySlug } from "../lib/pokemon";
import { SORT_LONG_LABEL, sortRows } from "../lib/dexTable";
import { STAT_ORDER } from "../lib/stats";

// Home's dex preview, built from the dex table's own DexRow, so the preview
// can't drift from the tool it advertises, as FeaturedComparison uses CmpRow.
//
// Only the wrapper differs from the real table: a static header instead of sort
// buttons, no sticky header, and no windowing, since the preview is one screen
// of rows where the tool has 1,259.

// An easter egg: these seven are a team from the Black and White replay the
// site came out of. All seven are Gen 5, and two of them are the site's mascots,
// so Volcarona and Chandelure appear here and on the comparison board above.
// Nothing on screen points it out.
//
// Beartic carried the HMs, and it's here for a reason beyond sentiment: at 50
// Speed it's the slowest of the seven, the other end of this preview's sort.
// The two figures beside the table are the sort's two ends, so it gives the pair
// a real spread: Archeops at 110 against Beartic at 50.
const TEAM = [
  "samurott",
  "krookodile",
  "chandelure",
  "volcarona",
  "archeops",
  "mienshao",
  "beartic",
];

const PREVIEW_SORT = "speed";

// Ordered by the tool's own sort rather than written in a fixed order: the rows
// really are sorted by Speed, so the Speed column's highlight and its aria-sort
// stay true, and the preview shows what the section promises, "sorted by any
// stat". getBySlug is filtered rather than trusted, so a rebuilt dataset that
// renamed a slug drops a row instead of leaving a hole.
const ROWS = sortRows(
  TEAM.map(getBySlug).filter(Boolean),
  PREVIEW_SORT,
  "desc",
);

// The header cell's layout comes from dexColumns, the same constants the real
// table's sort headers use, so the two headers are one design rather than two
// that look alike. A <span> where the tool has a <button>, since there's
// nothing to sort here.
function Head({ colKey, className, align = "right" }) {
  const sorted = colKey === PREVIEW_SORT;
  return (
    <th
      scope="col"
      // Accurate rather than decorative: these rows really are sorted by Speed,
      // highest first. The sort controls are on /dex.
      aria-sort={sorted ? "descending" : undefined}
      className={`${HEAD_CELL} ${className}`}
    >
      <span
        className={`${HEAD_INNER} ${HEAD_ALIGN[align]} ${sorted ? "text-accent" : "text-tertiary"}`}
      >
        <DexHeadLabel
          colKey={colKey}
          dir={sorted ? "desc" : null}
          align={align}
        />
      </span>
    </th>
  );
}

// This section's two illustrations aren't decorative picks: they're the ends of
// the sort, whoever the sort put in the first row and whoever in the last. Read
// from ROWS rather than named here, so they stay right if the dataset or the
// team changes. Today that's Archeops at 110 Speed and Beartic at 50.
//
// They flank the table's top edge symmetrically: the same size, mirrored
// rotation, clipped by the same edge. Symmetry reads without explanation, and
// the sort still decides who, not where.
//
// Everything about a flanking figure points at what it flanks:
//
//   · Facing. The artworks face left, so the figure on the left would look off
//     the page. `-scale-x-100` turns it round, so the two face each other, and
//     the eye goes back to the heading. The comparison board turns Chandelure
//     for the same reason.
//   · Lean. Both tilt inward. The flip mirrors the rotation too, so the left
//     figure's `-rotate-6` renders as a clockwise, inward lean.
//   · Anchoring. They hang off the centre (`right-1/2 mr-40` and `left-1/2
//     ml-40`), not the container's edges. Pinned to the edges, they'd drift
//     apart as the screen widened. From the centre, the gap is the same at
//     every width.
//
// A table can't take side art the way the comparison board can, since it fills
// the content width and leaves no margin, so the figures rise from behind the
// top edge, clipped by the table's opaque body. The clip falls below each
// figure's middle: a figure cut at the waist looks pasted on, while one whose
// legs disappear looks like it's standing behind.
const LEADER = ROWS[0];
const TAIL = ROWS[ROWS.length - 1];

export default function FeaturedDex() {
  return (
    <div className="relative">
      {/* Decorative, and desktop-only, like the comparison board's figures:
          below lg there's no room beside the content, and art that overflows
          scrolls the whole page sideways. Lazy, unlike the board's art,
          because this is below the fold, and Home is the only page that isn't
          loaded on demand. */}
      {LEADER && (
        <img
          src={artworkFor(LEADER)}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          className="hidden lg:block pointer-events-none absolute z-0 left-1/2 ml-40 -top-36 w-60 -rotate-6 drop-shadow-art"
        />
      )}
      {TAIL && TAIL !== LEADER && (
        <img
          src={artworkFor(TAIL)}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          className="hidden lg:block pointer-events-none absolute z-0 right-1/2 mr-40 -top-36 w-60 -rotate-6 -scale-x-100 drop-shadow-art"
        />
      )}
      <div className="relative z-1 overflow-hidden rounded-lg border border-border-subtle bg-surface">
        <table
          aria-rowcount={ROWS.length}
          className="w-full table-fixed border-collapse"
        >
          {/* The count comes from the rows rather than being written out, so it
              stays right if the team changes, and a screen reader is the one
              audience that couldn't see it had gone wrong. */}
          <caption className="sr-only">
            {ROWS.length} Pokémon sorted by base {SORT_LONG_LABEL[PREVIEW_SORT]}
            , descending. A preview of the dex table.
          </caption>
          <thead>
            <tr>
              <Head colKey="dex" className={COL.dex} align="left" />
              <Head colKey="name" className={COL.name} align="left" />
              <th scope="col" className={`${HEAD_CELL} ${COL.types}`}>
                <span
                  className={`${HEAD_INNER} ${HEAD_ALIGN.left} text-tertiary`}
                >
                  Types
                </span>
              </th>
              {STAT_ORDER.map((k) => (
                <Head key={k} colKey={k} className={COL.stat} />
              ))}
              <Head colKey={PREVIEW_SORT} className={COL.mobileStat} />
              <Head colKey="bst" className={COL.bst} align="right" />
              <th aria-hidden="true" className={`${HEAD_CELL} ${COL.go}`} />
            </tr>
          </thead>
          <tbody>
            {ROWS.map((p, i) => (
              <DexRow
                key={p.slug}
                pokemon={p}
                rowIndex={i}
                keys={STAT_ORDER}
                asof={null}
                mobileStat={PREVIEW_SORT}
                heightClass={ROW_HEIGHT_CLASS}
                animate
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
