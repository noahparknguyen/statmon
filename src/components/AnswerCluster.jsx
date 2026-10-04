import { LuCheck, LuX } from "react-icons/lu";
import { formatMult } from "../lib/typeChart";
import { CHIP_OFF } from "./chipStyles";

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

// **The verdict sits directly above the answers, at every width** (D-143). It
// was centred on the attacking panel (D-109), which put it 176px from the
// buttons you had just pressed at 1440 wide.
//
// Side by side, the cluster is its own three-row grid: room, answers, room.
// The two rooms share the column equally, so the answers sit on the board's
// centre line, and the verdict's layer is the top room, the card at its
// bottom edge. **The top room never drops below 15rem**: the tallest verdict
// at this column's width is 206px, when an ability wraps its caption to a
// second line (measured over 240 rounds), plus the layer's 16px above and
// below. That is a floor and not a reservation: at 900px tall the room is
// 319px and the floor does nothing. Only on a board too short for both do the answers sit lower: 11px at
// 1280×720, 43px in the 657px a 1366×768 laptop leaves. They sit there before
// you answer, so the verdict appearing still moves nothing.
//
// **A window too short to show the whole board** (`short`, index.css) is the
// exception: a phone held sideways. The board already scrolls there, and the
// floor would push the answers off the bottom of the screen, so the rooms go
// back to equal and the verdict goes back onto the attacking panel, centred,
// where it sat before (D-109). The cluster stops being the layer's containing
// block and the board takes over: the attacking column ends half a board,
// half this 16rem column and one 1px divider from the board's right edge.
//
// Stacked, the cluster is `contents`: the answers are the board's middle row
// and the verdict's layer is the board's TOP row, over the attacking panel,
// which the card can cover because its STAB chip names the attacking type. The
// card sits at the row's bottom edge when it fits there; on a phone too short
// for that, `content-center` centres it on the row instead, which is where it
// always sat.
//
// One element in both layouts, placed by the grid it lands in: an absolutely
// positioned child takes the grid area it names as its box, and takes no part
// in placing the in-flow items (CSS Grid §9), so `row-start-1` cannot pull
// the answers or the defender out of place the way an in-flow item did
// (D-109). It names its end line too: for an absolutely positioned child an
// unnamed end is the container's far edge, and `row-start-1` alone put the
// card at the bottom of the column.
const CLUSTER_ROWS =
  "md:grid-rows-[minmax(15rem,1fr)_auto_1fr] md:short:static md:short:grid-rows-[1fr_auto_1fr]";

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
      className={`contents md:relative md:grid md:w-64 md:bg-base md:px-4 ${CLUSTER_ROWS}`}
    >
      {verdict ? (
        <div
          className="pointer-events-none absolute inset-0 row-start-1 row-end-2 grid grid-rows-[1fr_auto] content-center justify-items-center p-4 md:short:right-[calc(50%+8rem+1px)] md:short:grid-rows-[1fr_auto_1fr]"
          style={{ zIndex: "var(--z-raised)" }}
        >
          <div className="row-start-2">{verdict}</div>
        </div>
      ) : null}
      <div className="bg-base p-4 md:row-start-2 md:p-0">
        <div
          role="group"
          aria-label="How effective?"
          className="grid w-full grid-cols-2 gap-2"
        >
          {answers.map((mult) => {
            const isCorrect = resolved && mult === correct;
            const isWrongPick = resolved && mult === picked && mult !== correct;
            // Unanswered, a choice is an unselected chip, hover and all: only the
            // label brightens (chipStyles.jsx). It had a hover of its own that
            // also lit the border accent, the one choice control on the site
            // that answered the pointer differently from the rest (D-135).
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
                {/* The mark's slot is mirrored on the trailing edge so the
                  multiplier stays optically centred in its pill rather than
                  sitting 16px left of centre. */}
                <span aria-hidden className={SLOT} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
