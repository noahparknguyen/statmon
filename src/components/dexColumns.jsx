// Column geometry shared by the dex table and Home's preview of it.
//
// Two constraints put this in its own file. Tailwind only scans `.jsx`, so
// these class strings can't live in `lib/`: the scanner wouldn't see them, and
// they'd be dropped from the build. And `react-refresh` needs a component file
// to export only components, so they can't live in `DexTable.jsx` either. A
// constants-only module satisfies both.

// Widths for `table-fixed`, so columns don't resize as rows scroll in and out.
// The Pokémon column has no width, so it takes what's left. Stat columns widen
// at lg, where there's room: the cell's fill is proportional to its width, so a
// wider column makes bars easier to compare down a column. Below lg they stay
// narrow so the name still fits.
export const COL = {
  dex: "hidden w-16 sm:table-cell",
  name: "",
  types: "hidden w-36 lg:table-cell",
  stat: "hidden w-14 md:table-cell lg:w-20",
  mobileStat: "w-16 md:hidden",
  bst: "w-16 lg:w-20",
};

// Row height, as both the number the windowing maths needs and the class that
// renders it, side by side so they stay equal. A mismatch shows up as rows
// sliding out of step while scrolling.
export const ROW_HEIGHT = 48;
export const ROW_HEIGHT_CLASS = "h-12"; // 48px, equal to ROW_HEIGHT

// The header row's look, shared by the real table's sort buttons and Home's
// static preview header, so the preview's header is the tool's rather than a
// lookalike with its own height and alignment.
//
// HEAD_CELL goes on the <th>, and HEAD_INNER on the button or span inside it,
// which carries the height and the padding. A cell with `p-0` and a full-size
// child can be clicked anywhere in the header.
export const HEAD_CELL = "border-b border-border-subtle bg-base p-0";
export const HEAD_INNER =
  "flex h-10 w-full items-center gap-0.5 px-2 text-overline";

// Written out in full rather than composed, so Tailwind's scanner sees each one.
// No `center`: a header aligns with its column's content, which is text on the
// left or a number on the right.
export const HEAD_ALIGN = {
  left: "justify-start",
  right: "justify-end",
};
