import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { LuArrowRight } from "react-icons/lu";
import AnswerRail from "../components/AnswerRail";
import Button from "../components/Button";
import GameBar from "../components/GameBar";
import EffectiveSetup from "../components/EffectiveSetup";
import MatchupPanel from "../components/MatchupPanel";
import StabChip, { StabCaption } from "../components/StabChip";
import { BOARD, BOARD_SURFACE, clashVars } from "../components/gameChrome";
import {
  DEFAULT_SETTINGS,
  answersFor,
  effectiveQuestion,
  effectiveUrl,
  parseEffective,
  settingsKey,
} from "../lib/effective";
import { NEW_SESSION, scoreAnswer } from "../lib/games";
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
// **The board is two panels and a rail.** The stat game's answer is its panels,
// so its question lives between them; here the answer is separate, so it gets
// the bottom of the board and the panels are left alone to be read.

const GAME = "effective";

// Two panels, and below `sm` they stack — a versus screen on a phone is top
// against bottom. The rail spans the full width in either case.
const GRID =
  "grid-cols-1 grid-rows-[1fr_1fr_auto] sm:grid-cols-2 sm:grid-rows-[1fr_auto]";

function Arena({ settings, record, onAnswer, onSetup }) {
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
              The filters have narrowed this game to fewer than two possible
              answers, so there is nothing to choose between.
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
        {panels.map((panel, i) => (
          <div
            key={`${dealt}-${i}`}
            className="animate-clash-charge min-h-0"
            style={clashVars(i, 2, dealt)}
          >
            {panel}
          </div>
        ))}

        <AnswerRail
          answers={answersFor(settings)}
          correct={round.mult}
          picked={picked}
          onPick={answer}
        >
          {resolved && (
            <>
              <p className="text-h4">{wasRight ? "Correct." : "Not quite."}</p>
              {/* The site's own idiom for "the chart said one thing and the
                  ability changed it": StabChip strikes the chart's answer
                  beside the real one, and StabCaption names what changed it
                  (D-079). Reused rather than re-rendered, so the verdict cannot
                  drift from the comparison board's version of the same fact. */}
              <StabChip
                type={attack}
                mult={round.mult}
                baseMult={round.baseMult}
                via={round.via}
                size="sm"
              />
              <StabCaption types={defender.types} via={round.via} />
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
            </>
          )}
        </AnswerRail>
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

  const play = () => {
    navigate(effectiveUrl(draft ?? DEFAULT_SETTINGS), { replace: true });
    setDraft(null);
  };

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
