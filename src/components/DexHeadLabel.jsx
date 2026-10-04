import { FaCaretDown, FaCaretUp } from "react-icons/fa6";
import { SORT_LABEL } from "../lib/dexTable";

// What a dex column header shows: its label, and the sort caret on the
// column's INNER side (D-141). Shared by the table's sort headers and Home's
// static preview of them, which drew it two ways: the table held an invisible
// caret slot on every header and the preview drew a caret only on the sorted
// one, so the same header sat in two places.
//
// **A number column's header is right-aligned, with the caret before the
// label.** The numbers sit against the cell's right edge, so a header centred
// over them was 27px off at 1280px, and a right-aligned one with the caret
// after it was still 13px off: the caret took the place the label's edge
// should be. Before the label, the caret is out of the way and the label's
// right edge lands on the numbers' right edge. A text column (`#`, Name) is
// left-aligned, with the caret after.
//
// The caret's slot is held whether or not the column is sorted, so a label
// never moves when the sort does. `children` is anything said only to a screen
// reader, which belongs after the label it expands.
export default function DexHeadLabel({ colKey, dir = null, align, children }) {
  const Caret = dir === "asc" ? FaCaretUp : FaCaretDown;
  const caret = <Caret aria-hidden className={dir ? "" : "invisible"} />;
  return (
    <>
      {align === "right" && caret}
      {SORT_LABEL[colKey]}
      {children}
      {align !== "right" && caret}
    </>
  );
}
