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
export default function GameStart({ title, presets, onPick, onCustomise }) {
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

      <ul className="grid w-full max-w-3xl gap-3 sm:grid-cols-3">
        {presets.map((preset) => (
          <li key={preset.id}>
            <button
              type="button"
              onClick={() => onPick(preset)}
              className="group flex h-full w-full flex-col gap-1 rounded-lg border border-border-subtle bg-surface p-5 text-left transition-colors hover:border-border-strong"
            >
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
