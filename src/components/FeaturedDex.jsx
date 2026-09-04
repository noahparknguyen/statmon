import { FaCaretDown } from "react-icons/fa6";
import DexRow from "./DexRow";
import { COL, ROW_HEIGHT_CLASS } from "./dexColumns";
import { getBySlug } from "../lib/pokemon";
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
// and in the hero board above. Nothing marks it on screen.
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

const HEAD = "border-b border-border-subtle px-2 py-2 text-overline";

function Head({ colKey, className, align = "center" }) {
  const sorted = colKey === PREVIEW_SORT;
  return (
    <th
      scope="col"
      // Accurate rather than decorative: these rows really are sorted by Speed,
      // descending. There are no sort controls here — that is what /dex is for.
      aria-sort={sorted ? "descending" : undefined}
      className={`${HEAD} ${ALIGN[align]} ${sorted ? "text-accent" : "text-tertiary"} ${className}`}
    >
      <span className="inline-flex items-center gap-0.5">
        {SORT_LABEL[colKey]}
        {sorted && <FaCaretDown aria-hidden />}
      </span>
    </th>
  );
}

// Written out rather than composed so Tailwind's scanner sees each one (D-028).
const ALIGN = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export default function FeaturedDex() {
  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
      <table
        aria-rowcount={ROWS.length}
        className="w-full table-fixed border-collapse"
      >
        <caption className="sr-only">
          Six Pokémon sorted by base {SORT_LONG_LABEL[PREVIEW_SORT]}, descending
          — a preview of the dex table.
        </caption>
        <thead>
          <tr>
            <Head colKey="dex" className={COL.dex} align="left" />
            <Head colKey="name" className={COL.name} align="left" />
            <th
              scope="col"
              className={`${HEAD} text-left text-tertiary ${COL.types}`}
            >
              Types
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
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
