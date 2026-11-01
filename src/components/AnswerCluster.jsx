import { LuCheck, LuX } from "react-icons/lu";
import { formatMult } from "../lib/typeChart";
import { CHIP_OFF } from "./chipStyles";

// The type game's answer buttons, in the middle of the board: attacker,
// answers, defender, the shape /compare uses, with the answer between the two
// subjects. At Easy and Medium the panels hold only a word or two, so this puts
// the buttons right next to what you're reading.
//
// The buttons belong to the tier, not the round. They're worked out once from
// the settings (lib/effective.js) and don't change between rounds, so how many
// there are can never hint at the answer.
//
// Two columns, so six answers make three tidy rows rather than a ragged wrap
// in a narrow column, and four make two.
//
// Right and wrong without a red and green pair: the correct answer takes the
// accent and a check, a wrong pick takes an × and steps back, and the rest dim.
// Never colour alone: each mark is an icon with screen-reader text.
const BUTTON =
  "inline-flex min-h-11 items-center justify-center gap-1 rounded-full border px-3 text-stat-lg transition-colors";

// A fixed slot for the mark, always present. Otherwise the ✓ or × appearing
// would nudge its own multiplier sideways on every answer, on the control
// you're looking at.
const SLOT = "flex w-4 shrink-0 items-center justify-center";

// The verdict sits directly above the answers, at every width, close to the
// button you just pressed.
//
// Side by side, the cluster is its own three-row grid: space, answers, space.
// The two spaces share the column equally, so the answers sit on the board's
// centre line, and the verdict's layer is the top space, with the card at its
// bottom edge. The top space never drops below 15rem (240px): the tallest
// verdict at this column's width is 206px, when an ability's caption wraps to
// a second line, plus the layer's 16px above and below. That's a minimum, not
// a reservation: on a tall board the space is bigger anyway. Only on a board
// too short for both do the answers sit a little lower, and they sit there
// before you answer, so the verdict appearing still moves nothing.
//
// A phone held sideways (`sideways`, in index.css) is side by side at any
// width, and the exception: the board is the screen's height there, and the
// minimum would push the answers off it, so the spaces go back to equal, and
// the verdict is centred over the attacking panel instead. The cluster stops
// being the layer's containing block, and the board takes over: the attacking
// column ends half a board, plus half this 16rem column and one 1px divider,
// from the board's right edge.
//
// Stacked, the cluster is `contents`: the answers are the board's middle row,
// and the verdict's layer is the board's top row, over the attacking panel,
// which the card can cover because its chip names the attacking type. The card
// sits at the row's bottom edge when it fits, and on a phone too short for that,
// `content-center` centres it on the row instead.
//
// One element in both layouts, placed by the grid it lands in. An absolutely
// positioned grid child takes the grid area it names as its box, and takes no
// part in placing the other items (CSS Grid §9), so `row-start-1` can't pull the
// answers or the defender out of place. It names its end line too, because for
// an absolutely positioned child an unnamed end is the container's far edge,
// which would put the card at the bottom of the column.
const CLUSTER_ROWS =
  "md:grid-rows-[minmax(15rem,1fr)_auto_1fr] sideways:static sideways:grid-rows-[1fr_auto_1fr]";

export default function AnswerCluster({
  answers,
  correct = null,
  picked = null,
  onPick,
  verdict = null,
}) {
  const resolved = picked != null;

  return (
    <div
      className={`contents md:relative md:grid md:w-64 md:bg-base md:px-4 sideways:grid sideways:w-64 sideways:bg-base sideways:px-4 ${CLUSTER_ROWS}`}
    >
      {verdict ? (
        <div
          className="pointer-events-none absolute inset-0 row-start-1 row-end-2 grid grid-rows-[1fr_auto] content-center justify-items-center p-4 sideways:right-[calc(50%+8rem+1px)] sideways:grid-rows-[1fr_auto_1fr]"
          style={{ zIndex: "var(--z-raised)" }}
        >
          <div className="row-start-2">{verdict}</div>
        </div>
      ) : null}
      <div className="bg-base p-4 md:row-start-2 md:p-0 sideways:row-start-2 sideways:p-0">
        <div
          role="group"
          aria-label="How effective?"
          className="grid w-full grid-cols-2 gap-2"
        >
          {answers.map((mult) => {
            const isCorrect = resolved && mult === correct;
            const isWrongPick = resolved && mult === picked && mult !== correct;
            // Unanswered, a choice is an unselected chip, hover and all: only
            // the label brightens, as on every choice control on the site.
            const state = !resolved
              ? CHIP_OFF
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
                {/* The mark's slot is mirrored on the other side, so the
                  multiplier stays centred in its pill rather than sitting 16px
                  left of centre. */}
                <span aria-hidden className={SLOT} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
