import { FaCaretDown } from "react-icons/fa6";
import DexRow from "./DexRow";
import {
  COL,
  HEAD_ALIGN,
  HEAD_CELL,
  HEAD_INNER,
  ROW_HEIGHT_CLASS,
} from "./dexColumns";
import { artworkFor, getBySlug } from "../lib/pokemon";
import { SORT_LABEL, SORT_LONG_LABEL, sortRows } from "../lib/dexTable";
import { STAT_ORDER } from "../lib/stats";

// Home's dex preview (D-043), rendered with the dex table's own DexRow so the
// preview cannot drift from the tool it advertises — the same rule that keeps
// FeaturedComparison on CmpRow (D-032).
//
// Only the wrapper differs from the real table: a static header instead of sort
// buttons, no sticky positioning, and no windowing (there are six rows).

// The easter egg (D-044): these six are the author's team from the Black & White
// playthrough the project came out of (00_brainstorm §1). All six are Gen 5, and
// two of them are the site's mascots — so Volcarona and Chandelure appear here
// and in the flagship board above. Nothing marks it on screen.
const TEAM = [
  "samurott",
  "krookodile",
  "chandelure",
  "volcarona",
  "archeops",
  "mienshao",
];

const PREVIEW_SORT = "speed";

// Ordered by the tool's own comparator rather than written out in a fixed
// order: the rows genuinely are sorted by Speed, so the Speed column's
// highlight and its aria-sort stay truthful, and the preview keeps proving the
// thing the section promises ("sorted by any stat"). getBySlug is filtered
// rather than trusted, so a dataset rebuild that renamed a slug drops a row
// instead of rendering a hole.
const ROWS = sortRows(
  TEAM.map(getBySlug).filter(Boolean),
  PREVIEW_SORT,
  "desc",
);

// The header cell's geometry comes from dexColumns, the same constants the real
// table's sort headers use, so the preview header and the tool's header are the
// same row rather than two that merely resemble each other (D-043). A <span>
// where the tool has a <button>: there is nothing to sort here.
function Head({ colKey, className, align = "center" }) {
  const sorted = colKey === PREVIEW_SORT;
  return (
    <th
      scope="col"
      // Accurate rather than decorative: these rows really are sorted by Speed,
      // descending. There are no sort controls here — that is what /dex is for.
      aria-sort={sorted ? "descending" : undefined}
      className={`${HEAD_CELL} ${className}`}
    >
      <span
        className={`${HEAD_INNER} ${HEAD_ALIGN[align]} ${sorted ? "text-accent" : "text-tertiary"}`}
      >
        {SORT_LABEL[colKey]}
        {sorted && <FaCaretDown aria-hidden />}
      </span>
    </th>
  );
}

// The two illustrations this section gets (D-067, balanced in D-068, placed in
// D-069), and neither is a decorative pick: they are the **ends of the sort** —
// whoever the comparator put in the top row and whoever it put in the last —
// read off ROWS rather than named here, so they stay correct if the dataset or
// the team changes. Today that is Archeops at 110 Speed and Samurott at 70.
//
// They flank the table's top edge **symmetrically**: same size, mirrored
// rotation, clipped by the same edge. They were first placed diagonally, each at
// the corner nearest its own row, which is a better idea than it is a picture —
// nothing on screen reveals the mapping, so two differently-sized Pokémon at
// opposite corners just read as stickers. Symmetry is legible without being
// explained, and the derivation still decides *who* rather than *where*.
//
// Three things make the pair frame the heading instead of decorating the corners
// (D-072), and they are all the same idea — everything about a flanking figure
// should point at what it flanks:
//
//   · **Facing.** Both artworks face left, so on the left-hand side Samurott was
//     looking off the page. `-scale-x-100` turns it around; the two now face each
//     other, and the eye is returned to the heading instead of led away. The
//     flagship board already does this to Chandelure for the same reason.
//   · **Lean.** Both leaned outward too. They now tilt inward — and note that the
//     flip mirrors the rotation, so the left figure's `-rotate-6` renders as a
//     clockwise, inward lean.
//   · **Anchoring.** They hang off the CENTRE (`right-1/2 mr-40` / `left-1/2
//     ml-40`), not the container's edges. Pinned to the edges their distance from
//     the heading grew with the viewport, so a composition that read well at
//     1024px drifted apart into two corner ornaments at 1600px. Anchored to the
//     middle, the gap is the same at every width.
//
// A table cannot take flanking art the way the flagship board can — it fills the
// content width, so there is no margin to sit in — hence figures rising from
// behind the top edge, clipped by the table's own opaque body. The clip lands
// below the body mass rather than across it: a figure cut at the waist reads as
// pasted on, one whose legs disappear reads as standing behind.
const LEADER = ROWS[0];
const TAIL = ROWS[ROWS.length - 1];

export default function FeaturedDex() {
  return (
    <div className="relative">
      {/* Decorative, and desktop-only for the reason the flagship's mascots are:
          below lg there is no room beside the content, and art that overflows
          scrolls the whole page sideways (caught by npm run sweep:widths).
          Lazy where the flagship's art is not — this one is below the fold, and
          Home is the only route that is not code-split (D-060). */}
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
      <div className="relative z-10 overflow-hidden rounded-lg border border-border-subtle bg-surface">
        <table
          aria-rowcount={ROWS.length}
          className="w-full table-fixed border-collapse"
        >
          <caption className="sr-only">
            Six Pokémon sorted by base {SORT_LONG_LABEL[PREVIEW_SORT]},
            descending — a preview of the dex table.
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
