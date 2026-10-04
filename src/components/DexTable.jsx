import DexHeadLabel from "./DexHeadLabel";
import DexRow from "./DexRow";
import { useWindowedRows } from "../lib/useWindowedRows";
import { SORT_LABEL, SORT_LONG_LABEL } from "../lib/dexTable";
import {
  COL,
  HEAD_ALIGN,
  HEAD_CELL,
  HEAD_INNER,
  ROW_HEIGHT,
  ROW_HEIGHT_CLASS,
} from "./dexColumns";

// The full-dex table. A real <table> rather than a grid of divs, so the browser
// gives every cell its column header for free; windowing is done with a spacer
// row above and below the rendered slice, which keeps that structure intact.
//
// The header has to out-paint the rows scrolling under it, and a background
// alone does not achieve that: the stat cells position their fill and number
// (relative/absolute) so the number sits over the bar, and a positioned element
// paints above a non-positioned one — with the later element in the DOM winning
// between two at `auto`. The rows come after <thead>, so their bars and numbers
// were drawing straight over the sticky header while the un-positioned name and
// type cells slid under it correctly.
//
// So the header takes an explicit rung on the z-ladder: above row content, far
// below the site header's --z-sticky. Set inline because the z tokens are plain
// :root custom properties, not theme tokens (06_style_guide §13) — the same way
// Layout sets the site header. (D-041)
const STICKY_HEAD = { zIndex: "var(--z-raised)" };

// `align` defaults to right, because every sortable column but two holds a
// number (DexHeadLabel); `#` and Name pass `left`.
function SortHeader({ colKey, view, onSort, className, align = "right" }) {
  const active = view.sort === colKey;
  const dir = active ? view.dir : null;

  return (
    <th
      scope="col"
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
      // top-14 is the site header's h-14; the two have to agree or the sticky
      // header either overlaps it or leaves a gap.
      className={`sticky top-14 ${HEAD_CELL} ${className}`}
      style={STICKY_HEAD}
    >
      <button
        type="button"
        onClick={() => onSort(colKey)}
        className={`${HEAD_INNER} transition-colors hover:text-primary ${HEAD_ALIGN[align]} ${active ? "text-accent" : "text-tertiary"}`}
      >
        <DexHeadLabel colKey={colKey} dir={dir} align={align}>
          {/* The on-screen label is an abbreviation ("SpA", "#"), so the full name
            is appended for screen readers. It is appended rather than replacing
            the name with aria-label because WCAG 2.5.3 (Label in Name) requires
            the accessible name to contain the visible text — "Sort by Attack"
            does not contain "Atk", so speech control could not act on it.

            **Two of the nine are not abbreviations**, and appending the long
            name to those produced "Name sort by Name" and "HP sort by HP".
            Nothing failed — it is only heard, never seen, which is how it
            survived. The name is added only when it says something the visible
            label did not, and the comma is what stops "Atk sort by Attack"
            running together as one word. */}
          <span className="sr-only">
            {SORT_LONG_LABEL[colKey] === SORT_LABEL[colKey]
              ? ", sort"
              : `, sort by ${SORT_LONG_LABEL[colKey]}`}
          </span>
        </DexHeadLabel>
      </button>
    </th>
  );
}

// Stands in for the rows above and below the rendered slice, so the scrollbar
// and the scroll position match the full list.
//
// Deliberately one cell with NO colSpan. A colSpan spanning every column *makes*
// the table that wide: column count is the maximum across rows, so a colSpan of
// 10 created ten columns even at phone widths where seven of the headers are
// display:none — the seven phantom columns took the space and crushed the name
// column to the width of a sprite.
function Spacer({ height }) {
  return (
    <tr aria-hidden="true">
      <td style={{ height }} />
    </tr>
  );
}

// `keys` is the lens's stat columns — the modern six, or Gen 1's five with a
// single Special (D-049) — passed in rather than read from STAT_ORDER, so the
// header, the rows and the sort controls cannot disagree about what is shown.
export default function DexTable({ rows, view, keys, onSort, mobileStat }) {
  const { ref, start, end, padTop, padBottom } = useWindowedRows({
    count: rows.length,
    rowHeight: ROW_HEIGHT,
  });

  if (rows.length === 0) {
    return (
      // An inline empty state (§12.3): one sentence in `text-body-sm`
      // tertiary, where the content would have been. It was `text-body`, the
      // one empty state on the site set a size up from the rest.
      <p className="border-t border-border-subtle py-16 text-center text-body-sm text-tertiary">
        No Pokémon match these filters.
      </p>
    );
  }

  return (
    <div ref={ref}>
      <table
        // The DOM only ever holds a slice of the rows, so the table states the
        // real total and each row states its real position (DexRow).
        aria-rowcount={rows.length}
        className="w-full table-fixed border-collapse"
      >
        <caption className="sr-only">
          Base stats for every Pokémon
          {view.asof == null ? "" : ` as of Generation ${view.asof}`}, sorted by{" "}
          {SORT_LONG_LABEL[view.sort]},{" "}
          {view.dir === "asc" ? "ascending" : "descending"}.
        </caption>
        <thead>
          <tr>
            <SortHeader
              colKey="dex"
              view={view}
              onSort={onSort}
              className={COL.dex}
              align="left"
            />
            <SortHeader
              colKey="name"
              view={view}
              onSort={onSort}
              className={COL.name}
              align="left"
            />
            <th
              scope="col"
              className={`sticky top-14 ${HEAD_CELL} ${COL.types}`}
              style={STICKY_HEAD}
            >
              {/* Not sortable, but the same cell geometry as its neighbours —
                  it used its own px-2/py-0 before and sat a few px off them. */}
              <span
                className={`${HEAD_INNER} ${HEAD_ALIGN.left} text-tertiary`}
              >
                Types
              </span>
            </th>
            {keys.map((key) => (
              <SortHeader
                key={key}
                colKey={key}
                view={view}
                onSort={onSort}
                className={COL.stat}
              />
            ))}
            {mobileStat && (
              <SortHeader
                colKey={mobileStat}
                view={view}
                onSort={onSort}
                className={COL.mobileStat}
              />
            )}
            <SortHeader
              colKey="bst"
              view={view}
              onSort={onSort}
              className={COL.bst}
              align="right"
            />
          </tr>
        </thead>
        <tbody>
          {padTop > 0 && <Spacer height={padTop} />}
          {rows.slice(start, end).map((p, i) => (
            <DexRow
              key={p.slug}
              pokemon={p}
              rowIndex={start + i}
              keys={keys}
              asof={view.asof}
              mobileStat={mobileStat}
              heightClass={ROW_HEIGHT_CLASS}
            />
          ))}
          {padBottom > 0 && <Spacer height={padBottom} />}
        </tbody>
      </table>
    </div>
  );
}
