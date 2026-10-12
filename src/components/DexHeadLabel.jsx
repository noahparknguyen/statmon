import { FaCaretDown, FaCaretUp } from "react-icons/fa6";
import { SORT_LABEL } from "../lib/dexTable";

// What a dex column header shows: its label, and the sort caret on the
// column's inner side. Shared by the table's sort headers and Home's static
// preview of them, so a header sits in the same place on both.
//
// A number column's header is right-aligned, with the caret before the label.
// The numbers sit against the cell's right edge, so a centred header would be
// off them, and so would a right-aligned one with the caret after it, since the
// caret would take the place of the label's edge. Before the label, the caret
// is out of the way, and the label's right edge lands on the numbers' right
// edge. A text column (`#`, Name) is left-aligned, with the caret after.
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
