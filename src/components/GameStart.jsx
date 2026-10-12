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

// The screen a game opens on: three ways to play, and a way to the settings.
//
// The stat game has six settings (stat, count, origin generation, type, forms,
// and era), and the first thing a new player meets should be three answers
// rather than six questions.
//
// A bare URL asks, and a URL with settings plays. `/games/higher` shows this
// screen, and `/games/higher?stats=speed&n=4` goes straight to the board. So a
// shared link always opens a game, never a form.
//
// Presets are settings, not modes. Each one writes a state the setup panel
// could also reach by hand, so nothing here is a separate code path, and
// Customise isn't an escape from a mode system: it's the same controls, opened
// directly.
//
// It's a page, so it takes the page shell, `PAGE_CONTENT` and `PageHeader`,
// like the games index it matches. That keeps the title at the same distance
// from the site header as on every other page, at any screen height.
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
          they're the same kind of card at two scales. */}
      <ul className="grid gap-4 sm:grid-cols-3">
        {presets.map((preset) => (
          <li key={preset.id}>
            {/* The whole card is the control. The panels inside it get no
                handler, so they render without controls of their own: HTML
                doesn't allow a control inside a control. */}
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

      {/* Secondary, and below: the presets suit almost everyone, and this is
          for the person who already knows what they want. It opens the
          settings without playing a round first. 32px under the cards, the
          same gap Home's sections leave above their buttons (FeaturePreview). */}
      <div className="mt-8 flex justify-center">
        <Button variant="secondary" size="sm" onClick={onCustomise}>
          <LuSettings2 aria-hidden />
          Customise
        </Button>
      </div>
    </div>
  );
}
