import { Link } from "react-router";
import { LuArrowRight } from "react-icons/lu";
import Button from "./Button";
import { BOARD, OVERLAY_SHADOW, ROUND_CARD } from "./gameChrome";

// The two cards a round can end on, shared by both games so they look and
// space the same. Where each card sits on its board is still each game's own
// business: the stat game's overlay works to stay out of the answer's way.

// The verdict: "Correct." or "Not quite.", the game's own detail under it, and
// the way on. `detail` is the game's to fill: a sentence in the stat game, and
// in the type game the STAB chip and its caption, which is how the comparison
// board shows an ability that changed the answer.
//
// Next is `autoFocus`ed rather than wired to a key. It only exists once a round
// resolves, so focusing it on mount moves a keyboard user to the next action
// and makes Enter advance the game, with no custom key handling. It's the
// page-level button size, 44px, because it's the one thing the card is for.
export function Verdict({ correct, detail, onNext, followUp }) {
  return (
    <div className={`${ROUND_CARD} p-4`} style={OVERLAY_SHADOW}>
      <div className="animate-reveal flex flex-col items-center gap-3">
        {/* A headline and its detail on separate lines, not side by side: no
            amount of aligning makes two type sizes sit well on one line. */}
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-h4">{correct ? "Correct." : "Not quite."}</p>
          {detail}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Button autoFocus onClick={onNext}>
            Next
            <LuArrowRight aria-hidden />
          </Button>
          <Link
            to={followUp.to}
            className="text-body-sm text-accent transition-colors hover:text-accent-hover active:text-accent-hover"
          >
            {followUp.label}
          </Link>
        </div>
      </div>
    </div>
  );
}

// A board that can't deal a round says so rather than rendering an empty
// field, and offers the one thing that fixes it. Only a hand-edited URL reaches
// it, because the setup panel disables Play below what a round needs.
export function NoRound({ title, children, onSetup }) {
  return (
    <div className={`${BOARD} grid place-items-center px-4`}>
      <div className="max-w-sm text-center">
        <p className="text-h4">{title}</p>
        <p className="mt-1 text-body-sm text-secondary">{children}</p>
        <Button className="mt-6" onClick={onSetup}>
          Open setup
        </Button>
      </div>
    </div>
  );
}
