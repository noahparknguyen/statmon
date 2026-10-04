import { LuArrowRight, LuSettings2 } from "react-icons/lu";
import Button from "./Button";
import PageHeader from "./PageHeader";
import {
  GAME_CARD,
  GAME_CARD_ARROW,
  GAME_CARD_BODY,
  GAME_CARD_TITLE,
} from "./gameChrome";
import { PAGE_CONTENT } from "./pageChrome";

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
//
// **It is a page, so it takes the page shell** (D-137): `PAGE_CONTENT` and
// `PageHeader`, the way the games index it was drawn to match already does.
// It used to centre itself in the board's viewport-height box with a heading
// of its own, which put the title flush against the site header at 1280 x 900
// and 390px, the content being taller than the box, and 32 to 42px below it
// on a taller screen. Every other page sits at a fixed distance.
export default function GameStart({
  title,
  presets,
  preview,
  onPick,
  onCustomise,
}) {
  return (
    <div className={PAGE_CONTENT}>
      <PageHeader title={title} subtitle="How do you want to play?" />

      {/* The cards are equal weight: nothing here is recommended, and a
          highlighted middle option would be the page making a choice it has
          no basis for. The full content width, like the games index, since
          they are the same object at two scales (D-117). */}
      <ul className="grid gap-4 sm:grid-cols-3">
        {presets.map((preset) => (
          <li key={preset.id}>
            {/* The whole card is the control, and the panels inside it are
                given no handler, so they render as `<div>`s rather than
                controls nested in a control — the rule D-111 exists for. */}
            <button
              type="button"
              onClick={() => onPick(preset)}
              className={GAME_CARD}
            >
              {preview?.(preset)}
              <span className={GAME_CARD_BODY}>
                <span className={GAME_CARD_TITLE}>
                  {preset.label}
                  <LuArrowRight aria-hidden className={GAME_CARD_ARROW} />
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
          It opens the settings without playing a round first. 32px under the
          cards, the distance every section's button keeps from what it
          follows (FeaturePreview). */}
      <div className="mt-8 flex justify-center">
        <Button variant="secondary" size="sm" onClick={onCustomise}>
          <LuSettings2 aria-hidden />
          Customise
        </Button>
      </div>
    </div>
  );
}
