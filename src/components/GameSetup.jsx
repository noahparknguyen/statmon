import { useEffect, useRef, useState } from "react";
import { LuX } from "react-icons/lu";
import Button from "./Button";
import IconButton from "./IconButton";
import { RULE_ABOVE } from "./pageChrome";
import { topicAccuracy } from "../lib/record";

// The setup panel's shell: everything about a game that isn't the round, for
// whichever game is asking.
//
// A shell, because both games use it. The header, the scrolling body, the
// record at the bottom, the Reset, status, and Play footer, and how the dialog
// behaves are the same for both. Only the groups of controls differ, so they
// arrive as children. The shell knows nothing about stats, tiers, or pools,
// and each game keeps its own controls in its own file (`HigherSetup`,
// `EffectiveSetup`).
//
// A native <dialog> opened with `showModal()`, which brings three things that
// would otherwise be hand-written and half right: a focus trap, Esc to close,
// and the rest of the page going inert, so opening setup pauses the game for
// free.
//
// It edits a draft, and Play commits it. Wiring the chips straight to the URL
// would restart the game on every click, losing your streak while you choose
// stats. So the caller holds a draft, this edits it, and only Play writes it
// back. If nothing changed, the round you were on survives.
//
// The generation comes first, above a divider, as in `DexFilters`: it decides
// what every group below can offer. A Gen 1 game has five stats with a Special,
// no Fairy chip, and no Gen 7 origin, so top to bottom is the order things
// depend on each other.

// A header, a scrolling body, and a footer, as a flex column, rather than one
// scrolling box with a sticky footer inside it. A sticky footer sits on top of
// the scroll area, so the last thing in the body would always be behind it.
// Three rows with only the middle one scrolling means nothing is ever covered.
//
// `max-h` because the record at the bottom grows without limit, and a dialog
// that runs off the screen can't be closed by its own button.
// `hidden open:flex`, not `flex`. The browser hides a closed <dialog> with its
// own rule (`dialog:not([open]) { display: none }`), and a `display` class
// would override it. The closed dialog is rendered on every game page so it
// exists to be opened, and it would show as an empty bordered box. Setting the
// display per state leaves hiding to the browser, and keeps one class string
// for both states, so they can't drift apart.
const PANEL =
  "m-auto hidden max-h-[85svh] w-[min(36rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface p-0 text-primary backdrop:bg-base/70 open:flex";

// Clearing a record can't be undone, and the site has no confirm pattern: no
// toast, no second dialog, and a nested <dialog> for one button would be
// excessive. So the button asks for itself: one press arms it, and the next
// does it.
//
// Its own component, so that closing the panel disarms it. Resetting the flag
// from the open and close effect would mean calling `setState` inside an
// effect, which `react-hooks` rightly flags. State scoped to something that
// unmounts can't outlive it.
//
// A ghost Button, the site's quiet action, like "Clear all filters".
function ClearRecordButton({ onClear }) {
  const [armed, setArmed] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        if (armed) onClear();
        setArmed(!armed);
      }}
    >
      {armed ? "Tap again to erase" : "Clear record"}
    </Button>
  );
}

export default function GameSetup({
  game,
  topicLabel,
  open,
  onPlay,
  onClose,
  onReset,
  onClearRecord,
  record,
  playable = true,
  status = null,
  children,
}) {
  const ref = useRef(null);

  // `showModal()` has to be called imperatively, so this is the one place the
  // app reaches for a DOM method. Driven by the `open` prop rather than state of
  // its own, so the dialog can't get out of step with the page.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  // Esc and the backdrop both fire `close` natively, and the page needs to know.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = () => onClose();
    el.addEventListener("close", handler);
    return () => el.removeEventListener("close", handler);
  }, [onClose]);

  // Rendered even while closed, so the <dialog> exists to be opened, but with
  // no body, so a closed panel costs nothing and can't be reached by a screen
  // reader or the tab order.
  if (!open) return <dialog ref={ref} className={PANEL} aria-label="Setup" />;

  const accuracy = topicAccuracy(record, game);

  return (
    <dialog ref={ref} className={PANEL} aria-labelledby="setup-title">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border-subtle px-4 py-3">
        <h2 id="setup-title" className="text-h4">
          Setup
        </h2>
        <IconButton label="Close setup" onClick={onClose}>
          <LuX aria-hidden />
        </IconButton>
      </div>

      {/* 16px between groups in a panel, as in the dex's filters. */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {children}

        {accuracy.length > 0 && (
          <div className={RULE_ABOVE}>
            {/* Worst first, because the list is there to say what to
                practise, and it sits right under the chips that act on it, so
                seeing "Sp. Defense 58%" and drilling it is one movement. */}
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-overline text-tertiary">Your accuracy</span>
              {/* The one destructive control on the site. It clears the whole
                  record, every game's log and every saved best, so it says
                  "record", not "accuracy", even though it sits under the
                  accuracy list. */}
              <ClearRecordButton onClear={onClearRecord} />
            </div>
            <dl className="flex flex-wrap gap-x-4 gap-y-1">
              {accuracy.map(({ topic, pct, asked }) => (
                <div key={topic} className="flex items-baseline gap-1.5">
                  <dt className="text-caption text-secondary">
                    {topicLabel(topic)}
                  </dt>
                  <dd className="text-stat-sm text-primary">{pct}%</dd>
                  <span className="text-caption text-tertiary">/ {asked}</span>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>

      {/* The status line sits in the footer rather than at the end of the
          body, because it decides whether Play works, and at the end of a
          scrolling body it could be out of view. What it says is up to each
          game: a Pokémon count for the stat game, and an answer count for the
          type game. */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-t border-border-subtle bg-surface px-4 py-3">
        <Button variant="secondary" size="sm" onClick={onReset}>
          Reset
        </Button>
        <p
          aria-live="polite"
          className={`text-caption ${playable ? "text-tertiary" : "text-secondary"}`}
        >
          {status}
        </p>
        <Button
          size="sm"
          onClick={onPlay}
          disabled={!playable}
          className="ml-auto"
        >
          Play
        </Button>
      </div>
    </dialog>
  );
}
