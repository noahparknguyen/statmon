// What the games remember between visits.
//
// Two records, because one number can't sum up these games. With filters for
// stat, generation, type, and form, "your best streak" means nothing without
// saying at what: a run of 12 guessing BST across the whole dex isn't a run of
// 12 on Gen 1 Speed.
//
// Both records are kept per game, which matters for correctness: every game
// writes its default settings as an empty string, so Higher and Effective would
// otherwise file their best streaks under the same key and overwrite each
// other.
//
//   · The best streak, keyed by the settings themselves. `settingsKey` gives a
//     canonical query string with defaults left out, so the URL is the key:
//     the same game always finds its own record, and two ways of clicking to
//     the same settings can't become two records.
//   · A lifetime accuracy log per topic, across every session and setting.
//     It's what makes the games a way to practise rather than a scoreboard:
//     "Sp. Defense 58%" names what you're actually weak at, one click from a
//     drill on exactly that.
//
// Every function takes the storage object rather than reaching for
// `localStorage`, so the tests use a plain stub, with no browser to fake.

const KEY = "statmon:games";

export const EMPTY_RECORD = { best: {}, topics: {} };

/**
 * The browser's `localStorage`, or `null` where there isn't one.
 *
 * `null` is a normal input below, not an error, because it really happens: a
 * server render, a browser with site data blocked, or a private mode where
 * merely touching `localStorage` throws. A game has to play in all of them, so
 * every function here falls back to remembering nothing instead of failing.
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
 * Anything unreadable, whether missing, cut short, hand-edited, or written by a
 * later version, gives an empty record rather than throwing, as the URL parsers
 * do. Stored state is untrusted input, and a corrupt score isn't worth a blank
 * page.
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
    // Storage full, private mode, or a browser refusing site data. Losing a
    // high score isn't a reason to interrupt a game.
  }
}

const isPlainObject = (v) =>
  Boolean(v) && typeof v === "object" && !Array.isArray(v);

/** The best streak saved for one game's settings key. */
export const bestFor = (record, game, key) => record.best?.[game]?.[key] ?? 0;

/**
 * The record after one answer, as a new object, with nothing changed in place.
 *
 * `streak` is the streak after this answer, so a wrong answer passes 0 and the
 * `Math.max` leaves the saved best alone. Passing the streak from before the
 * answer would file a personal best one short of the run that earned it.
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
 * One game's accuracy log as a sorted list, `[{ topic, asked, correct, pct }]`,
 * worst first.
 *
 * Worst first because that's the order the list is useful in: it's kept to say
 * what to practise, and your best topic says nothing you'd act on. Topics never
 * asked about are left out rather than shown at 0%, which would read as "you
 * got them wrong".
 *
 * The topic is whatever that game tests: a stat in Higher, an attacking type in
 * Effective. Both answer "what am I weak at" in their own game's terms.
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

/** Forgets everything. The setup panel offers it, and nothing else should. */
export function clearRecord(storage) {
  if (!storage) return;
  try {
    storage.removeItem(KEY);
  } catch {
    /* As in writeRecord: failing to forget isn't worth an error. */
  }
}
