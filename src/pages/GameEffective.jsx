import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { LuArrowRight } from "react-icons/lu";
import AnswerCluster from "../components/AnswerCluster";
import Button from "../components/Button";
import GameBar from "../components/GameBar";
import GameStart from "../components/GameStart";
import { EffectiveThumb } from "../components/gameThumbs";
import EffectiveSetup from "../components/EffectiveSetup";
import MatchupPanel from "../components/MatchupPanel";
import StabChip, { StabCaption } from "../components/StabChip";
import { BOARD, BOARD_SURFACE, clashVars } from "../components/gameChrome";
import {
  EFFECTIVE_PRESETS,
  DEFAULT_SETTINGS,
  answersFor,
  effectiveQuestion,
  effectiveUrl,
  parseEffective,
  settingsKey,
} from "../lib/effective";
import { NEW_SESSION, hasChosenGame, scoreAnswer } from "../lib/games";
import {
  EMPTY_RECORD,
  bestFor,
  browserStorage,
  clearRecord,
  readRecord,
  recordAnswer,
  writeRecord,
} from "../lib/record";
import { typesUrl } from "../lib/typeView";
import { capitalize } from "../lib/types";

// Effective — the type game (D-104). An attacking type against a defender;
// name the multiplier.
//
// Everything structural is `Higher.`'s, deliberately: the same arena, the same
// clash, the same settings-in-the-URL rule (D-092), the same session reducer
// and the same record. What differs is what a panel holds and how you answer —
// which is exactly the seam `gameChrome.jsx` was drawn along (D-105).
//
// **The board is attacker │ answers │ defender** (D-107) — the shape /compare
// has always used, two subjects with the answer between them. It was a rail
// along the bottom first, and that put the thing you press as far from the
// thing you read as the screen allows, across a field that is mostly empty at
// the easier tiers. The empty middle is what pays for the move.

const GAME = "effective";

// Attacker, answers, defender. Below `sm` the three stack, which is the same
// responsive shape the stat game's board takes — a versus screen on a phone is
// top against bottom with the answer between.
// **`md`, not `sm`** (D-109). Three columns at 480px leaves each panel about
// 110px wide, which is a Pokémon you cannot see. Below 768 the three stack and
// each gets the full width.
const GRID =
  "grid-cols-1 grid-rows-[1fr_auto_1fr] md:grid-cols-[1fr_auto_1fr] md:grid-rows-1";

function Arena({ settings, record, onAnswer, onSetup, onRestart }) {
  const [session, setSession] = useState(NEW_SESSION);
  const [round, setRound] = useState(() => effectiveQuestion(settings));
  const [picked, setPicked] = useState(null);
  // Bumped per round so the clash re-runs; the round object alone is not a
  // usable key and a repeated defender would skip the animation.
  const [dealt, setDealt] = useState(0);

  const key = settingsKey(settings);
  const resolved = picked != null;
  const wasRight = resolved && picked === round?.mult;

  const answer = (mult) => {
    if (resolved || !round) return;
    setPicked(mult);
    const next = scoreAnswer(session, mult === round.mult);
    setSession(next);
    onAnswer({
      key,
      // The axis this game tests, so the accuracy log reads "Ghost 54%" — one
      // click from a drill on exactly that (D-104).
      topic: round.attack,
      wasCorrect: mult === round.mult,
      streak: next.streak,
    });
  };

  const next = () => {
    setRound(effectiveQuestion(settings));
    setPicked(null);
    setDealt((d) => d + 1);
  };

  const bar = (
    <GameBar
      title="Effective"
      session={session}
      best={bestFor(record, GAME, key)}
      onSetup={onSetup}
      onRestart={onRestart}
    />
  );

  // Reachable by hand: a defending type the era had not invented, or filters
  // that leave fewer than two possible answers. A game that cannot ask a
  // question says so rather than rendering an empty board (D-104).
  if (!round) {
    return (
      <>
        {bar}
        <div className={`${BOARD} grid place-items-center px-4`}>
          <div className="max-w-sm text-center">
            <p className="text-h4">No question fits these settings.</p>
            <p className="mt-2 text-body-sm text-secondary">
              These filters leave fewer than two answers to choose between.
            </p>
            <Button className="mt-6" onClick={onSetup}>
              Open setup
            </Button>
          </div>
        </div>
      </>
    );
  }

  const { attack, defender } = round;
  // Into the tool that would have answered it — the argument for a game living
  // on a reference site at all. Built with the real URL builder, so a link from
  // here cannot drift from the page it opens.
  const followUp = typesUrl(defender.types, {
    asof: settings.asof,
    as: defender.pokemon?.slug ?? null,
    ability: defender.pokemon ? defender.ability : null,
  });

  const panels = [
    <MatchupPanel
      key="attack"
      role="Attacking"
      types={[attack]}
      shake
      className="min-h-0"
    />,
    <MatchupPanel
      key="defend"
      role="Defending"
      types={defender.types}
      pokemon={defender.pokemon}
      ability={defender.ability}
      gen={settings.asof}
      // The typing and the tint arrive with the answer, never before it — in
      // Hard the typing is the thing being recalled.
      reveal={resolved}
      shake
      className="min-h-0"
    />,
  ];

  return (
    <>
      {bar}
      <section className={`${BOARD_SURFACE} ${BOARD} ${GRID}`}>
        {/* The verdict lands over the ATTACKING panel — the stat game's
            treatment, and the one panel it can afford to cover: the StabChip
            inside the card names the attacking type, so nothing is hidden that
            the card does not already say. Over the defender it would hide the
            typing that was just revealed, which is the answer covering the
            answer (D-097).

            **Inside the attacker's cell rather than placed in the grid.** The
            obvious version put it at `col-start-1 row-start-1`, and that is
            wrong in a way worth recording: an explicitly placed grid item
            disturbs auto-placement for its siblings, so the answers slid into
            column three and the defender dropped into a row of its own — the
            board came apart. Positioned absolutely within the cell it needs no
            placement at all, and it lands on the attacker in both layouts:
            left column side by side, top row stacked. (D-109) */}
        <div
          key={`${dealt}-attack`}
          className="animate-clash-charge relative min-h-0"
          style={clashVars(0, 2, dealt)}
        >
          {panels[0]}
          {resolved && (
            <div
              className="pointer-events-none absolute inset-0 grid place-items-center p-4"
              style={{ zIndex: "var(--z-raised)" }}
            >
              <div
                className="animate-reveal pointer-events-auto flex max-w-full flex-col items-center gap-3 rounded-lg border border-border-subtle bg-surface px-5 py-4 text-center"
                style={{ boxShadow: "var(--shadow-overlay)" }}
              >
                <p className="text-h4">
                  {wasRight ? "Correct." : "Not quite."}
                </p>
                {/* The site's own idiom for "the chart said one thing and the
                  ability changed it": StabChip strikes the chart's answer
                  beside the real one, StabCaption names what changed it
                  (D-079). Reused rather than re-rendered, so the verdict cannot
                  drift from the comparison board's version of the same fact. */}
                <div className="flex flex-col items-center gap-1.5">
                  <StabChip
                    type={attack}
                    mult={round.mult}
                    baseMult={round.baseMult}
                    via={round.via}
                    size="sm"
                  />
                  <StabCaption types={defender.types} via={round.via} />
                </div>
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                  <Button autoFocus size="sm" onClick={next}>
                    Next
                    <LuArrowRight aria-hidden />
                  </Button>
                  <Link
                    to={followUp}
                    className="text-body-sm text-accent transition-colors hover:text-accent-hover"
                  >
                    See it on the chart
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        <AnswerCluster
          answers={answersFor(settings)}
          correct={round.mult}
          picked={picked}
          onPick={answer}
        />

        <div
          key={`${dealt}-defend`}
          className="animate-clash-charge min-h-0"
          style={clashVars(1, 2, dealt)}
        >
          {panels[1]}
        </div>
      </section>

      {/* Announced rather than only shown: the answer is spread across a rail,
          a chip and a caption, and a screen reader user would have to go
          looking for it. */}
      <p aria-live="polite" className="sr-only">
        {resolved
          ? `${wasRight ? "Correct" : "Not quite"}. ${capitalize(attack)} against ${defender.types
              .map(capitalize)
              .join(" and ")} is ${round.mult}×.`
          : ""}
      </p>
    </>
  );
}

export default function GameEffective() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const settings = parseEffective(searchParams);

  const [draft, setDraft] = useState(null);

  // Whether a game has been chosen yet — READ off the URL, not held beside it
  // (D-116). See `hasChosenGame`: this game has the same defaults-writing-no-
  // parameters preset the stat game does, and had the same reload bug.
  const started = hasChosenGame(searchParams);
  const [record, setRecord] = useState(() => readRecord(browserStorage()));

  const saveAnswer = (entry) => {
    const next = recordAnswer(record, { game: GAME, ...entry });
    setRecord(next);
    writeRecord(browserStorage(), next);
  };

  const forget = () => {
    clearRecord(browserStorage());
    setRecord(EMPTY_RECORD);
  };

  const start = (settings) => {
    navigate(effectiveUrl(settings), {
      replace: true,
      preventScrollReset: true,
    });
  };

  const play = () => {
    const next = draft ?? DEFAULT_SETTINGS;
    setDraft(null);
    // Navigate when leaving the picker, or when something actually changed.
    // The second half is the stat game's rule, adopted here: opening Setup just
    // to read your accuracy and closing it on Play should not restart the round
    // you were in the middle of. The first half is what makes `started`
    // derivable — from the picker the settings may be identical and the
    // navigation is still the thing that starts the game (D-116).
    if (!started || settingsKey(next) !== settingsKey(settings)) {
      navigate(effectiveUrl(next), { replace: true, preventScrollReset: true });
    }
  };

  if (!started) {
    return (
      <>
        <GameStart
          title="Effective"
          presets={EFFECTIVE_PRESETS}
          // The tier IS the defender — one type, two types, then a Pokémon — so
          // the right-hand panel changes shape across the three cards and the
          // ladder is visible rather than described (D-117).
          preview={(preset) => <EffectiveThumb settings={preset.settings} />}
          onPick={(preset) => start(preset.settings)}
          // Straight to the controls, without playing a round first.
          onCustomise={() => setDraft(settings)}
        />
        <EffectiveSetup
          draft={draft}
          record={record}
          onChange={setDraft}
          onPlay={play}
          onClearRecord={forget}
          onClose={() => setDraft(null)}
        />
      </>
    );
  }

  return (
    <>
      {/* Keyed on the settings, so changing one starts a new game: a score
          carried across a switch from Easy to Hard is a score for neither. */}
      <Arena
        key={effectiveUrl(settings)}
        settings={settings}
        record={record}
        onAnswer={saveAnswer}
        onSetup={() => setDraft(settings)}
        // Back to the picker, which is now the whole of it: a bare URL IS the
        // picker (D-116), so clearing the query is the state change rather
        // than something done alongside one. A refresh from here still asks
        // again rather than replaying the game you just left (D-109).
        onRestart={() =>
          navigate("/games/effective", {
            replace: true,
            preventScrollReset: true,
          })
        }
      />
      <EffectiveSetup
        draft={draft}
        record={record}
        onChange={setDraft}
        onPlay={play}
        onClearRecord={forget}
        onClose={() => setDraft(null)}
      />
    </>
  );
}
