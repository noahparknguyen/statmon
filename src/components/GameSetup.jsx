import { useState } from "react";
import Button from "./Button";
import Dialog from "./Dialog";
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
// The dialog itself, its header, scrolling body, and footer, is the shared
// `Dialog`: the whole screen on a phone, since setup is a long task with six
// groups to scroll, and Reset, the pool and Play sit on the bottom edge in
// reach of a thumb. A centred panel from `md`.
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
  const accuracy = topicAccuracy(record, game);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Setup"
      placement="full"
      footer={
        <>
          <Button variant="secondary" size="touch" onClick={onReset}>
            Reset
          </Button>
          {/* The status line sits in the footer rather than at the end of the
              body, because it decides whether Play works, and at the end of a
              scrolling body it could be out of view. What it says is up to
              each game: a Pokémon count for the stat game, and an answer
              count for the type game. */}
          <p
            aria-live="polite"
            className={`text-caption ${playable ? "text-tertiary" : "text-secondary"}`}
          >
            {status}
          </p>
          <Button
            size="touch"
            onClick={onPlay}
            disabled={!playable}
            className="ml-auto"
          >
            Play
          </Button>
        </>
      }
    >
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
    </Dialog>
  );
}
