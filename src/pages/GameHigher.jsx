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

// Higher — the stat game, as an arena (D-091, redesigned by D-096).
//
// **The field takes precedence.** The first build was a tool page: a page
// header, a controls panel, then the game as a strip underneath — so the
// configuration was the biggest thing on screen and the Pokémon were thumbnails.
// That is the right shape for /compare, /dex and /types, where the controls are
// why you came, and the wrong one here. The board now fills the viewport, the
// chrome is one 56px bar, and the settings live behind a button.
//
// **The settings are in the URL; the play-through is not** (D-092). A stated
// exception to D-022, and the line is that `?stats=speed&n=4` reproduces *the
// game you are playing* while the round and the score are local state. A round
// in the URL would make Back replay it; a score there would make it editable.
//
// The consequence is the `key` below: changing a setting is a different game, so
// the round and the score start over. Keying the session subtree on the settings
// URL is how that happens with no effect and no reset branch — the state is
// scoped to the thing it belongs to.

// This game's namespace in the saved record. Both games spell their default
// settings as the empty string, so without it they would share a best streak
// (D-104).
const GAME = "higher";

// "Higher" for two, "highest" for four. A superlative over two contenders is the
// kind of small wrongness that makes a page feel machine-written.
//
// The verdict's line answers in the question's own words, "Higher Speed:
// Teddiursa, by 5." (D-143). While the board stacks the verdict covers the
// question card, and it was the one card on the board that never said which
// stat the round was about: "Teddiursa leads by 5." left you to remember.
const question = (n, stat) =>
  `${n === 2 ? "Higher" : "Highest"} ${statName(stat)}`;

// Two panels split down the middle; four split again. Below `sm` a pair stacks
// rather than shrinking to 160px each — a versus screen on a phone is top
// against bottom, which costs nothing to be.
//
// **The middle row is the overlay's**, and that is the fix for a real bug
// rather than a layout preference (D-097). Centring the verdict absolutely
// works when the panels are one row: it lands on the divider, over artwork.
// The moment they stack — a pair on a phone, or four in a 2×2 below `lg` — the
// centre of the board is exactly where the top row's names and values are, so
// the answer covered half the answer. Stacked, the overlay is a real grid row
// between the halves and nothing overlaps; side by side, it goes back to being
// an absolute layer.
const GRID = {
  2: "grid-cols-1 grid-rows-[1fr_auto_1fr] sm:grid-cols-2 sm:grid-rows-1",
  4: "grid-cols-2 grid-rows-[1fr_auto_1fr] lg:grid-cols-4 lg:grid-rows-1",
};

// The breakpoint at which each count stops stacking — where the overlay stops
// being a row and becomes a layer. Written out in full rather than composed, so
// Tailwind's scanner sees every utility (cf. D-028).
const OVERLAY = {
  2: "col-span-full flex justify-center bg-base px-4 py-3 sm:pointer-events-none sm:absolute sm:inset-0 sm:grid sm:justify-items-center sm:bg-transparent sm:p-4",
  4: "col-span-full flex justify-center bg-base px-4 py-3 lg:pointer-events-none lg:absolute lg:inset-0 lg:grid lg:justify-items-center lg:bg-transparent lg:p-4",
};

// Where the two cards sit once the panels are side by side (D-101). They share
// the layer's one cell, so neither moves the other.
//
// **The question at the top, for the whole round** (D-143). Dead centre is
// where the artwork is: at four panels on a wide screen each one is
// `object-contain`-ed into a tall box, so there is real empty space above and
// below the Pokémon and none at all in the middle. A question you read once
// and then keep glancing back at is chrome, and chrome does not belong on top
// of the subject. It used to vanish when you answered, which nobody chose: the
// two cards took turns in one slot, so the verdict replaced it.
//
// **The answer in the centre**, deliberately. It is not chrome, it is an event:
// it interrupts, it carries the button you are about to press, and it wants to
// be exactly where your eye already is. The two positions are the two roles.
//
// Stacked, the cards are a real grid row BETWEEN the panels; see VERDICT_WRAP.
const PROMPT_PLACE = {
  2: "sm:col-start-1 sm:row-start-1 sm:self-start",
  4: "lg:col-start-1 lg:row-start-1 lg:self-start",
};

// Stacked, the verdict card is **80px taller than the question card** — 134.6
// against 54.8, measured at 390px. In a grid row sized by its contents that
// growth is a shove: both panels give up 40px the instant you answer, and the
// Pokémon jump (D-103).
//
// Reserving the taller height was the obvious fix and it is the wrong one: the
// question is the state you spend nearly all your time in, and it would spend
// 80px of a 668px board on a gap, taking a quarter of the artwork off a phone
// permanently to smooth over one transition.
//
// So the row keeps the QUESTION's height — the question card stays in flow,
// invisible, once the round resolves — and the verdict is lifted out of flow on
// top of it, growing **downward**. Downward is forced rather than chosen: above
// the gutter is the first Pokémon's value, which is the answer, and covering
// the answer with the answer is the fault D-097 already fixed once. Below it is
// the second Pokémon's artwork, whose name and value sit lower still and stay
// visible.
//
// **The question card stays under it, and the verdict's line says the
// question instead** (D-143). Opening the verdict BELOW the question was the
// first idea and the measurement killed it: in the 664px Safari leaves an
// iPhone, a verdict starting under the question covered the second Pokémon's
// name, and on a smaller phone its value, which is the answer.
//
// Side by side the wrapper is an ordinary item in the layer's one cell,
// centred, with the question above it at the top.
const VERDICT_WRAP = {
  2: "absolute inset-x-4 top-3 flex justify-center sm:static sm:col-start-1 sm:row-start-1 sm:self-center",
  4: "absolute inset-x-4 top-3 flex justify-center lg:static lg:col-start-1 lg:row-start-1 lg:self-center",
};

// Once resolved and while the board stacks, the question card holds the row's
// height under the verdict, and only that: invisible, so it does not show
// through the verdict's fade-in. Side by side it stays on screen.
const PROMPT_SPACER = { 2: "invisible sm:visible", 4: "invisible lg:visible" };

function Arena({ settings, record, onAnswer, onSetup, onRestart }) {
  const [session, setSession] = useState(NEW_SESSION);
  // A lazy initialiser, so a round is drawn once on mount rather than on every
  // render. The draw is random, which is fine here in a way it would not be
  // under hydration — the site is a client-only SPA (D-030).
  const [round, setRound] = useState(() => higherQuestion(settings));
  const [picked, setPicked] = useState(null);
  // Bumped per round so the entrance animation re-runs; the round object alone
  // is not a usable key, and reusing the winner's slug would skip the animation
  // whenever the same Pokémon came up twice.
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
      // The topic is the axis this game tests, and the accuracy log is kept in
      // its terms: a stat here, an attacking type in Effective (D-104).
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

  // Reachable now that the filters can be narrowed by hand (D-096): a typing
  // that did not exist in the chosen era, or fewer Pokémon than the round needs
  // seats for. A real state, so it gets a real screen rather than a blank one.
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

  // Every round ends with a way into the tool that would have answered it —
  // which is the argument for a game living on a reference site at all. Built
  // with the real URL builders, never assembled by hand, so a link from here
  // cannot drift from the page it opens.
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
      // The clash's variables are set HERE, on the grid cell, and inherited by
      // the content inside the panel — so `ContenderPanel` knows only that it
      // is shaking, never how. The choreography itself (which way each panel
      // charges, and how its shake differs from its neighbour's) lives in
      // gameChrome.jsx, because both games need exactly it.
      style={clashVars(i, settings.n, dealt)}
    >
      <ContenderPanel
        // A two-up round gives each panel half the screen, so its name and
        // value get the bigger of the two arena densities.
        size={settings.n === 2 ? "lg" : "md"}
        // Only the arena shakes. Home's preview and the games-index thumbnails
        // render the same component statically — a preview that rattles when it
        // scrolls into view is advertising a twitch, not a game.
        shake
        pokemon={p}
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

      {/* `gap-px` over the board's own background is the divider — no border on
          any panel, and it stays a hairline at every width.

          **The background is `base`, not `border-subtle`, and that is the fix
          for what the clash actually looked like** (D-100). The panels converge
          on the centre, so for the length of the animation the gap between the
          two halves is open — and filled with whatever is behind them. In the
          divider's light grey that read as a grey bar flashing down the middle
          of the screen every round. In the page's own near-black it reads as
          what it is: two panels slamming shut on the space between them. The
          resting 1px divider is near-black now, which the type tints already
          separate well enough.

          **`overflow-hidden` is not decoration.** The panels travel 5rem, and
          without clipping that reaches the document and scrolls every width
          sideways — caught by `npm run sweep:widths` at 900, 1024, 1280 and
          1440 the first time it ran, at half this distance. Same fault as the
          type grid leaking its overflow onto every page until `contain: paint`
          (D-052): a board sized to the screen must not be able to push it. */}
      <section className={`${BOARD_SURFACE} ${BOARD} ${GRID[settings.n]}`}>
        {panels.slice(0, half)}

        {/* The question, and then the verdict. Everything a round needs is
            in this one layer, so nothing about the game ever sits below the
            fold. A real row between the halves while the board stacks, an
            absolute layer once the panels are side by side — see GRID. */}
        {/* `--z-raised` is load-bearing, not tidiness. The panels after this
            one in DOM order carry a transform for the length of the entrance
            animation, and a transformed element paints as though positioned —
            so they painted OVER an absolutely-positioned overlay with no
            z-index and sliced the prompt card in half down the panel boundary.
            Exactly the fault D-088 found in the type grid's cross-hair, and
            caught here by `npm run shoot:docs` rather than by any check. */}
        <div
          className={`relative ${OVERLAY[settings.n]}`}
          style={{ zIndex: "var(--z-raised)" }}
        >
          {/* The question. Stays in flow once resolved, because while the board
              stacks THIS is what gives the gutter its height — see
              VERDICT_WRAP. Side by side it stays at the top. */}
          {/* A one-line card, so 12px top and bottom where a surface takes
              16 (§6.2, the bar rule). */}
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

      {/* The verdict is announced rather than only shown: the visible answer is
          spread across up to four panels and a screen reader user would have to
          go looking for it. Politely, so it does not interrupt the press that
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

  // `null` means closed. The panel edits a DRAFT rather than the live settings,
  // so choosing which stats to keep does not restart the game under you on
  // every chip click — only Play commits (D-096).
  const [draft, setDraft] = useState(null);

  // Whether a game has been chosen yet — READ off the URL, not held beside it
  // (D-116). It used to be page state seeded from the URL, because the Medium
  // preset is the defaults and so wrote no parameters: "does the URL carry
  // settings" answered no for a game that had been chosen. `higherUrl` emits
  // `?play` in exactly that case now, so the URL can answer it, and a flag that
  // could disagree with the address bar is gone.
  const started = hasChosenGame(searchParams);

  // Read once. `browserStorage()` is null under a server render or a browser
  // refusing site data, and every function in lib/record handles that by
  // remembering nothing rather than throwing (D-098).
  const [record, setRecord] = useState(() => readRecord(browserStorage()));

  const saveAnswer = (entry) => {
    const next = recordAnswer(record, { game: GAME, ...entry });
    setRecord(next);
    writeRecord(browserStorage(), next);
  };

  // Forgetting is a real feature, not a debug hook: the record is the only
  // thing this site stores about anyone, so being able to throw it away is the
  // other half of storing it at all.
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
    // Only navigate if something actually changed — otherwise closing the panel
    // would restart a game you were in the middle of, which is the opposite of
    // what "Play" should do when you opened it just to look at your accuracy.
    //
    // **`!started` is the other half, and its absence was a bug.** From the
    // picker the settings are usually the defaults and therefore unchanged, so
    // this guard alone refused to navigate and Customise -> Play left you
    // exactly where you started. The type game had the opposite shape — it
    // always navigated and flipped a flag — and the two are one rule now
    // (D-116).
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
          // Each card shows a real round at ITS OWN preset, so the difference
          // between Medium and Hard is visible as two panels against four
          // rather than stated as a sentence (D-117).
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
        // Back to the picker, which is now the whole of it: a bare URL IS the
        // picker (D-116), so clearing the query is the state change rather
        // than something done alongside one. A refresh from here still asks
        // again rather than replaying the game you just left (D-109).
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
