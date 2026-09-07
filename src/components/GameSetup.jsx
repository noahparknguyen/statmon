import { useEffect, useRef, useState } from "react";
import { LuX } from "react-icons/lu";
import Button from "./Button";
import { topicAccuracy } from "../lib/record";

// The setup panel's shell: everything about a game that is not the round
// (D-096), for whichever game is asking (D-104).
//
// **A shell, because there are two games now.** The header, the scrolling body,
// the record at the bottom, the Reset/status/Play footer and every rule about
// how the dialog behaves are the same for both; only the GROUPS differ, so
// those arrive as children. Two callers is D-058's threshold and this is a
// clean seam: the shell knows nothing about stats, tiers or pools, and each
// game keeps its own vocabulary in its own file (`HigherSetup`,
// `EffectiveSetup`).
//
// **A native `<dialog>` opened with `showModal()`**, which buys three things
// that would otherwise be hand-written and half-right: a focus trap, Esc to
// close, and the rest of the page going inert — so "opening setup pauses the
// game" costs nothing. It also finally consumes `--z-overlay`, a rung
// 06_style_guide §10 has documented for "modals / dialogs" since the scale was
// written and nothing had ever used.
//
// **It edits a draft, and Play commits it.** Wiring the chips straight to the
// URL would restart the game on every click — you would lose your streak
// choosing which stats to keep. So the caller holds a draft, this edits it, and
// only Play writes it back; if nothing changed, the round you were on survives.
// That is also what makes Play a real button rather than a decorative close.
//
// **The lens leads, above a divider**, which is `DexFilters`' own argument
// (D-049): the generation decides what every group below it can even offer — a
// Gen 1 game has five stats and a Special, no Fairy chip and no Gen 7 origin.
// Reading top to bottom is the actual dependency.

// A header, a scrolling body and a footer — a flex column rather than one
// scrolling box with a `sticky` footer inside it. The sticky version hid the
// pool count underneath the Play bar: sticky content sits ON the scroll area,
// so the last thing in the body is always behind it. Three rows with only the
// middle one scrolling means nothing can ever be covered.
//
// `max-h` at all because the record at the bottom grows without bound, and a
// dialog that runs off the viewport cannot be closed by its own button.
const PANEL =
  "m-auto flex max-h-[85svh] w-[min(36rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface p-0 text-primary backdrop:bg-base/70";

// Clearing a record cannot be undone, and this site has no confirm pattern — no
// toast, no second dialog, and a nested <dialog> for one button would be
// absurd. So the button asks for itself: one press arms it, the next does it.
//
// Its own component **so that closing the panel disarms it**. The alternative
// was resetting the flag from the open/close effect, which is `setState` inside
// an effect — the thing `react-hooks` flags and is right to. Scoping the state
// to something that unmounts is the same move the arena makes with its session
// key: state belongs to the thing it is about, and then it cannot outlive it.
function ClearRecordButton({ onClear }) {
  const [armed, setArmed] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        if (armed) onClear();
        setArmed(!armed);
      }}
      className="inline-flex min-h-9 items-center rounded-full px-3 text-caption text-tertiary transition-colors hover:text-primary"
    >
      {armed ? "Tap again to erase" : "Clear record"}
    </button>
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

  // `showModal()` is imperative by design, so this is the one place the app
  // reaches for a DOM method. Driven off the `draft != null` prop rather than
  // its own state, so the dialog cannot get out of step with the page.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  // Esc and the backdrop both fire `close` natively; the page needs telling.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = () => onClose();
    el.addEventListener("close", handler);
    return () => el.removeEventListener("close", handler);
  }, [onClose]);

  // Rendered even while closed so the <dialog> element exists to be opened —
  // but with no body, so a closed panel costs nothing and cannot be reached by
  // a screen reader or the tab order.
  if (!open) return <dialog ref={ref} className={PANEL} aria-label="Setup" />;

  const accuracy = topicAccuracy(record, game);

  return (
    <dialog ref={ref} className={PANEL} aria-labelledby="setup-title">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border-subtle px-4 py-3">
        <h2 id="setup-title" className="text-h4">
          Setup
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close setup"
          className="inline-flex size-9 items-center justify-center rounded-full text-secondary transition-colors hover:text-primary"
        >
          <LuX aria-hidden />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-4">
        {children}

        {accuracy.length > 0 && (
          <div className="border-t border-border-subtle pt-4">
            {/* Worst first, because the list exists to say what to practise —
                and it sits directly under the chips that act on it, so seeing
                "Sp. Defense 58%" and drilling it is one movement (D-098). */}
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-overline text-tertiary">Your accuracy</span>
              {/* The one destructive control on the site. It clears the whole
                  record — every game's log AND every saved best — so it says
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

      {/* The status line lives in the footer rather than at the end of the body,
          because it is the thing that decides whether Play works — and at the
          end of a scrolling body it was below the fold, so the one piece of
          feedback the filters produce was the one you had to go looking for.
          What it says is the game's own business: a Pokémon count for the stat
          game, an answer count for the type game. */}
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
