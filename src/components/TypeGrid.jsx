import TypeBadge from "./TypeBadge";
import { capitalize, typeAbbr } from "../lib/types";
import { chartAsOf, formatMult, typesIn } from "../lib/typeChart";

// The effectiveness matrix: one row per attacking type and one column per
// defending type, for the generation being read.
//
// Every cell has a fill, on a brightness scale. Red and green are out: they
// clash with 18 type colours and aren't colourblind-safe. Brightness is
// colourblind-safe, and runs the way the meaning does: resisted cells sink
// below the surface, and super-effective ones rise above it. With fills that
// differ, the grid can be scanned rather than read cell by cell.
//
// 1× cells show no text, since 324 repetitions of "1×" would be noise, but
// they keep screen-reader text, because a screen reader walks the grid cell by
// cell and an empty cell would tell it nothing.
//
// The axis badges take the cells' `rounded-xs` corners rather than the pill
// shape they have everywhere else: in a grid they are cells, and pills beside
// slightly rounded rectangles would look like two systems sharing a table.
//
// A real <table> with scoped headers, so a screen reader announces each cell's
// attacker and defender for free, where a grid of divs would need it all
// rebuilt with ARIA.
//
// The panel scrolls sideways on a narrow screen, the one place on the site
// that does. The comparison board and the dex avoid it, but they're lists
// whose columns can be dropped, and no subset of a matrix still answers the
// question. The page around it never scrolls sideways.

// The scale is built around the question people bring to a type chart, "what
// is super effective?", so 2× gets the one loud fill and everything else stays
// quiet.
//
// A darker fill for "resisted" wouldn't work: on a near-black page the dark
// end has no room left. Brightness is where the range is, so the accent goes
// up and the rest stays down.
//
// 55% accent into the elevated colour is the ceiling: the 2× text on it is
// 5.04:1, and a brighter fill would drop it below AA. Mixed from two tokens
// rather than hard-coded, like DexRow's stat fill. The share is
// `--mix-grid-strong` in index.css, which `npm run audit:contrast` reads.
const STRONG_FILL = {
  backgroundColor:
    "color-mix(in srgb, var(--color-accent) var(--mix-grid-strong), var(--color-elevated))",
};

// Marking the selected column.
//
// A wash over the cells alone can't do it: any wash strong enough to see would
// push the multiplier text under it below AA. So an accent rule runs down each
// edge of the column instead, which costs the text nothing, with the most wash
// that still keeps AA on top. The 2× text under it is 4.53:1.
const SELECTED_WASH = {
  backgroundColor:
    "color-mix(in srgb, var(--color-accent) var(--mix-grid-wash), transparent)",
};

// The column is framed on all four sides, so the top and bottom close it off
// rather than leaving two rules running into nothing. The header cell carries
// the top edge and the last row the bottom.
//
// Drawn as inset shadows, not borders. In a collapsed table a border is part of
// the layout, so selecting a type would grow the grid by 2px and make it jump.
// An inset shadow takes no space. It's drawn in the cell's 1px padding, the
// gutter, which the cell's fill doesn't cover, so the lines still run unbroken
// down the column. An outset shadow would be painted over by the neighbouring
// cells.
const ACCENT = "var(--color-accent)";
const selectedEdge = (selected, { top = false, bottom = false } = {}) =>
  selected
    ? {
        boxShadow: [
          `inset 1px 0 0 ${ACCENT}`,
          `inset -1px 0 0 ${ACCENT}`,
          ...(top ? [`inset 0 1px 0 ${ACCENT}`] : []),
          ...(bottom ? [`inset 0 -1px 0 ${ACCENT}`] : []),
        ].join(", "),
      }
    : undefined;

const CELL = {
  strong: "text-primary", // 2×, the only loud cell
  neutral: "bg-elevated", // 1×, the baseline
  weak: "bg-base text-tertiary", // ½×, sunk and quiet
  none: "bg-base text-primary", // 0×, the same floor, with a bright glyph
};

const cellClass = (mult) =>
  mult > 1
    ? CELL.strong
    : mult === 0
      ? CELL.none
      : mult < 1
        ? CELL.weak
        : CELL.neutral;

export default function TypeGrid({ asof = null, highlight = [] }) {
  const types = typesIn(asof);
  const chart = chartAsOf(asof);

  return (
    // The bordered panel is the scroll container, so the edge of the
    // scrollable area is visible, rather than the page just ending mid-table.
    // overflow-y is pinned to hidden: setting only overflow-x turns the other
    // axis to `auto`, and the cross-hair's full-height bar (index.css) would
    // then count as vertical overflow and add a scrollbar inside the panel.
    // p-1.5 keeps the table off the edge, so the panel's 16px corner radius
    // doesn't cut across the corner badges.
    // `tabIndex` and `role` are needed for WCAG 2.1.1: a scroll container that
    // can't take focus can't be scrolled from a keyboard at all, and at 390px
    // ten of the 18 columns are off screen. Focusable and named, it's a region
    // a keyboard user can tab to and scroll with the arrow keys. The grid has
    // no focusable children, so nothing is hidden by this.
    <div
      tabIndex={0}
      role="region"
      aria-label="Type effectiveness chart, scrollable"
      className="type-grid-panel overflow-x-auto overflow-y-hidden rounded-lg border border-border-subtle bg-surface p-1.5"
    >
      {/* w-full lets the grid spread into the panel when there's room, rather
          than leaving empty space to the right of the last column. The width
          that makes it scroll on a phone comes from the columns' own minimum
          widths, not `min-w-max` on the table, which would let the table's
          width escape the scroll container and push the whole page sideways. */}
      <table className="type-grid w-full border-collapse">
        <caption className="sr-only">
          Type effectiveness: each row is an attacking type, each column a
          defending type
          {asof ? `, as of Generation ${asof}` : ""}.
        </caption>
        <thead>
          <tr>
            {/* The row-header column is sized explicitly. Otherwise automatic
                table layout gives every spare pixel to the one column with no
                width of its own, leaving a wide gap left of the grid. */}
            <th
              scope="col"
              className="type-grid-sticky sticky left-0 z-1 w-28 bg-surface p-px"
            >
              <span className="sr-only">Attacking type</span>
            </th>
            {types.map((def) => (
              <th
                key={def}
                scope="col"
                className="min-w-9 p-px"
                style={selectedEdge(highlight.includes(def), { top: true })}
              >
                {/* Coloured, like the row headers, so both axes read the same
                    way and a column can be found by colour rather than by
                    counting. Every header stays at full strength: dimming the
                    unselected ones would make 17 columns harder to find in
                    order to mark two, and the selected column's frame already
                    does that job. */}
                <span aria-hidden>
                  <TypeBadge
                    type={def}
                    size="sm"
                    radius="xs"
                    label={typeAbbr(def)}
                    className="flex h-7 w-full items-center justify-center"
                  />
                </span>
                {/* The abbreviation is for the eye only. Assistive tech
                    announces the full name for the column. */}
                <span className="sr-only">{capitalize(def)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {types.map((atk, rowIndex) => (
            <tr key={atk}>
              {/* Sticky, so the attacker stays visible once the matrix scrolls
                  sideways. Otherwise the numbers lose their row. */}
              {/* The badge fills the column rather than sitting left-aligned:
                  names of different lengths would leave a ragged edge. Full
                  width makes the axis a solid band, squared with the header
                  row above. */}
              <th
                scope="row"
                // The same 1px gutter every other cell has, so the axis sits in
                // the grid rather than beside it.
                className="type-grid-sticky sticky left-0 z-1 bg-surface p-px text-left"
              >
                {/* Full cell height, like every other cell in the row: a short
                    label floating in a tall row would look like something
                    sitting next to the grid rather than part of it. */}
                <TypeBadge
                  type={atk}
                  size="sm"
                  radius="xs"
                  className="flex h-7 w-full items-center justify-center"
                />
              </th>
              {types.map((def) => {
                const mult = chart[atk]?.[def] ?? 1;
                return (
                  // A 1px gutter rather than 4px: the gutters draw the grid, and
                  // at 4px they'd read as space between floating chips instead
                  // of lines between cells.
                  <td
                    key={def}
                    className="p-px"
                    style={selectedEdge(highlight.includes(def), {
                      bottom: rowIndex === types.length - 1,
                    })}
                  >
                    <div
                      className={`relative flex h-7 items-center justify-center rounded-xs text-badge ${cellClass(mult)}`}
                      style={mult > 1 ? STRONG_FILL : undefined}
                    >
                      {/* The wash down a selected column sits on top of the
                          cell's own fill, so the 2×, ½×, and 0× fills
                          underneath still show through. */}
                      {highlight.includes(def) && (
                        <span
                          aria-hidden
                          className="absolute inset-0 rounded-xs"
                          style={SELECTED_WASH}
                        />
                      )}
                      <span className="relative">
                        {mult === 1 ? (
                          <span className="sr-only">1×</span>
                        ) : (
                          formatMult(mult)
                        )}
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
