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

// A thumbnail of a game, drawn from a real round with that game's own panels.
//
// **D-043's rule, one rung down** (D-117). The games index already advertised
// each game with a real generated round rather than a drawing of one, on the
// argument that a picture of a board can drift from the board and this cannot.
// The difficulty picker needs the same thing per PRESET — and it needed it
// enough that the alternative was a second set of thumbnails describing the
// same three games, which is the drift this rule exists to prevent. So the
// index's two local components moved here and gained a `settings` prop.
//
// **What a thumbnail has to say is the SHAPE of the round, not its detail.**
// Nobody reads a picker; they glance at it. Two panels against four is the
// whole difference between Medium and Hard and it survives being 60px wide,
// where a legible stat value does not. So these stay small and lean on count,
// type colour and layout rather than on anything you would have to focus on.

// Drawn once per settings object and remembered, rather than per render.
//
// The index drew its round at module scope for this reason (a preview that
// reshuffles as you scroll past is a different page every time), but the picker
// needs one per preset and presets are data — so the cache is keyed by the
// settings themselves. Same guarantee, three of them.
//
// A Map rather than `useMemo`: this survives the component unmounting, so
// leaving the picker and coming back shows the same three boards instead of
// quietly redealing them.
const rounds = new Map();
const drawOnce = (key, draw) => {
  if (!rounds.has(key)) rounds.set(key, draw());
  return rounds.get(key);
};

// A fixed band, so a card whose round failed to generate is the same shape as
// one that worked and the grid does not go ragged.
//
// 192px (`h-48`): a two-up round has room to spare at any of the sizes tried,
// but a four-up splits the band in half, and at 128 that left 64px, which is
// not a Pokémon. The panels take their height from here (`h-full`) instead of
// carrying their own, so one number decides it for both layouts.
const THUMB = "h-48 shrink-0 border-b border-border-subtle";

// `bg-base` is the divider, matching the real board (D-100).
const GRID = `${THUMB} grid gap-px bg-base`;

/**
 * The stat game: `n` contenders on one stat.
 *
 * The count is the point — two for Easy and Medium, four for Hard — so the grid
 * follows `n` rather than being fixed, and four panels stack 2x2 rather than
 * shrinking to a quarter of a card's width.
 */
export function HigherThumb({ settings = HIGHER_DEFAULTS, className = "" }) {
  const round = drawOnce(`h:${higherKey(settings)}`, () =>
    higherQuestion(settings),
  );
  if (!round) return <div className={`${GRID} ${className}`} />;

  const four = round.contenders.length > 2;
  return (
    <div
      className={`${GRID} ${four ? "grid-cols-2 grid-rows-2" : "grid-cols-2"} ${className}`}
    >
      {round.contenders.map((p, i) => (
        <ContenderPanel
          key={p.slug}
          size="sm"
          // Only the outer corners follow the card's curve. With four panels
          // the two lower ones are mid-card and must stay square, or the
          // winner's inset ring traces a curve the card does not have.
          className={i === 0 ? "rounded-tl-lg" : i === 1 ? "rounded-tr-lg" : ""}
          pokemon={p}
          stat={round.stat}
          value={round.values[i]}
          resolved
          won={p === round.winner}
          // A picker is above the fold but it is not the game; there is no
          // reason to preload six artworks before anyone has chosen (D-113).
          lazy
        />
      ))}
    </div>
  );
}

/**
 * The type game: an attacking type against a defender.
 *
 * The tier IS the defender — a single type, a dual type, then a Pokémon — so
 * the right-hand panel changes shape between the three cards without needing a
 * label to say so.
 */
export function EffectiveThumb({
  settings = EFFECTIVE_DEFAULTS,
  className = "",
}) {
  const round = drawOnce(`e:${effectiveKey(settings)}`, () =>
    effectiveQuestion(settings),
  );
  if (!round) return <div className={`${GRID} grid-cols-2 ${className}`} />;

  const { attack, defender } = round;
  return (
    <div className={`${GRID} grid-cols-2 ${className}`}>
      <MatchupPanel
        size="sm"
        role="Attacking"
        types={[attack]}
        className="rounded-tl-lg"
      />
      {/* `reveal`, because a thumbnail is not a round being played: the hard
          tier hides its Pokémon's typing until you answer (D-104), and a
          preview that hid it would advertise an empty box. */}
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
