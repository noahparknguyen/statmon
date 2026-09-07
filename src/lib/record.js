// What the games remember between visits (D-098, split per game by D-104).
//
// Two records, because one number cannot represent this game. Once the setup
// panel can filter by stat, generation, type and form (D-096), "your best
// streak" is meaningless without saying *at what* — a run of 12 guessing BST
// across the whole dex is not a run of 12 on Gen 1 Speed.
//
// **And both records are namespaced by game**, which is a correctness fix
// rather than tidiness: every game spells its default settings as the empty
// string, so `Higher.` and `Effective.` would otherwise file their best streaks
// under the same key and overwrite each other on the first round of either.
//
//   · **Best streak, keyed by the settings themselves.** `settingsKey` already
//     emits a canonical, defaults-omitted query string (lib/games.js), so the
//     URL IS the key: the same game always finds its own record, and two ways
//     of clicking to the same settings cannot become two records. This is the
//     payoff of keeping settings in the URL (D-092) that was not visible when
//     that call was made.
//   · **A lifetime accuracy log per stat**, across every session and every
//     settings combination. This is the half that makes the games a training
//     tool rather than a scoreboard: "Sp. Defense 58%" names the thing you are
//     actually bad at, and it is one click from a drill on exactly that stat.
//
// **Storage is injected, never reached for.** Every function here takes the
// storage object, so this unit-tests with a plain stub — no jsdom, no DOM, in
// keeping with the test setup this repo already has (vite.config.js). It is the
// same move as the injected `rng` in lib/games.js, for the same reason: the
// thing that makes a module hard to test is usually the thing it reaches for.

const KEY = "statmon:games";

export const EMPTY_RECORD = { best: {}, topics: {} };

/**
 * The browser's `localStorage`, or `null` where there is not one.
 *
 * `null` is a first-class input below rather than an error, because it is a
 * state that genuinely happens: a server render, a browser with site data
 * blocked, or a privacy mode where merely *touching* `localStorage` throws
 * rather than returning null. A game has to play in all of them, so every
 * function here degrades to "remembers nothing" instead of failing.
 */
export function browserStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * The saved record, or an empty one.
 *
 * Anything unreadable — absent, truncated, hand-edited, written by a future
 * version — resolves to empty rather than throwing. That is the same forgiving
 * parse the URL readers use (`parseView`, `parseHigher`): stored state is
 * untrusted input, and a corrupt score is not worth a blank page.
 */
export function readRecord(storage) {
  if (!storage) return EMPTY_RECORD;
  try {
    const parsed = JSON.parse(storage.getItem(KEY));
    if (!parsed || typeof parsed !== "object") return EMPTY_RECORD;
    return {
      best: isPlainObject(parsed.best) ? parsed.best : {},
      topics: isPlainObject(parsed.topics) ? parsed.topics : {},
    };
  } catch {
    return EMPTY_RECORD;
  }
}

export function writeRecord(storage, record) {
  if (!storage) return;
  try {
    storage.setItem(KEY, JSON.stringify(record));
  } catch {
    // Quota, private mode, or a browser refusing site data. Losing a high
    // score is not a reason to interrupt a game.
  }
}

const isPlainObject = (v) =>
  Boolean(v) && typeof v === "object" && !Array.isArray(v);

/** The best streak saved for one game's settings key. */
export const bestFor = (record, game, key) => record.best?.[game]?.[key] ?? 0;

/**
 * The record after one answer — a new object, nothing mutated.
 *
 * `streak` is the streak **after** this answer, so a wrong answer passes 0 and
 * the `Math.max` leaves the saved best alone. Passing the pre-answer streak
 * would file a personal best one short of the run that earned it.
 */
export function recordAnswer(record, { game, key, topic, wasCorrect, streak }) {
  const prev = record.topics?.[game]?.[topic] ?? { asked: 0, correct: 0 };
  return {
    best: {
      ...record.best,
      [game]: {
        ...record.best?.[game],
        [key]: Math.max(bestFor(record, game, key), streak),
      },
    },
    topics: {
      ...record.topics,
      [game]: {
        ...record.topics?.[game],
        [topic]: {
          asked: prev.asked + 1,
          correct: prev.correct + (wasCorrect ? 1 : 0),
        },
      },
    },
  };
}

/**
 * One game's accuracy log as a sorted list: `[{ topic, asked, correct, pct }]`,
 * **worst first**.
 *
 * Worst first because that is the order the list is useful in — the point of
 * keeping it is to say what to practise, and a leaderboard of your best topic
 * says nothing you would act on. Topics never asked about are absent rather
 * than shown at 0%, which would read as "you got them wrong".
 *
 * The topic is whatever axis that game is actually testing: a **stat** in
 * `Higher.`, an **attacking type** in `Effective.`. Both answer "what am I bad
 * at" in the terms of their own game, and both are one click from a drill on
 * exactly that.
 */
export function topicAccuracy(record, game) {
  return Object.entries(record.topics?.[game] ?? {})
    .filter(([, v]) => v?.asked > 0)
    .map(([topic, { asked, correct }]) => ({
      topic,
      asked,
      correct,
      pct: Math.round((correct / asked) * 100),
    }))
    .sort((a, b) => a.pct - b.pct || b.asked - a.asked);
}

/** Forget everything. The setup panel offers it; nothing else should. */
export function clearRecord(storage) {
  if (!storage) return;
  try {
    storage.removeItem(KEY);
  } catch {
    /* same reasoning as writeRecord */
  }
}
