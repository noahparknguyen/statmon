import { useCallback, useEffect, useRef, useState } from "react";

// Renders only the rows near the viewport. The dex is 1,259 entries and each row
// carries a sprite, two badges and seven stat cells — mounting all of them costs
// roughly 15k DOM nodes and makes every re-sort janky, which is the opposite of
// the point of this site.
//
// It windows against the *page* scroll rather than an inner scroll container, so
// the table behaves like an ordinary long page: one scrollbar, the site header
// stays put, and browser find-on-page still works over what is rendered.
//
// Kept free of any table specifics so it is just "which slice of N fixed-height
// rows is on screen" — the caller supplies the row height and pads the gap.

// Rows to render on the first paint, before the effect has measured. A fresh
// navigation starts at scroll 0, so this is the correct slice in the common
// case and there is no visible flash of an empty table.
const INITIAL_ROWS = 30;

export function useWindowedRows({ count, rowHeight, overscan = 8 }) {
  const ref = useRef(null);
  const [range, setRange] = useState({
    start: 0,
    end: Math.min(count, INITIAL_ROWS),
  });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const scrolledInto = window.scrollY - top;
    const perScreen = Math.ceil(window.innerHeight / rowHeight);
    const start = Math.max(0, Math.floor(scrolledInto / rowHeight) - overscan);
    const end = Math.min(count, start + perScreen + overscan * 2);
    // Bail out when nothing moved, so scrolling within a row does not re-render
    // every row on screen.
    setRange((prev) =>
      prev.start === start && prev.end === end ? prev : { start, end },
    );
  }, [count, rowHeight, overscan]);

  useEffect(() => {
    measure();
    // Coalesce to one measurement per frame; scroll fires far more often.
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        measure();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [measure]);

  // A filter can shrink the list under a stored range — the range is state, and
  // the effect that re-measures it does not run until after this render. For
  // that one frame the slice would point past the end and paint an empty table
  // under a huge spacer, so an out-of-range range falls back to the top (which
  // is where the scroll position ends up anyway).
  const outOfRange = range.start >= count;
  const start = outOfRange ? 0 : range.start;
  const end = outOfRange
    ? Math.min(count, INITIAL_ROWS)
    : Math.min(range.end, count);

  return {
    ref,
    start,
    end,
    padTop: start * rowHeight,
    padBottom: Math.max(0, (count - end) * rowHeight),
  };
}
