import TypeBadge from "./TypeBadge";
import { capitalize, typeAbbr } from "../lib/types";
import { chartAsOf, formatMult, typesIn } from "../lib/typeChart";

// The effectiveness matrix: one row per attacking type, one column per
// defending type, for the generation being read (D-051).
//
// **Every cell carries a fill, on a luminance ramp.** Red and green are ruled
// out by 04_design §2 — they clash with eighteen type colours and are not
// colourblind-safe — so the scale is brightness instead, which is colourblind-
// safe by construction and runs in the direction the meaning does: resisted
// cells sink below the surface, super-effective ones rise above it.
//
// The first version left 1× cells blank and gave the other three nearly the same
// fill, which measured 1.42 between 2× and ½×, 1.10 against a blank, and exactly
// 1.00 between ½× and 0× — three states that were, as fills, the same cell. All
// the information sat in 11px text, so the grid had to be *read* rather than
// scanned, and 70% of it being blank left nothing for the eye to track along.
// (D-052)
//
// 1× keeps no text — 324 repetitions of "1×" is noise — but it does keep an
// `sr-only` one, since a screen reader walks the grid cell by cell and an empty
// cell would tell it nothing at all.
//
// The axis badges take the cells' `rounded-xs` rather than the pill shape they
// wear everywhere else on the site: inside a grid they ARE cells, and a row of
// pills against a row of slightly-rounded rectangles reads as two different
// systems sharing a table.
//
// A real <table> with scope'd headers, for D-039's reason: a screen reader then
// announces each cell's attacker and defender for free, where a grid of divs
// would need all of that rebuilt by hand out of ARIA.
//
// The panel scrolls sideways on a narrow screen — the one place on the site that
// does. D-010/D-029 rejected sideways scrolling for the comparison board and the
// dex, but both of those are lists whose columns can be dropped; a matrix has no
// subset that still answers the question. The page around it never scrolls.

// The scale is built around the question people actually bring to a type chart —
// "what is super effective?" — so 2× gets the one loud treatment and everything
// else stays quiet.
//
// Reaching for a darker fill to mean "resisted" was the first attempt and it
// does not work: on a near-black UI the dark end has no room, and base → surface
// → elevated measured 1.08 and 1.10 apart, which is nothing. Brightness is where
// the range is, so the accent goes UP and the rest stays down.
//
// 55% accent into elevated is the ceiling: it clears the baseline by 3.00, and
// one step brighter (70%) would drop primary text to 3.78 and fail AA. Mixed
// inline from two tokens rather than hardcoded, the same way DexRow tints its
// stat fill (D-039), and audited as group 6 of `npm run audit:contrast`.
const STRONG_FILL = {
  backgroundColor:
    "color-mix(in srgb, var(--color-accent) 55%, var(--color-elevated))",
};

// Marking the selected column.
//
// A wash over the cells alone cannot do it: anything strong enough to see puts
// the multiplier under it below AA — 22% dropped 2× text to 4.14 and ½× to
// 4.24, and 12%, the most that stays legal, is barely a 1.23 change. So the
// weight goes into an accent rule down each edge of the column instead, which
// costs the text nothing and draws two continuous lines the full height of the
// grid, with the last legal amount of wash on top of that. (D-053)
const SELECTED_WASH = {
  backgroundColor: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
};

const ACCENT_LINE = "1px solid var(--color-accent)";

// The column is framed on all four sides, so the top and bottom cells close it
// off rather than leaving two rules running into nothing. The header carries the
// top edge and the last row the bottom, since those are the column's ends.
const selectedEdge = (selected, { top = false, bottom = false } = {}) =>
  selected
    ? {
        borderLeft: ACCENT_LINE,
        borderRight: ACCENT_LINE,
        ...(top && { borderTop: ACCENT_LINE }),
        ...(bottom && { borderBottom: ACCENT_LINE }),
      }
    : undefined;

const CELL = {
  strong: "text-primary", // 2× — the only loud cell
  neutral: "bg-elevated", // 1× — the baseline
  weak: "bg-base text-tertiary", // ½× — recessed and quiet
  none: "bg-base text-primary", // 0× — same floor, bright glyph
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
    // The scroll container is the bordered panel itself, so the edge of the
    // scrollable region is visible rather than the page just ending mid-table.
    // overflow-y is pinned hidden, not left to compute: setting overflow-x
    // alone turns the other axis into `auto`, and the cross-hair's full-height
    // bar (index.css) then counts as vertical overflow and grows a scrollbar
    // inside the panel.
    // p-1.5 is not decoration: with the table flush to the edge, the panel's own
    // 16px corner radius cut across the corner badges and made them look
    // differently rounded from the rest of the axis.
    // `tabIndex` and `role` are the fix for a real WCAG 2.1.1 failure, not
    // decoration: this panel is the one thing on the site that scrolls
    // sideways, and a scroll container that cannot take focus cannot be
    // scrolled from a keyboard at all. At 390px eight of the eighteen columns
    // are visible, so the other ten were simply unreachable without a pointer.
    // Focusable + named makes it a region a keyboard user can tab to and then
    // pan with the arrow keys; the global :focus-visible ring shows where they
    // are. The grid has no focusable children, so nothing is shadowed by this.
    <div
      tabIndex={0}
      role="region"
      aria-label="Type effectiveness chart, scrollable"
      className="type-grid-panel overflow-x-auto overflow-y-hidden rounded-lg border border-border-subtle bg-surface p-1.5"
    >
      {/* w-full lets the grid spread into the panel when there is room, instead
          of leaving a strip of dead space to the right of the last column on a
          wide screen. The minimum width that makes it scroll on a phone comes
          from the columns' own min-widths, NOT from `min-w-max` on the table:
          that made the table's min-content size escape the scroll container and
          pushed the whole page sideways by a scrollbar's width at 768px. */}
      <table className="type-grid w-full border-collapse">
        <caption className="sr-only">
          Type effectiveness: each row is an attacking type, each column a
          defending type
          {asof ? `, as of Generation ${asof}` : ""}.
        </caption>
        <thead>
          <tr>
            {/* The row-header column is sized explicitly. Without that, auto
                table layout hands every spare pixel to the one column that has
                no width of its own — which put a 440px gutter to the left of
                the grid the moment the table was told to fill its panel. */}
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
                {/* Filled, like the row headers on the other axis. Eighteen grey
                    abbreviations made you count columns to find one; the colour
                    is the same cue the rows already had, and it lets the two
                    axes be read the same way.
                    Every header stays at full strength — dimming the unselected
                    ones was tried and it fought the whole point of colouring
                    them, making seventeen columns harder to find in order to
                    mark two. The wash down the selected columns does that job
                    on its own. */}
                <span aria-hidden>
                  <TypeBadge
                    type={def}
                    size="sm"
                    radius="xs"
                    label={typeAbbr(def)}
                    className="flex h-7 w-full items-center justify-center"
                  />
                </span>
                {/* The abbreviation is for the eye only; the full name is what
                    assistive tech announces for the whole column. */}
                <span className="sr-only">{capitalize(def)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {types.map((atk, rowIndex) => (
            <tr key={atk}>
              {/* Sticky so the attacker stays readable once the matrix is
                  scrolled sideways — without it the numbers lose their row. */}
              {/* The badge fills the column rather than sitting left-aligned
                  in it: eighteen names of different lengths left a ragged edge
                  and a different-sized gap on every row. Full width makes the
                  axis a solid band and squares it with the header row above. */}
              <th
                scope="row"
                // The same 1px gutter every other cell has, so the axis sits in
                // the grid rather than beside it — `pl-2` here left 15px inside
                // the panel's left edge against 8px on its right.
                className="type-grid-sticky sticky left-0 z-1 bg-surface p-px text-left"
              >
                {/* Full cell height, like every other cell in the row — a
                    short label floating in a tall row reads as a different kind
                    of thing sitting next to the grid rather than part of it. */}
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
                  // A 1px gutter rather than 4px: the gutters are what draw the
                  // grid, and at four they read as space between floating chips
                  // instead of lines between cells.
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
                      {/* The selected columns were marked only by a slightly
                          brighter header, which was far too quiet to find. A
                          persistent wash down the whole column reads at a
                          glance, and sits ON TOP of the cell's own fill so the
                          2× / ½× / 0× encoding underneath survives it. */}
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
