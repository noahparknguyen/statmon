import { LuCheck, LuX } from "react-icons/lu";
import { formatMult } from "../lib/typeChart";

// The type game's answer control, in the MIDDLE of the board (D-107).
//
// It began as a rail along the bottom, and the complaint that moved it was
// exact: at Easy and Medium the field holds two words, so the thing you look at
// and the thing you press were as far apart as the screen allows, with a lot of
// nothing in between. Now the board is attacker │ answers │ defender — the
// shape /compare has always used, two subjects with the answer between them —
// and the empty middle is what pays for it.
//
// **The buttons are a property of the TIER, not of the round.** They are
// computed once from the settings (lib/effective.js) and do not change between
// rounds, so their number can never hint at the answer in front of you.
//
// **Two columns**, so six answers are three tidy rows rather than a ragged wrap
// in a narrow column, and four are two.
//
// Right and wrong on D-093's scale, with no red/green pair: the correct answer
// takes the accent and a check, a wrong pick takes an × and recedes, the rest
// dim. Never colour alone — each mark is an icon with screen-reader text.
const BUTTON =
  "inline-flex min-h-11 items-center justify-center gap-1 rounded-full border px-3 text-stat-lg transition-colors";

// **A fixed slot for the mark, always present** (D-107). Without it the ✓ or ×
// appearing on a resolved round nudges its own multiplier sideways — a small
// shift, but it happens on every answer, on the control you are looking at.
const SLOT = "flex w-4 shrink-0 items-center justify-center";

export default function AnswerCluster({
  answers,
  correct = null,
  picked = null,
  onPick,
}) {
  const resolved = picked != null;

  return (
    // Just the buttons now, centred in their cell. The verdict used to sit in
    // a 208px slot above them, which is what put them a hundred pixels below
    // the middle of the screen — the reservation was the bug, not the fix
    // (D-109). It moved onto the attacking panel, where it costs nothing.
    <div className="col-span-full flex flex-col items-center justify-center bg-base px-4 py-4 md:col-span-1 md:w-64">
      <div
        role="group"
        aria-label="How effective?"
        className="grid w-full grid-cols-2 gap-2"
      >
        {answers.map((mult) => {
          const isCorrect = resolved && mult === correct;
          const isWrongPick = resolved && mult === picked && mult !== correct;
          const state = !resolved
            ? "border-border-strong bg-elevated text-secondary hover:border-accent hover:text-primary"
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
              <span aria-hidden className={SLOT}>
                {isCorrect && <LuCheck className="text-accent" />}
                {isWrongPick && <LuX />}
              </span>
              {isCorrect && <span className="sr-only">Correct answer. </span>}
              {isWrongPick && <span className="sr-only">Your pick. </span>}
              {formatMult(mult)}
              {/* The mark's slot is mirrored on the trailing edge so the
                  multiplier stays optically centred in its pill rather than
                  sitting 16px left of centre. */}
              <span aria-hidden className={SLOT} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
