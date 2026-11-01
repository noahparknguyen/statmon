import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import ContenderPanel from "../components/ContenderPanel";
import {
  BOARD,
  BOARD_SURFACE,
  OVERLAY_SHADOW,
  ROUND_CARD,
  clashVars,
} from "../components/gameChrome";
import { NoRound, Verdict } from "../components/RoundCard";
import GameBar from "../components/GameBar";
import GameStart from "../components/GameStart";
import { HigherThumb } from "../components/gameThumbs";
import HigherSetup from "../components/HigherSetup";
import { compareUrl } from "../lib/compareUrl";
import { DEFAULT_VIEW, viewToSearch } from "../lib/dexTable";
import {
  HIGHER_PRESETS,
  NEW_SESSION,
  hasChosenGame,
  higherQuestion,
  higherUrl,
  parseHigher,
  scoreAnswer,
  settingsKey,
  statName,
} from "../lib/games";
import {
  EMPTY_RECORD,
  bestFor,
  browserStorage,
  clearRecord,
  readRecord,
  recordAnswer,
  writeRecord,
} from "../lib/record";

// Higher, the stat game, as a full-screen board.
//
// The board comes first. On /compare, /dex, and /types the controls are why you
// came, but here they'd crowd out the game, so the board fills the screen, the
// chrome is one 56px bar, and the settings live behind a button.
//
// The settings are in the URL, but the play-through isn't: `?stats=speed&n=4`
// reproduces the game you're playing, while the round and the score are local
// state. A round in the URL would make Back replay it, and a score there would
// make it editable.
//
// So changing a setting is a different game, and the round and score start
// over. Keying the board on the settings URL (the `key` below) does that with
// no effect and no reset code.

// This game's name in the saved record. Both games write their default
// settings as an empty string, so without it they'd share a best streak.
const GAME = "higher";

// "Higher" for two, "Highest" for four: "Highest" of two would be a small
// grammar slip.
//
// The verdict answers in the question's own words, "Higher Speed: Teddiursa,
// by 5.", because while the board stacks the verdict covers the question card,
// and a bare "Teddiursa leads by 5." would leave you to remember which stat it
// was.
const question = (n, stat) =>
  `${n === 2 ? "Higher" : "Highest"} ${statName(stat)}`;

// Two panels split down the middle, and four split again. Below `sm` a pair
// stacks rather than shrinking to 160px each: on a phone, a face-off is top
// against bottom. A phone held sideways (`sideways`) lays any count out in one
// row, as `lg` does: its screen is too short for a stack, where four panels
// were 150px tall and their Pokémon sprite-sized.
//
// The middle row is the overlay's. Centring the verdict absolutely works while
// the panels are one row, where it lands on the divider, over artwork. Once
// they stack (a pair on a phone, or four in a 2×2 below `lg`), the centre of
// the board is where the top row's names and values are, so the answer would
// cover half the answer. Stacked, the overlay is a real grid row between the
// halves and nothing overlaps. Side by side, it's an absolute layer again.
const GRID = {
  2: "grid-cols-1 grid-rows-[1fr_auto_1fr] sm:grid-cols-2 sm:grid-rows-1 sideways:grid-cols-2 sideways:grid-rows-1",
  4: "grid-cols-2 grid-rows-[1fr_auto_1fr] lg:grid-cols-4 lg:grid-rows-1 sideways:grid-cols-4 sideways:grid-rows-1",
};

// The breakpoint at which each count stops stacking, where the overlay stops
// being a row and becomes a layer. Written out in full rather than built up, so
// Tailwind's scanner sees every class.
const OVERLAY = {
  2: "col-span-full flex justify-center bg-base px-4 py-3 sm:pointer-events-none sm:absolute sm:inset-0 sm:grid sm:justify-items-center sm:bg-transparent sm:p-4 sideways:pointer-events-none sideways:absolute sideways:inset-0 sideways:grid sideways:justify-items-center sideways:bg-transparent sideways:p-4",
  4: "col-span-full flex justify-center bg-base px-4 py-3 lg:pointer-events-none lg:absolute lg:inset-0 lg:grid lg:justify-items-center lg:bg-transparent lg:p-4 sideways:pointer-events-none sideways:absolute sideways:inset-0 sideways:grid sideways:justify-items-center sideways:bg-transparent sideways:p-4",
};

// Where the two cards sit once the panels are side by side. They share the
// layer's one cell, so neither moves the other.
//
// The question sits at the top, for the whole round. The middle is where the
// artwork is: with four panels on a wide screen, each Pokémon is fitted into a
// tall box, leaving space above and below it and none in the middle. A question
// you read once and then glance back at belongs out of the subject's way.
//
// The answer sits in the centre, deliberately. It interrupts, carries the
// button you're about to press, and wants to be where your eye already is.
//
// Stacked, the cards are a grid row between the panels: see VERDICT_WRAP.
const PROMPT_PLACE = {
  2: "sm:col-start-1 sm:row-start-1 sm:self-start sideways:col-start-1 sideways:row-start-1 sideways:self-start",
  4: "lg:col-start-1 lg:row-start-1 lg:self-start sideways:col-start-1 sideways:row-start-1 sideways:self-start",
};

// Stacked, the verdict card is about 80px taller than the question card, so in
// a row sized by its contents, answering would shove both panels and make the
// Pokémon jump. Reserving the taller height instead would cost the question,
// the state you spend nearly all your time in, a quarter of the artwork on a
// phone, to smooth over one moment.
//
// So the row keeps the question's height, with the question card left in place
// but invisible once the round resolves, and the verdict is lifted out of flow
// on top of it, growing downward. Downward because above the row is the first
// Pokémon's value, which is the answer, and the verdict mustn't cover it. Below
// is the second Pokémon's artwork, whose name and value sit lower and stay
// visible. Starting the verdict below the question card instead would cover
// the second Pokémon's name on an iPhone in Safari, and its value on a smaller
// phone.
//
// Side by side, the wrapper is an ordinary item in the layer's one cell,
// centred, with the question above it at the top.
const VERDICT_WRAP = {
  2: "absolute inset-x-4 top-3 flex justify-center sm:static sm:col-start-1 sm:row-start-1 sm:self-center sideways:static sideways:col-start-1 sideways:row-start-1 sideways:self-center",
  4: "absolute inset-x-4 top-3 flex justify-center lg:static lg:col-start-1 lg:row-start-1 lg:self-center sideways:static sideways:col-start-1 sideways:row-start-1 sideways:self-center",
};

// Once resolved and while the board stacks, the question card only holds the
// row's height under the verdict: it's invisible, so it doesn't show through
// the verdict's fade-in. Side by side, it stays on screen.
const PROMPT_SPACER = {
  2: "invisible sm:visible sideways:visible",
  4: "invisible lg:visible sideways:visible",
};

function Arena({ settings, record, onAnswer, onSetup, onRestart }) {
  const [session, setSession] = useState(NEW_SESSION);
  // A lazy initialiser, so a round is drawn once on mount rather than on every
  // render. A random draw is fine here, because the site renders only in the
  // browser, with no server-rendered HTML to match.
  const [round, setRound] = useState(() => higherQuestion(settings));
  const [picked, setPicked] = useState(null);
  // Bumped each round so the entrance animation re-runs. The round object isn't
  // a usable key, and the winner's slug would skip the animation whenever the
  // same Pokémon came up twice.
  const [dealt, setDealt] = useState(0);

  const key = settingsKey(settings);
  const resolved = picked != null;
  const wasRight = resolved && picked === round?.winner;

  const pick = (p) => {
    if (resolved) return;
    setPicked(p);
    const next = scoreAnswer(session, p === round.winner);
    setSession(next);
    onAnswer({
      key,
      // The accuracy log is kept in terms of what this game tests: a stat here,
      // and an attacking type in Effective.
      topic: round.stat,
      wasCorrect: p === round.winner,
      streak: next.streak,
    });
  };

  const next = () => {
    setRound(higherQuestion(settings));
    setPicked(null);
    setDealt((d) => d + 1);
  };

  const bar = (
    <GameBar
      title="Higher"
      session={session}
      best={bestFor(record, GAME, key)}
      onSetup={onSetup}
      onRestart={onRestart}
    />
  );

  // Reachable with hand-narrowed filters: a typing that didn't exist in the
  // chosen generation, or fewer Pokémon than the round has seats. A real state,
  // so it gets a real screen rather than a blank one.
  if (!round) {
    return (
      <>
        {bar}
        <NoRound title="No round to play." onSetup={onSetup}>
          These filters leave too few Pokémon to ask about.
        </NoRound>
      </>
    );
  }

  const winnerValue = round.values[round.contenders.indexOf(round.winner)];

  // Every round ends with a way into the tool that would have answered it.
  // Built with the real URL builders, never by hand, so the link can't drift
  // from the page it opens.
  const followUp =
    settings.n === 2
      ? {
          to: compareUrl(round.contenders[0].slug, round.contenders[1].slug, {
            asof: settings.asof,
          }),
          label: "See the full comparison",
        }
      : {
          to: `/dex${viewToSearch({
            ...DEFAULT_VIEW,
            sort: round.stat,
            dir: "desc",
            asof: settings.asof,
          })}`,
          label: `Rank the whole dex by ${statName(round.stat)}`,
        };

  // Half the panels, so the overlay can sit between them when the board stacks.
  const half = settings.n / 2;

  const panels = round.contenders.map((p, i) => (
    <div
      key={`${dealt}-${p.slug}`}
      className="animate-clash-charge min-h-0"
      // The clash animation's variables are set here, on the grid cell, and
      // inherited inside the panel, so `ContenderPanel` only knows that it's
      // shaking, never how. Which way each panel charges, and how its shake
      // differs from its neighbour's, lives in gameChrome.jsx, since both games
      // use it.
      style={clashVars(i, settings.n, dealt)}
    >
      <ContenderPanel
        // A two-up round gives each panel half the screen, so its name and
        // value get the bigger of the two sizes.
        size={settings.n === 2 ? "lg" : "md"}
        // Four in a row on a phone held sideways leave no room above the
        // artwork, and the question card, centred at the top, sat over the two
        // middle Pokémon. 64px of each panel's own tint clears it. A pair needs
        // none: the card sits over the divider, between the two artworks.
        className={settings.n === 4 ? "sideways:pt-16" : ""}
        // Only the game board shakes. Home's preview and the games index use
        // the same component standing still: a preview that rattles as it
        // scrolls into view looks like a glitch, not a game.
        shake
        pokemon={p}
        types={round.types[i]}
        stat={round.stat}
        value={round.values[i]}
        resolved={resolved}
        picked={p === picked}
        won={p === round.winner}
        onPick={() => pick(p)}
      />
    </div>
  ));

  return (
    <>
      {bar}

      {/* `gap-px` over the board's own background is the divider, so no panel
          needs a border, and it stays a hairline at every width.

          The background is `base`, not `border-subtle`. The panels charge in
          toward the centre, so during the animation the gap between the halves
          is open and shows whatever is behind them. Light grey would flash a
          grey bar down the screen every round. The page's near-black reads as
          two panels slamming shut on the space between them, and at rest the
          type tints separate the panels well enough.

          `overflow-hidden` is load-bearing: the panels travel 5rem, and
          unclipped, that would make every width scroll sideways. A board sized
          to the screen mustn't be able to push it. */}
      <section className={`${BOARD_SURFACE} ${BOARD} ${GRID[settings.n]}`}>
        {panels.slice(0, half)}

        {/* The question, and then the verdict. Everything a round needs is in
            this one layer, so nothing about the game sits below the fold. A
            real row between the halves while the board stacks, and an absolute
            layer once the panels are side by side: see GRID. */}
        {/* `--z-raised` is load-bearing. The panels after this one carry a
            transform during their entrance animation, and a transformed element
            paints as though positioned, so without it they'd paint over this
            overlay and slice the question card in half along the panel edge. */}
        <div
          className={`relative ${OVERLAY[settings.n]}`}
          style={{ zIndex: "var(--z-raised)" }}
        >
          {/* The question. It stays in place once resolved, because while the
              board stacks it's what gives the row its height: see
              VERDICT_WRAP. Side by side it stays at the top. */}
          {/* A one-line card, so 12px top and bottom where a surface takes
              16. */}
          <div
            className={`${ROUND_CARD} px-4 py-3 ${PROMPT_PLACE[settings.n]} ${
              resolved ? PROMPT_SPACER[settings.n] : ""
            }`}
            style={OVERLAY_SHADOW}
          >
            <p className="text-h2">{question(settings.n, round.stat)}?</p>
          </div>

          {resolved && (
            <div className={VERDICT_WRAP[settings.n]}>
              <Verdict
                correct={wasRight}
                detail={
                  <p className="text-body-sm text-secondary">
                    {question(settings.n, round.stat)}: {round.winner.name}, by{" "}
                    {round.margin}.
                  </p>
                }
                onNext={next}
                followUp={followUp}
              />
            </div>
          )}
        </div>

        {panels.slice(half)}
      </section>

      {/* The verdict is announced as well as shown: the visible answer is
          spread across up to four panels, and a screen reader user would have
          to go looking for it. Politely, so it doesn't interrupt the press that
          caused it. */}
      <p aria-live="polite" className="sr-only">
        {resolved
          ? `${wasRight ? "Correct" : "Not quite"}. ${round.winner.name} has the highest ${statName(
              round.stat,
            )}, ${winnerValue}.`
          : ""}
      </p>
    </>
  );
}

export default function GameHigher() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const settings = parseHigher(searchParams);

  // `null` means closed. The panel edits a draft rather than the live settings,
  // so choosing stats doesn't restart the game on every chip click: only Play
  // commits.
  const [draft, setDraft] = useState(null);

  // Whether a game has been chosen, read from the URL rather than kept beside
  // it, so it can never disagree with the address bar.
  const started = hasChosenGame(searchParams);

  // Read once. `browserStorage()` is null under a server render or in a browser
  // refusing site data, and lib/record handles that by remembering nothing
  // rather than throwing.
  const [record, setRecord] = useState(() => readRecord(browserStorage()));

  const saveAnswer = (entry) => {
    const next = recordAnswer(record, { game: GAME, ...entry });
    setRecord(next);
    writeRecord(browserStorage(), next);
  };

  // Forgetting is a real feature: the record is the only thing this site
  // stores about anyone, so being able to throw it away is the other half of
  // storing it at all.
  const forget = () => {
    clearRecord(browserStorage());
    setRecord(EMPTY_RECORD);
  };

  const start = (settings) => {
    navigate(higherUrl(settings), { replace: true, preventScrollReset: true });
  };

  const play = () => {
    const next = draft;
    setDraft(null);
    // Navigate only if something changed, or no game has started yet.
    // Otherwise closing the panel would restart the game you're in, which is
    // the opposite of what Play should do when you only opened it to look at
    // your accuracy. From the start screen, the settings are usually the
    // defaults and unchanged, so `!started` is what makes Customise, then Play,
    // start a game.
    if (!started || settingsKey(next) !== settingsKey(settings)) {
      navigate(higherUrl(next), { replace: true, preventScrollReset: true });
    }
  };

  if (!started) {
    return (
      <>
        <GameStart
          title="Higher"
          presets={HIGHER_PRESETS}
          // Each card shows a real round at its own preset, so the difference
          // between Medium and Hard is visible, as two panels against four,
          // rather than told.
          preview={(preset) => <HigherThumb settings={preset.settings} />}
          onPick={(preset) => start(preset.settings)}
          // Straight to the controls, without playing a round first.
          onCustomise={() => setDraft(settings)}
        />
        <HigherSetup
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
          carried across a switch from BST to Speed is a score for neither. */}
      <Arena
        key={higherUrl(settings)}
        settings={settings}
        record={record}
        onAnswer={saveAnswer}
        onSetup={() => setDraft(settings)}
        // Back to the start screen. A bare URL is the start screen, so
        // clearing the query is all it takes, and a refresh from there asks
        // again rather than replaying the game you just left.
        onRestart={() =>
          navigate("/games/higher", { replace: true, preventScrollReset: true })
        }
      />
      <HigherSetup
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
