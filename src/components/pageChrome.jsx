// The page container's class strings: the outermost wrapper every route opens
// with, so pages share their vertical rhythm rather than each picking its own.
//
// There are two kinds of page, so there are two constants:
//
//   · PAGE_TOOL: /compare, /dex, and /types. Working pages, where the controls
//     are why you came, so the header stays tight and the tool starts high on
//     the screen.
//   · PAGE_CONTENT: /about, /games, a game's start screen, /style, and the 404.
//     Pages you read or choose from, with nothing below the fold to hurry
//     toward, so they get more space.
//
// Home is neither: it opens on a full-width wall of sprites and sets its own
// rhythm. The game boards are neither too: they fill the screen, with no page
// around them.
//
// A constants-only `.jsx` module, like `chipStyles.jsx` and `dexColumns.jsx`,
// for two reasons: Tailwind only scans `.jsx`, so these strings would be missed
// in `lib/`, and `react-refresh` needs a component file to export only
// components, so they can't live in `PageHeader.jsx` either.

// The vertical padding is more at the bottom than the top, because the two
// edges differ. The top sits under a sticky header that stays with the content
// as you scroll, and a tight gap there reads as deliberate on a working page.
// The bottom is the end of the page, before the footer, and the same small gap
// there would make the footer look like it's crowding the content. Tool pages
// end with `pb-20`, the same as Home, and reading pages with `pb-24`.
//
// The top is tighter on a phone, where every pixel above the tool pushes the
// tool down, and the tab bar already says which page this is.
const PAGE = "max-w-content mx-auto px-4";

export const PAGE_TOOL = `${PAGE} pt-6 pb-20 md:pt-10`;
export const PAGE_CONTENT = `${PAGE} pt-10 pb-24 md:pt-16`;

// The controls panel: the surface /compare, /dex, and /types put their controls
// on.
//
// The panel spaces its blocks, rather than the blocks spacing themselves. With
// one `gap-4` on the panel, there's one number for "the next group", 16px, so
// the same control sits in the same place on every page, and a page can't put
// a different gap between two blocks without visibly working around it.
export const PANEL =
  "flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface p-4";

// A block with a rule under or over it: the generation strip that leads a
// panel, or the comparison's board controls under its search. 16px between
// the block and its rule, and the panel's gap supplies the 16 on the other side.
export const RULE_BELOW = "border-b border-border-subtle pb-4";
export const RULE_ABOVE = "border-t border-border-subtle pt-4";
