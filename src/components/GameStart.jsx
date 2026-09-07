import { LuArrowRight, LuSettings2 } from "react-icons/lu";
import Button from "./Button";
import { BOARD } from "./gameChrome";

// The screen a game opens on: three ways to play, and a way to the settings
// (D-108).
//
// **This reverses D-092's "play immediately", and the situation is what
// changed.** When the games shipped, the stat game had two knobs and putting a
// form between a link and the game would have been friction for nothing. It now
// has six axes — stat, count, origin generation, type, forms, era — and the
// first thing a new player meets should be three answers rather than six
// questions. The overwhelm is one this project created.
//
// **A bare URL asks; a parameterised URL plays.** `/games/higher` shows this;
// `/games/higher?stats=speed&n=4` goes straight to the board. So a shared link
// always carries a game and never a form, which was the whole objection to
// gating on setup in the first place — it is answered rather than overridden.
//
// **Presets are settings, not modes.** Each writes a state the setup panel
// could also reach by hand, so nothing here is a fourth code path, and
// Customise is not an escape hatch from a mode system — it is the same
// controls, opened directly.
export default function GameStart({
  title,
  presets,
  preview,
  onPick,
  onCustomise,
}) {
  return (
    <div
      className={`${BOARD} mx-auto flex max-w-content flex-col items-center justify-center gap-8 px-4`}
    >
      <header className="text-center">
        <h1 className="text-h1">
          {title}
          <span className="text-accent">.</span>
        </h1>
        <p className="mt-1 text-body-sm text-secondary">
          How do you want to play?
        </p>
      </header>

      {/* Wider than the old `max-w-3xl`, because each card now carries a board
          rather than two lines of text — at 768px across three cards a
          four-contender thumbnail was 80px of Pokémon. The cards are equal
          weight: nothing here is recommended, and a highlighted middle option
          would be the page making a choice it has no basis for. */}
      <ul className="grid w-full max-w-5xl gap-4 sm:grid-cols-3">
        {presets.map((preset) => (
          <li key={preset.id}>
            {/* The card anatomy is the games index's — a fixed thumbnail band
                over a text body — so the page you pick a GAME on and the page
                you pick a DIFFICULTY on are the same object at two scales
                (D-117). `overflow-hidden` is what lets the thumbnail sit flush
                inside the card's radius.

                The whole card is the control, and the panels inside it are
                given no handler, so they render as `<div>`s rather than
                controls nested in a control — the rule D-111 exists for. */}
            <button
              type="button"
              onClick={() => onPick(preset)}
              className="group flex h-full w-full flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface text-left transition-colors hover:border-border-strong"
            >
              {preview?.(preset)}
              <span className="flex flex-1 flex-col gap-1 p-5">
                <span className="flex items-center gap-1.5 text-h4 text-primary">
                  {preset.label}
                  <LuArrowRight
                    aria-hidden
                    className="text-tertiary transition-colors group-hover:text-secondary"
                  />
                </span>
                <span className="text-body-sm text-secondary">
                  {preset.blurb}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {/* Secondary, and below: the presets are the answer for almost everyone,
          and this is the door for the person who already knows what they want.
          It opens the settings without playing a round first. */}
      <Button variant="secondary" size="sm" onClick={onCustomise}>
        <LuSettings2 aria-hidden />
        Customise
      </Button>
    </div>
  );
}
