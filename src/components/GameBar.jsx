import { LuChevronLeft, LuSettings2 } from "react-icons/lu";
import Button from "./Button";

// The game's own bar: what you are playing, how you are doing, and the way into
// the setup panel (D-096).
//
// It replaces the page header and the controls panel that used to sit above the
// board. That is the whole shape of the change: a tool page opens with its name
// and its controls because the controls are why you came, and a game does not —
// the field is why you came, so the chrome compresses into one 56px strip and
// the settings move behind a button.
//
// **Sticky under the site header**, at `--z-raised` — "lifted above sibling
// content, below all chrome" (06_style_guide §10), which is exactly the rung
// this needs: it must out-paint the arena scrolling under it and must never
// out-paint the site header above it.
//
// **Inter with tabular figures (`text-stat`), not the display numerals.**
// `text-numeral-*` exists for big figures optically centred in a fixed band
// (D-035); these change under the reader every round, and `tnum` is what stops
// "9" becoming "10" shifting the two labels beside it.
//
// `best` is the saved best for THESE settings (D-098), not this session's — a
// session best that resets on every reload is a number nobody is chasing. The
// session's own run is `streak`, right beside it.
export default function GameBar({ title, session, best, onSetup, onRestart }) {
  const cells = [
    { label: "Score", value: `${session.correct} / ${session.asked}` },
    { label: "Streak", value: session.streak },
    { label: "Best", value: best },
  ];

  return (
    <div
      className="sticky top-14 border-b border-border-subtle bg-base/85 backdrop-blur"
      style={{ zIndex: "var(--z-raised)" }}
    >
      <div className="max-w-content mx-auto flex h-14 items-center gap-3 px-4 sm:gap-6">
        {/* The `Word.` motif, at h3 rather than the h1 a page header uses: the
            game is named once, quietly, because the board below is the subject.
            Not a `PageHeader` — that block is centred with a subtitle and is
            the thing this bar exists instead of. */}
        {/* **Truncates rather than pushing** (D-106). This was `shrink-0`, which
            was fine for exactly as long as there was one game: "Higher." fits a
            320px bar and "Effective." does not, so the second game shoved the
            Setup button 15px off the side of the screen and every page on the
            site scrolled sideways with it. Caught by `npm run sweep:widths`,
            which is the only reason it was caught at all — the bar looks
            perfect at every width anyone opens by hand.
            `min-w-0` is the half that does the work: a flex item will not
            shrink below its content's intrinsic width without it, so `truncate`
            alone would have changed nothing. Same pairing D-055 needed for the
            dex's sort control. */}
        {/* The name is the way back to the difficulty picker (D-109) — the one
            place on this bar that is not about the round in progress, so it is
            the natural home for "start a different game". It fills the bar's
            height the way the nav links do (D-065), which is what carries it
            past WCAG 2.5.8's floor, and the `sr-only` clause says what it does
            without displacing the visible word from its accessible name
            (2.5.3). */}
        <h1 className="text-h3 min-w-0 truncate text-primary">
          {/* Below `xs` the name gives way to a mark, which is exactly what
              the site wordmark does at the same breakpoint (D-054) — and the
              half of that pattern worth copying is that **the control stays**.
              The wordmark's flame is still the link home; this is still the way
              back to the difficulty picker, which at 320px it is the only one
              of. Hiding the button outright would have matched the letter of
              the wordmark's rule and broken its point. (D-110)

              It is a truncation problem there and a fit problem here: this
              title truncates rather than pushing (D-106), so the bar never
              overflowed — "Effective." simply arrived as "Effe…". A mark says
              more than four letters and an ellipsis. */}
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex h-14 max-w-full items-center gap-1 truncate transition-colors hover:text-accent"
          >
            <LuChevronLeft aria-hidden className="shrink-0 xs:hidden" />
            {/* `aria-hidden` on the visible half, with the whole accessible
                name in the `sr-only` half. Without it a screen reader hears the
                name twice — "Effective. Effective, choose a different game" —
                and with the visible half hidden below `xs` the name would
                otherwise lose the game entirely. The visible word is still
                inside the accessible name, which is what WCAG 2.5.3 asks. */}
            <span aria-hidden className="hidden truncate xs:inline">
              {title}
              <span className="text-accent">.</span>
            </span>
            <span className="sr-only">{title} — choose a different game</span>
          </button>
        </h1>

        {/* A description list, because that is what it is: three labelled
            values. Tight inside a cell, loose between them — the proximity
            rule (06_style_guide §6), not a uniform row. */}
        <dl className="ml-auto flex shrink-0 items-center gap-3 sm:gap-6">
          {cells.map(({ label, value }) => (
            <div key={label} className="flex flex-col items-end leading-none">
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
              has to survive, and an icon-only button with no name is the
              failure this repo already fixed on the nav links (D-065). */}
          <span className="hidden sm:inline">Setup</span>
          <span className="sr-only sm:hidden">Setup</span>
        </Button>
      </div>
    </div>
  );
}
