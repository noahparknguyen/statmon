import { LuChevronLeft, LuSettings2 } from "react-icons/lu";
import Button from "./Button";

// The game's own bar: what you're playing, how you're doing, and the way into
// the setup panel.
//
// It stands in for a page header and controls panel. A tool page opens with its
// name and controls because the controls are why you came. In a game, the
// board is why you came, so the chrome shrinks to one 56px strip and the
// settings move behind a button.
//
// Sticky under the site header, at `--z-raised`, the layer for content lifted
// above its neighbours but below all chrome: it has to paint over the board
// scrolling under it, and never over the site header above it. On a phone the
// site header steps aside for a board (Layout), so the bar pins to the top.
//
// Inter with tabular figures (`text-stat`), not the display numerals. These
// numbers change under you every round, and tabular figures stop "9" becoming
// "10" from shifting the labels beside it.
//
// `best` is the saved best for these settings, not this session's: a best that
// resets on every reload is a number nobody chases. The session's own run is
// `streak`, right beside it.
export default function GameBar({ title, session, best, onSetup, onRestart }) {
  const cells = [
    { label: "Score", value: `${session.correct} / ${session.asked}` },
    { label: "Streak", value: session.streak },
    { label: "Best", value: best },
  ];

  return (
    <div
      className="sticky top-0 border-b border-border-subtle bg-base/85 backdrop-blur md:top-14"
      style={{ zIndex: "var(--z-raised)" }}
    >
      <div className="max-w-content mx-auto flex h-14 items-center gap-3 px-4 sm:gap-6">
        {/* The site's `Word.` style for names, at h3 rather than a page
            header's h1: the game is named once, quietly, because the board is
            the subject. Not a `PageHeader`, which is centred with a subtitle,
            and is what this bar replaces. */}
        {/* It truncates rather than pushing. "Higher." fits a 320px bar and
            "Effective." doesn't, and an unshrinkable title would push the Setup
            button off the screen and scroll the whole page sideways.
            `min-w-0` does the work: a flex item won't shrink below its
            content's width without it, so `truncate` alone would change
            nothing. */}
        {/* The name is the way back to the start screen: the one part of the
            bar not about the round in progress, so the natural home for "start
            a different game". It fills the bar's height, as the nav links do,
            which clears WCAG 2.5.8's minimum, and its screen-reader text says
            what it does while keeping the visible word in its accessible name
            (WCAG 2.5.3).

            On a phone it's the only way off the board, since neither the site
            header nor the tab bar is there, so it carries a back arrow: a
            touch screen has no hover to show that a name is a control. */}
        <h1 className="text-h3 min-w-0 truncate text-primary">
          {/* Below `xs` the name gives way to the arrow alone: beside the
              score and Setup there's no room for "Effective.", and a truncated
              "Effe…" says less than an arrow. The control stays either way. */}
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex h-14 max-w-full items-center gap-1 truncate transition-colors hover:text-accent active:text-accent"
          >
            <LuChevronLeft aria-hidden className="shrink-0 md:hidden" />
            {/* `aria-hidden` on the visible half, with the full accessible name
                in the screen-reader half. Otherwise a screen reader would hear
                the name twice ("Effective. Effective, choose a different
                game"), and below `xs`, with the visible half hidden, the name
                would lose the game entirely. The visible word is still part of
                the accessible name, as WCAG 2.5.3 asks. */}
            <span aria-hidden className="hidden truncate xs:inline">
              {title}
              <span className="text-accent">.</span>
            </span>
            <span className="sr-only">{title}, choose a different game</span>
          </button>
        </h1>

        {/* A description list, because that's what it is: three labelled
            values. Tight within a cell and looser between them, rather than
            evenly spaced. */}
        <dl className="ml-auto flex shrink-0 items-center gap-3 sm:gap-6">
          {cells.map(({ label, value }) => (
            <div key={label} className="flex flex-col items-end">
              <dt className="text-overline text-tertiary">{label}</dt>
              <dd className="text-stat text-primary">{value}</dd>
            </div>
          ))}
        </dl>

        <Button
          variant="secondary"
          size="sm"
          onClick={onSetup}
          className="shrink-0"
        >
          <LuSettings2 aria-hidden />
          {/* The label is hidden below `sm`, not removed: the accessible name
              has to survive, because an icon-only button with no name tells a
              screen reader nothing. */}
          <span className="hidden sm:inline">Setup</span>
          <span className="sr-only sm:hidden">Setup</span>
        </Button>
      </div>
    </div>
  );
}
