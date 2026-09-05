// The page container's class strings — the outermost wrapper every route opens
// with. Six routes had six different vertical rhythms (py-8, py-16, py-24,
// pt-16 pb-20, and two more on Home and /style), none of them a decision: each
// page was written in a different session and picked a number.
//
// There are really only two kinds of page here, so there are two constants:
//
//   · **PAGE_TOOL** — /compare, /dex, /types. Working surfaces, where the
//     controls are the reason you came, so the header stays tight and the tool
//     starts high on the screen.
//   · **PAGE_CONTENT** — /credits, 404. Short read-and-leave pages with nothing
//     below the fold to hurry toward, so they get the air.
//
// Home and /style are deliberately neither: Home opens on a full-bleed hero and
// sets its own
// rhythm (04_design §6), and /style is a playground, not a page of the product.
// Both are exemptions with a reason rather than more drift.
//
// A constants-only `.jsx` module for the usual two reasons (06_style_guide §12
// rule 8): Tailwind only scans `.jsx`, so these strings would be invisible from
// `lib/`, and `react-refresh` requires a component file to export only
// components — so they cannot hang off `PageHeader.jsx` either. Same shape as
// `chipStyles.jsx` and `dexColumns.jsx`.

const PAGE = "max-w-content mx-auto px-4";

export const PAGE_TOOL = `${PAGE} py-8`;
export const PAGE_CONTENT = `${PAGE} py-16`;
