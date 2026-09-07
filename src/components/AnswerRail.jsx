import { LuCheck, LuX } from "react-icons/lu";
import { formatMult } from "../lib/typeChart";

// The type game's answer control: the multipliers, along the bottom of the
// board (D-104).
//
// **A rail rather than the centre overlay the stat game uses**, because the two
// games answer differently. In `Higher.` the answer *is* the panels, so the
// middle is free for the question. Here the answer is separate, and putting it
// in the middle would lay it over the Pokémon you are still reading — and on a
// phone, as far from your thumb as the screen allows. The bottom is where an
// interaction surface belongs.
//
// **The buttons are a property of the TIER, not of the round.** They are
// computed once from the settings (lib/effective.js) and do not change between
// rounds, so their number can never hint at the answer in front of you — which
// is what a per-round button set would do the moment a `4×` appeared.
//
// **The verdict row above them holds its height from the start.** It is empty
// until you answer, and reserving it is what stops the board jumping when it
// fills — the D-103 rule, in the one place here that needed it.
//
// Right and wrong on D-093's scale, with no red/green pair: the correct answer
// takes the accent and a check, a wrong pick takes an × and recedes, and the
// rest dim. Never colour alone — each mark is an icon with screen-reader text.
const BUTTON =
  "inline-flex min-h-11 min-w-14 items-center justify-center gap-1.5 rounded-full border text-stat-lg transition-colors";

export default function AnswerRail({
  answers,
  correct = null,
  picked = null,
  onPick,
  children,
}) {
  const resolved = picked != null;

  return (
    <div className="col-span-full flex flex-col items-center gap-2 bg-base px-4 py-3">
      {/* Reserved. `min-h-11` is the Next button's own height, so the row is
          the same size before and after an answer lands in it. */}
      <div className="flex min-h-11 flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center">
        {children}
      </div>

      <div
        role="group"
        aria-label="How effective?"
        className="flex flex-wrap justify-center gap-2"
      >
        {answers.map((mult) => {
          const isCorrect = resolved && mult === correct;
          const isWrongPick = resolved && mult === picked && mult !== correct;
          const state = !resolved
            ? "border-border-strong bg-elevated text-secondary hover:text-primary hover:border-accent"
            : isCorrect
              ? "border-accent bg-accent-muted text-primary"
              : isWrongPick
                ? "border-border-strong bg-surface text-secondary"
                : "border-border-subtle bg-surface text-tertiary opacity-50";

          return (
            <button
              key={mult}
              type="button"
              disabled={resolved}
              onClick={() => onPick(mult)}
              className={`${BUTTON} ${state}`}
            >
              {isCorrect && (
                <>
                  <LuCheck aria-hidden className="text-accent" />
                  <span className="sr-only">Correct answer. </span>
                </>
              )}
              {isWrongPick && (
                <>
                  <LuX aria-hidden />
                  <span className="sr-only">Your pick. </span>
                </>
              )}
              {formatMult(mult)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
