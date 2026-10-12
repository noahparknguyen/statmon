import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import AnswerCluster from "../components/AnswerCluster";
import GameBar from "../components/GameBar";
import GameStart from "../components/GameStart";
import { EffectiveThumb } from "../components/gameThumbs";
import EffectiveSetup from "../components/EffectiveSetup";
import MatchupPanel from "../components/MatchupPanel";
import StabChip, { StabCaption } from "../components/StabChip";
import { BOARD, BOARD_SURFACE, clashVars } from "../components/gameChrome";
import { NoRound, Verdict } from "../components/RoundCard";
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

// Effective, the type game: an attacking type against a defender, and you name
// the multiplier.
//
// Its structure is Higher's, deliberately: the same board, the same clash
// animation, settings in the URL, the same session scoring, and the same
// record. What differs is what a panel holds and how you answer, which is
// where `gameChrome.jsx` divides the shared parts from each game's own.
//
// The board is attacker, answers, defender: the shape /compare uses, two
// subjects with the answer between them, so the buttons you press sit right
// next to what you're reading.

const GAME = "effective";

// Attacker, answers, defender. Below `md` the three stack, as the stat game's
// board does: on a phone, a face-off is top against bottom, with the answers
// between. `md` rather than `sm`, because three columns at 480px would leave
// each panel about 110px wide, too small to see the Pokémon.
const GRID =
  "grid-cols-1 grid-rows-[1fr_auto_1fr] md:grid-cols-[1fr_auto_1fr] md:grid-rows-1";

function Arena({ settings, record, onAnswer, onSetup, onRestart }) {
  const [session, setSession] = useState(NEW_SESSION);
  const [round, setRound] = useState(() => effectiveQuestion(settings));
  const [picked, setPicked] = useState(null);
  // Bumped each round so the clash re-runs. The round object isn't a usable
  // key, and a repeated defender would skip the animation.
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
      // What this game tests, so the accuracy log reads "Ghost 54%", one click
      // from a drill on exactly that.
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

  // Reachable with hand-picked filters: a defending type that didn't exist in
  // the generation, or filters that leave fewer than two possible answers. A
  // game that can't ask a question says so rather than showing an empty board.
  if (!round) {
    return (
      <>
        {bar}
        <NoRound title="No question fits these settings." onSetup={onSetup}>
          These filters leave fewer than two answers to choose between.
        </NoRound>
      </>
    );
  }

  const { attack, defender } = round;
  // A way into the tool that would have answered it. Built with the real URL
  // builder, so the link can't drift from the page it opens.
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
      // The typing and the tint arrive with the answer, never before it: in
      // Hard, the typing is what you're recalling.
      reveal={resolved}
      shake
      className="min-h-0"
    />,
  ];

  return (
    <>
      {bar}
      <section className={`${BOARD_SURFACE} ${BOARD} ${GRID}`}>
        <div
          key={`${dealt}-attack`}
          className="animate-clash-charge min-h-0"
          style={clashVars(0, 2, dealt)}
        >
          {panels[0]}
        </div>

        {/* The verdict sits directly above the answers, in the cluster's own
            layer. See AnswerCluster for where that lands at each width. */}
        <AnswerCluster
          answers={answersFor(settings)}
          correct={round.mult}
          picked={picked}
          onPick={answer}
          verdict={
            resolved && (
              // The site's usual way of saying "the chart said one thing and
              // the ability changed it": StabChip strikes the chart's answer
              // beside the real one, and StabCaption names what changed it.
              // The same components as the comparison board's, so the two
              // can't drift apart.
              <Verdict
                correct={wasRight}
                detail={
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
                }
                onNext={next}
                followUp={{ to: followUp, label: "See it on the chart" }}
              />
            )
          }
        />

        <div
          key={`${dealt}-defend`}
          className="animate-clash-charge min-h-0"
          style={clashVars(1, 2, dealt)}
        >
          {panels[1]}
        </div>
      </section>

      {/* Announced as well as shown: the answer is spread across the answer
          buttons, a chip, and a caption, and a screen reader user would have
          to go looking for it. */}
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

  // Whether a game has been chosen, read from the URL rather than kept beside
  // it. See `hasChosenGame`: this game also has a preset that is the defaults.
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
    // Navigate when leaving the start screen, or when something changed, as in
    // the stat game. Opening Setup to read your accuracy and closing it with
    // Play shouldn't restart the round you're in. From the start screen the
    // settings may be unchanged, and navigating is still what starts the game.
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
          // The tier is the defender (one type, two types, then a Pokémon), so
          // the right-hand panel changes shape across the three cards, and the
          // difficulty is visible rather than told.
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
        // Back to the start screen. A bare URL is the start screen, so
        // clearing the query is all it takes, and a refresh from there asks
        // again rather than replaying the game you just left.
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
