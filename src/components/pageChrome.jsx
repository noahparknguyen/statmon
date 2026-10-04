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
//   · **PAGE_CONTENT** — /about, /games, a game's difficulty picker, /style
//     and the 404. Pages you read or choose from, with nothing below the fold
//     to hurry toward, so they get the air.
//
// Home is deliberately neither: it opens on a full-bleed hero and sets its own
// rhythm (04_design §6). The game boards are neither too: they are the
// viewport, with no page around them (D-096).
//
// A constants-only `.jsx` module for the usual two reasons (06_style_guide §12
// rule 8): Tailwind only scans `.jsx`, so these strings would be invisible from
// `lib/`, and `react-refresh` requires a component file to export only
// components — so they cannot hang off `PageHeader.jsx` either. Same shape as
// `chipStyles.jsx` and `dexColumns.jsx`.

// The vertical padding is deliberately ASYMMETRIC (D-083). Both edges used to
// be the same number, and the two edges are not the same kind of edge: the top
// is bounded by a sticky header that stays attached to the content as you
// scroll, while the bottom is a terminal one — the footer's rule, and then the
// end of the page. 32px above a heading reads as tight-but-intentional on a
// working surface; the same 32px below the last card read as the footer
// crowding the tool, because nothing is gained by ending close to it.
//
// The bottom number is `pb-20`, which is what Home already spends before its
// own footer — so "space before the footer" is now one number across the site
// rather than two that happened to differ.
const PAGE = "max-w-content mx-auto px-4";

export const PAGE_TOOL = `${PAGE} pt-10 pb-20`;
export const PAGE_CONTENT = `${PAGE} pt-16 pb-24`;

// The controls panel — the surface `/compare`, `/dex` and `/types` put their
// controls on (06_style_guide §12.2, D-140).
//
// **The panel spaces its blocks, not the blocks themselves.** Each page used
// to write its own panel and space its blocks with margins on the children:
// the type chart gave its search field a 16px bottom margin and the dex gave
// its filter groups a 12px top margin, so the two pages' type chips — the same
// control in the same place — sat 4px apart as you moved between them. With one
// `gap-4` on the panel there is one number for "the next group", the 16 the
// guide gives group to group, and a page cannot put a different one between
// two blocks without visibly going around it.
export const PANEL =
  "flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface p-4";

// A block with a rule under it, or over it: the generation lens that leads a
// panel, the comparison's board controls under its search. 16px between the
// block and its rule; the panel's gap supplies the 16 on the other side.
export const RULE_BELOW = "border-b border-border-subtle pb-4";
export const RULE_ABOVE = "border-t border-border-subtle pt-4";
