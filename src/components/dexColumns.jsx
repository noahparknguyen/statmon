// Column geometry shared by the dex table and Home's preview of it.
//
// Two constraints put this in its own file. Tailwind only scans `.jsx`
// (D-038), so these class strings cannot live in `lib/` — they would be
// invisible to the scanner and dropped from the build. And `react-refresh`
// requires a component file to export only components, so they cannot hang off
// `DexTable.jsx` either. A constants-only module satisfies both.

// Widths for `table-fixed`, so columns do not resize as rows scroll in and out.
// The Pokemon column is deliberately width-less and absorbs the remainder.
// Stat columns widen at lg, where there is room to spare: the cell's fill is
// proportional to its width, so a wider column makes bars easier to compare
// down a column. Below lg they stay narrow so the name still fits.
export const COL = {
  dex: "hidden w-16 sm:table-cell",
  name: "",
  types: "hidden w-36 lg:table-cell",
  stat: "hidden w-14 md:table-cell lg:w-20",
  mobileStat: "w-16 md:hidden",
  bst: "w-16 lg:w-20",
};

// Row height, as both the number the windowing maths needs and the utility that
// renders it, so the two cannot drift apart silently — a mismatch shows up as
// rows sliding out of sync while scrolling.
export const ROW_HEIGHT = 48;
export const ROW_HEIGHT_CLASS = "h-12"; // 48px — keep equal to ROW_HEIGHT

// The header row's look, shared by the real table's sort buttons and Home's
// static preview header. These had drifted: the table gave its header cell a
// 40px inner button (`h-10`) and aligned with `justify-*`, while the preview
// used `py-2` (≈27px) and aligned with `text-*` — the same row, two heights and
// two alignment mechanisms, on the two surfaces that are supposed to look
// identical (D-043). The preview is meant to be the tool, not a lookalike.
//
// HEAD_CELL goes on the <th>; HEAD_INNER on the button or span inside it, which
// is what actually carries the height and the padding, so a cell with `p-0` and
// a full-size child clicks anywhere in the header.
export const HEAD_CELL = "border-b border-border-subtle bg-base p-0";
export const HEAD_INNER =
  "flex h-10 w-full items-center gap-0.5 px-2 text-overline";

// Written out in full rather than composed, so Tailwind's scanner sees each one
// (cf. D-028).
export const HEAD_ALIGN = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};
