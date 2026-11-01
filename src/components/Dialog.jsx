import { useEffect, useId, useLayoutEffect, useRef } from "react";
import { LuX } from "react-icons/lu";
import IconButton from "./IconButton";

// The site's one modal: a native <dialog> opened with `showModal()`, which
// brings three things that would otherwise be hand-written and half right: a
// focus trap, Esc to close, and the rest of the page going inert.
//
// Two placements, chosen by what the dialog holds. Each is a centred panel
// from `md` up, and differs only on a phone:
//   · `sheet`: a panel along a phone's bottom edge, for a short choice made
//     with the page still in view above it. A Pokémon's ability, the dex's
//     sort and filters, the type chart's controls.
//   · `full`: the whole of a phone's screen, for a long task or one with the
//     keyboard up. Picking a Pokémon, and a game's setup.
//
// A header, a scrolling body, and an optional footer, as a flex column, rather
// than one scrolling box with a sticky footer inside it: a sticky footer sits
// on top of the scroll area, so the last thing in the body would always be
// behind it. Three rows with only the middle one scrolling covers nothing.
//
// `hidden open:flex`, not `flex`. The browser hides a closed <dialog> with its
// own rule (`dialog:not([open]) { display: none }`), and a `display` class
// would override it, showing the closed dialog as an empty bordered box.
// Setting the display per state leaves hiding to the browser.
//
// `max-h-[85svh]` because a dialog that runs off the screen can't be closed by
// its own button.
const BASE =
  "hidden flex-col overflow-hidden border-border-subtle bg-surface p-0 text-primary backdrop:bg-base/70 open:flex";

// Written out in full rather than composed, so Tailwind's scanner sees each.
const PLACEMENT = {
  sheet:
    "mx-0 mt-auto mb-0 max-h-[85svh] w-full max-w-full rounded-t-lg border-t md:m-auto md:w-[min(36rem,calc(100vw-2rem))] md:rounded-lg md:border",
  full: "m-0 h-full max-h-full w-full max-w-full md:m-auto md:h-auto md:max-h-[85svh] md:w-[min(36rem,calc(100vw-2rem))] md:rounded-lg md:border",
};

export default function Dialog({
  open,
  onClose,
  title,
  closeLabel = `Close ${title.toLowerCase()}`,
  placement = "sheet",
  footer = null,
  children,
}) {
  const ref = useRef(null);
  const titleId = useId();

  // `showModal()` has to be called imperatively. Driven by the `open` prop
  // rather than state of its own, so the dialog can't get out of step with the
  // page.
  //
  // A layout effect, so it runs inside the tap that opened the dialog: Safari
  // on iOS raises the keyboard for a focused field only during a user's
  // gesture, and a plain effect runs after it has ended.
  //
  // Focus goes to whatever asks for it with `data-autofocus`, the search field
  // in the Pokémon picker. Left to itself, `showModal()` focuses the first
  // control it finds, which is the Close button in the header.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      el.querySelector("[data-autofocus]")?.focus();
    } else if (!open && el.open) el.close();
  }, [open]);

  // Esc fires `close` natively, and the page needs to know.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = () => onClose();
    el.addEventListener("close", handler);
    return () => el.removeEventListener("close", handler);
  }, [onClose]);

  // Rendered even while closed, so the <dialog> exists to be opened, but with
  // no body, so a closed dialog costs nothing and can't be reached by a screen
  // reader or the tab order.
  if (!open)
    return (
      <dialog
        ref={ref}
        className={`${BASE} ${PLACEMENT[placement]}`}
        aria-label={title}
      />
    );

  return (
    <dialog
      ref={ref}
      className={`${BASE} ${PLACEMENT[placement]}`}
      aria-labelledby={titleId}
      // A tap on the backdrop closes the panel, as a tap outside a menu does.
      // The backdrop is part of the <dialog> element itself, so a click whose
      // target is the dialog, rather than something inside it, landed there.
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border-subtle px-4 py-3">
        <h2 id={titleId} className="text-h4">
          {title}
        </h2>
        <IconButton label={closeLabel} onClick={onClose}>
          <LuX aria-hidden />
        </IconButton>
      </div>
      {/* 16px between groups, as in every panel. The bottom inset keeps the
          last row clear of a phone's home indicator, where a sheet and a
          full-screen dialog reach the screen's edge. */}
      <div
        className="flex flex-1 flex-col gap-4 overflow-y-auto p-4"
        style={
          footer
            ? undefined
            : { paddingBottom: "max(1rem, var(--inset-bottom))" }
        }
      >
        {children}
      </div>
      {footer && (
        <div
          className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-t border-border-subtle bg-surface px-4 pt-3"
          style={{ paddingBottom: "max(0.75rem, var(--inset-bottom))" }}
        >
          {footer}
        </div>
      )}
    </dialog>
  );
}
