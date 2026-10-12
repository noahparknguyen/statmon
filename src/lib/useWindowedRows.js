import { useCallback, useEffect, useRef, useState } from "react";

// Renders only the rows near the viewport. The dex has 1,259 entries, and each
// row carries a sprite, two badges, and seven stat cells. Mounting them all
// makes every re-sort stutter.
//
// It follows the page's scroll rather than an inner scroll box, so the table
// behaves like an ordinary long page: one scrollbar, the site header stays put,
// and the browser's find-on-page still works over what's rendered.
//
// It knows nothing about tables, only which slice of N fixed-height rows is on
// screen. The caller supplies the row height and pads the gap.

// Rows to render on the first paint, before the effect has measured. A fresh
// visit starts at the top, so this is usually the right slice, with no flash of
// an empty table.
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
    // Stop if nothing moved, so scrolling within a row doesn't re-render every
    // row on screen.
    setRange((prev) =>
      prev.start === start && prev.end === end ? prev : { start, end },
    );
  }, [count, rowHeight, overscan]);

  useEffect(() => {
    measure();
    // At most one measurement per frame, since scroll fires far more often.
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

  // A filter can shrink the list under a stored range, and the effect that
  // re-measures doesn't run until after this render. For that one frame the
  // slice would point past the end and paint an empty table under a huge
  // spacer, so a range past the end falls back to the top, which is where the
  // scroll ends up anyway.
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
