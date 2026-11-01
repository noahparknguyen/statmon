import ContenderPanel from "./ContenderPanel";
import MatchupPanel from "./MatchupPanel";
import {
  DEFAULT_SETTINGS as HIGHER_DEFAULTS,
  higherQuestion,
  settingsKey as higherKey,
} from "../lib/games";
import {
  DEFAULT_SETTINGS as EFFECTIVE_DEFAULTS,
  effectiveQuestion,
  settingsKey as effectiveKey,
} from "../lib/effective";

// A thumbnail of a game, drawn from a real round with the game's own panels.
// A picture of a board could drift from the board, and this can't. The games
// index and the start screen both use these, the start screen once per preset.
//
// A thumbnail has to show the round's shape, not its detail. Nobody reads a
// start screen; they glance at it. Two panels against four is the whole
// difference between Medium and Hard, and that survives being 60px wide, where
// a readable stat value doesn't. So these stay small, and lean on count, type
// colour, and layout rather than anything you'd have to focus on.

// Drawn once per settings and remembered, rather than on every render, so a
// preview doesn't reshuffle as you scroll past it. Keyed by the settings, since
// the start screen needs one per preset.
//
// A Map rather than `useMemo`: it survives the component unmounting, so leaving
// the start screen and coming back shows the same boards instead of dealing new
// ones.
const rounds = new Map();
const drawOnce = (key, draw) => {
  if (!rounds.has(key)) rounds.set(key, draw());
  return rounds.get(key);
};

// A fixed band, so a card whose round failed to generate is the same shape as
// one that worked, and the grid doesn't go ragged.
//
// 192px (`h-48`): a two-up round has room to spare, but a four-up splits the
// band in half, and 64px of each half, at 128, would be too small to show a
// Pokémon. The panels take their height from here (`h-full`) rather than
// setting their own, so one number decides it for both layouts.
//
// 96px on a phone, below `sm`, where the cards are a single column and three
// presets at 192 ran to two screens. There the panels show only their
// artwork, or a type's name (the `sm` size in ContenderPanel and
// MatchupPanel), and four Pokémon stand in one row rather than two: shape over
// detail, as above, at the size a glance takes.
const THUMB = "h-24 shrink-0 border-b border-border-subtle sm:h-48";

// Which of a panel's corners follow the card's curve: only the outer ones,
// or the winner's inset ring would trace a curve the card doesn't have. Four
// panels are one row on a phone and a 2×2 from `sm`, so the top-right corner
// belongs to the last panel on a phone and to the second from `sm`.
const corner = (i, n) =>
  i === 0
    ? "rounded-tl-lg"
    : n === 2
      ? "rounded-tr-lg"
      : i === 1
        ? "sm:rounded-tr-lg"
        : i === 3
          ? "max-sm:rounded-tr-lg"
          : "";

// `bg-base` is the divider, as on the real board.
const GRID = `${THUMB} grid gap-px bg-base`;

// A thumbnail is a picture of a game, so it's hidden from assistive tech. It
// sits inside the control it advertises (a link on the games index, a button on
// the start screen), and a control's name is the text inside it, so a screen
// reader would read out a random round before the game's name. The card's
// title and sentence say what it is, and the round only shows it.
//
// Hidden, it's decoration for contrast purposes too, which WCAG 1.4.3 exempts:
// its dimmed panels and a type name on its own tint would fall under 4.5:1.
// Every root below carries `aria-hidden`, the empty fallbacks included.

/**
 * The stat game: `n` Pokémon on one stat.
 *
 * The count is the point: two for Easy and Medium, four for Hard. So the grid
 * follows `n`, and four panels stack 2×2 rather than shrinking to a quarter of
 * the card's width. On a phone's 96px band they stand in one row instead,
 * where a 2×2 would leave each 48px.
 */
export function HigherThumb({ settings = HIGHER_DEFAULTS, className = "" }) {
  const round = drawOnce(`h:${higherKey(settings)}`, () =>
    higherQuestion(settings),
  );
  if (!round) return <div aria-hidden className={`${GRID} ${className}`} />;

  const four = round.contenders.length > 2;
  return (
    <div
      aria-hidden
      className={`${GRID} ${four ? "grid-cols-4 sm:grid-cols-2 sm:grid-rows-2" : "grid-cols-2"} ${className}`}
    >
      {round.contenders.map((p, i) => (
        <ContenderPanel
          key={p.slug}
          size="sm"
          className={corner(i, round.contenders.length)}
          pokemon={p}
          stat={round.stat}
          value={round.values[i]}
          resolved
          won={p === round.winner}
          // The start screen is above the fold, but it isn't the game, so
          // there's no reason to preload six artworks before anyone chooses.
          lazy
        />
      ))}
    </div>
  );
}

/**
 * The type game: an attacking type against a defender.
 *
 * The tier is the defender (a single type, a dual type, then a Pokémon), so the
 * right-hand panel changes shape across the three cards without a label to say
 * so.
 */
export function EffectiveThumb({
  settings = EFFECTIVE_DEFAULTS,
  className = "",
}) {
  const round = drawOnce(`e:${effectiveKey(settings)}`, () =>
    effectiveQuestion(settings),
  );
  if (!round)
    return <div aria-hidden className={`${GRID} grid-cols-2 ${className}`} />;

  const { attack, defender } = round;
  return (
    <div aria-hidden className={`${GRID} grid-cols-2 ${className}`}>
      <MatchupPanel
        size="sm"
        role="Attacking"
        types={[attack]}
        className="rounded-tl-lg"
      />
      {/* `reveal`, because a thumbnail isn't a round being played: Hard hides
          its Pokémon's typing until you answer, and a preview that hid it
          would show an empty box. */}
      <MatchupPanel
        size="sm"
        role="Defending"
        types={defender.types}
        pokemon={defender.pokemon ?? null}
        reveal
        lazy
        className="rounded-tr-lg"
      />
    </div>
  );
}
