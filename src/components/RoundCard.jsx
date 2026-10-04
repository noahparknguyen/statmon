import { Link } from "react-router";
import { LuArrowRight } from "react-icons/lu";
import Button from "./Button";
import { BOARD, OVERLAY_SHADOW, ROUND_CARD } from "./gameChrome";

// The two cards a round can end on, shared by both games (D-135).
//
// Each game wrote its own verdict card and its own "nothing to play" screen,
// and they had drifted the way copies do: the stat game's Next was the 44px
// page CTA and the type game's the 36px inline one, for the same action on the
// same kind of card; the headline sat 2px over its detail in one and 12px in
// the other; and the two empty screens put their sentence 4px and 8px under
// the heading. Where each card sits on its board is still each game's own
// business (D-105) — the stat game's overlay does real work to stay out of the
// answer's way — but what the card IS lives here once.

// The verdict: "Correct." or "Not quite.", the game's own detail under it, and
// the way on. `detail` is the game's to fill: a sentence in the stat game, the
// STAB chip and its caption in the type game, which reuses the comparison
// board's own idiom for an ability that changed the answer (D-079).
//
// Next is `autoFocus`ed rather than wired to a key: it only exists once a round
// resolves, so focusing it on mount both moves a keyboard user to the next
// action and makes Enter advance the game with no custom key handling. It is
// the page-level CTA size, 44px, because it is the one thing the card is for.
export function Verdict({ correct, detail, onNext, followUp }) {
  return (
    <div className={`${ROUND_CARD} p-4`} style={OVERLAY_SHADOW}>
      <div className="animate-reveal flex flex-col items-center gap-3">
        {/* A headline and its supporting detail on separate lines, not side by
            side: two type sizes on one line never sit together (D-053). */}
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
            className="text-body-sm text-accent transition-colors hover:text-accent-hover"
          >
            {followUp.label}
          </Link>
        </div>
      </div>
    </div>
  );
}

// A board that cannot deal a round says so rather than rendering an empty
// field, and offers the one thing that fixes it. Reachable only by a
// hand-edited URL, because the setup panel refuses Play below what a round
// needs (D-096).
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
