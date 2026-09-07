import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { LuArrowRight } from "react-icons/lu";
import Button from "../components/Button";
import ContenderPanel from "../components/ContenderPanel";
import { BOARD, BOARD_SURFACE, clashVars } from "../components/gameChrome";
import GameBar from "../components/GameBar";
import GameStart from "../components/GameStart";
import HigherSetup from "../components/HigherSetup";
import { compareUrl } from "../lib/compareUrl";
import { DEFAULT_VIEW, viewToSearch } from "../lib/dexTable";
import {
  HIGHER_PRESETS,
  NEW_SESSION,
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
const prompt = (n, stat) =>
  `${n === 2 ? "Higher" : "Highest"} ${statName(stat)}?`;

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

// Where the card sits once the panels are side by side — and it is not the same
// place for the two things it holds (D-101).
//
// **The question goes to the top.** Dead centre is where the artwork is: at
// four panels on a wide screen each one is `object-contain`-ed into a tall box,
// so there is real empty space above and below the Pokémon and none at all in
// the middle. A question you read once and then keep glancing back at is
// chrome, and chrome does not belong on top of the subject.
//
// **The answer stays centred**, deliberately. It is not chrome, it is an event:
// it interrupts, it carries the button you are about to press, and it wants to
// be exactly where your eye already is. The two positions are the two roles.
//
// Only at the side-by-side widths. Stacked, the card is a real grid row BETWEEN
// the panels, where it covers nothing and there is nothing to move it away from.
const OVERLAY_ALIGN = {
  2: { prompt: "sm:items-start", verdict: "sm:items-center" },
  4: { prompt: "lg:items-start", verdict: "lg:items-center" },
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
// `contents` at the wide breakpoints makes the positioning wrapper vanish, so
// side by side the verdict goes back to being a plain centred child of the
// layer and none of this applies.
const VERDICT_WRAP = {
  2: "absolute inset-x-4 top-3 flex justify-center sm:contents",
  4: "absolute inset-x-4 top-3 flex justify-center lg:contents",
};

// Once resolved, the question card is holding space rather than saying
// anything — and only while the board stacks. Side by side it is simply gone.
const PROMPT_SPACER = { 2: "invisible sm:hidden", 4: "invisible lg:hidden" };

const CARD =
  "pointer-events-auto max-w-full rounded-lg border border-border-subtle bg-surface px-5 text-center";

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
        <div className={`${BOARD} grid place-items-center px-4 text-center`}>
          <div>
            <p className="text-h4">No round to play.</p>
            <p className="mt-1 text-body-sm text-secondary">
              These filters leave too few Pokémon to ask about.
            </p>
            <Button className="mt-6" onClick={onSetup}>
              Open setup
            </Button>
          </div>
        </div>
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

          **`overflow-hidden` is not decoration.** The panels travel 4rem, and
          without clipping that reaches the document and scrolls every width
          sideways — caught by `npm run sweep:widths` at 900, 1024, 1280 and
          1440 the first time it ran, at half this distance. Same fault as the
          type grid leaking its overflow onto every page until `contain: paint`
          (D-052): a board sized to the screen must not be able to push it. */}
      <section className={`${BOARD_SURFACE} ${BOARD} ${GRID[settings.n]}`}>
        {panels.slice(0, half)}

        {/* The prompt, and then the verdict. Everything a round needs is in
            this one card, so nothing about the game ever sits below the fold.
            A real row between the halves while the board stacks, an absolute
            layer once the panels are side by side — see GRID. */}
        {/* `--z-raised` is load-bearing, not tidiness. The panels after this
            one in DOM order carry a transform for the length of the entrance
            animation, and a transformed element paints as though positioned —
            so they painted OVER an absolutely-positioned overlay with no
            z-index and sliced the prompt card in half down the panel boundary.
            Exactly the fault D-088 found in the type grid's cross-hair, and
            caught here by `npm run shoot:docs` rather than by any check. */}
        <div
          className={`relative ${OVERLAY[settings.n]} ${
            OVERLAY_ALIGN[settings.n][resolved ? "verdict" : "prompt"]
          }`}
          style={{ zIndex: "var(--z-raised)" }}
        >
          {/* The question. Stays in flow once resolved, invisibly, because
              while the board stacks THIS is what gives the gutter its height —
              see VERDICT_WRAP. Side by side it is `hidden` and takes none. */}
          <div
            aria-hidden={resolved || undefined}
            className={`${CARD} py-3 ${resolved ? PROMPT_SPACER[settings.n] : ""}`}
            style={{ boxShadow: "var(--shadow-overlay)" }}
          >
            <p className="text-h2">{prompt(settings.n, round.stat)}</p>
          </div>

          {resolved && (
            <div className={VERDICT_WRAP[settings.n]}>
              <div
                className={`${CARD} py-4`}
                style={{ boxShadow: "var(--shadow-overlay)" }}
              >
                {/* The verdict and its detail are on their own lines, not side
                    by side. They are two named styles at two sizes, and D-053
                    already settled what that looks like on one line — "two type
                    sizes on one line, and no amount of aligning makes them sit
                    together". Stacked they read as a headline and its
                    supporting line. */}
                <div className="animate-reveal flex flex-col items-center gap-3">
                  <div className="flex flex-col items-center gap-0.5">
                    <p className="text-h4">
                      {wasRight ? "Correct." : "Not quite."}
                    </p>
                    <p className="text-body-sm text-secondary">
                      {round.winner.name} leads by {round.margin}.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                    {/* autoFocus rather than a key listener: the button only
                        exists once a round resolves, so focusing it on mount
                        both moves a keyboard user to the next action and makes
                        Enter advance the game with no custom key handling. */}
                    <Button autoFocus onClick={next}>
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

  // Whether a game has been chosen yet (D-108). Page state rather than URL
  // state, and it has to be: the Medium preset IS the defaults, so it writes no
  // parameters — asking "does the URL carry settings" after picking it would
  // land back on the bare URL and ask again, forever. Seeded from the URL so a
  // shared link plays and a bare arrival asks, and it lives ABOVE the arena's
  // settings key so picking a preset does not remount it back into the picker.
  const [started, setStarted] = useState(
    () => [...searchParams.keys()].length > 0,
  );

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
    navigate(higherUrl(settings), { replace: true });
    setStarted(true);
  };

  const play = () => {
    const next = draft;
    setDraft(null);
    // Only navigate if something actually changed — otherwise closing the panel
    // would restart a game you were in the middle of, which is the opposite of
    // what "Play" should do when you opened it just to look at your accuracy.
    if (settingsKey(next) !== settingsKey(settings)) {
      navigate(higherUrl(next), { replace: true });
    }
  };

  if (!started) {
    return (
      <>
        <GameStart
          title="Higher"
          presets={HIGHER_PRESETS}
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
        // Back to the picker. It clears the URL as well as the flag, so a
        // refresh from here asks again rather than replaying the game you
        // just left (D-109).
        onRestart={() => {
          navigate("/games/higher", { replace: true });
          setStarted(false);
        }}
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
