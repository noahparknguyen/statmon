import { describe, it, expect } from "vitest";
import {
  EMPTY_RECORD,
  bestFor,
  browserStorage,
  clearRecord,
  readRecord,
  recordAnswer,
  topicAccuracy,
  writeRecord,
} from "./record";
import { DEFAULT_SETTINGS, settingsKey, toggleStat } from "./games";

// A localStorage stand-in. Storage is injected everywhere in this module
// precisely so the tests need no DOM — the same reason lib/games.js takes its
// rng as an argument.
const stub = (initial = {}) => {
  const data = { ...initial };
  return {
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => {
      data[k] = String(v);
    },
    removeItem: (k) => {
      delete data[k];
    },
    _data: data,
  };
};

// The browsers that refuse site data do not return null — they throw, which is
// why every access in the module is wrapped.
const hostile = () => ({
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
  removeItem: () => {
    throw new Error("SecurityError");
  },
});

describe("reading a record", () => {
  it("is empty with no storage at all", () => {
    expect(readRecord(null)).toEqual(EMPTY_RECORD);
  });

  it("is empty when nothing has been saved", () => {
    expect(readRecord(stub())).toEqual(EMPTY_RECORD);
  });

  it("round-trips a record through storage", () => {
    const s = stub();
    const record = {
      best: { higher: { "stats=speed": 7 } },
      topics: { higher: { speed: { asked: 10, correct: 9 } } },
    };
    writeRecord(s, record);
    expect(readRecord(s)).toEqual(record);
  });

  // Stored state is untrusted input, exactly like a hand-edited URL — the same
  // forgiving-parse rule parseView and parseHigher follow.
  it.each([
    ["not json at all", "{{{"],
    ["a bare string", '"hello"'],
    ["null", "null"],
    ["an array", "[1,2,3]"],
    ["the right shape with wrong insides", '{"best":42,"topics":"nope"}'],
  ])("degrades %s to an empty record instead of throwing", (_label, raw) => {
    expect(readRecord(stub({ "statmon:games": raw }))).toEqual(EMPTY_RECORD);
  });

  it("survives a browser that throws on every access", () => {
    expect(readRecord(hostile())).toEqual(EMPTY_RECORD);
    expect(() => writeRecord(hostile(), EMPTY_RECORD)).not.toThrow();
    expect(() => clearRecord(hostile())).not.toThrow();
  });

  it("returns something usable for a storage-less runtime", () => {
    // In the node test environment there is no localStorage, which is also the
    // server-render case — so this is the SSR path as much as the private-mode
    // one.
    expect(readRecord(browserStorage())).toEqual(EMPTY_RECORD);
  });
});

describe("the best streak, keyed by the settings", () => {
  const speedOnly = { ...DEFAULT_SETTINGS, stats: ["speed"] };

  it("keeps a separate best per settings key", () => {
    let record = EMPTY_RECORD;
    const all = settingsKey(DEFAULT_SETTINGS);
    const speed = settingsKey(speedOnly);
    record = recordAnswer(record, {
      game: "higher",
      key: all,
      topic: "hp",
      wasCorrect: true,
      streak: 9,
    });
    record = recordAnswer(record, {
      game: "higher",
      key: speed,
      topic: "speed",
      wasCorrect: true,
      streak: 3,
    });
    expect(bestFor(record, "higher", all)).toBe(9);
    expect(bestFor(record, "higher", speed)).toBe(3);
    expect(bestFor(record, "higher", "never-played")).toBe(0);
  });

  // Both games spell their default settings as the empty string, so without a
  // game namespace the first round of either would overwrite the other's best
  // (D-104).
  it("keeps the two games' records apart at the same settings key", () => {
    let record = EMPTY_RECORD;
    record = recordAnswer(record, {
      game: "higher",
      key: "",
      topic: "speed",
      wasCorrect: true,
      streak: 12,
    });
    record = recordAnswer(record, {
      game: "effective",
      key: "",
      topic: "fire",
      wasCorrect: true,
      streak: 2,
    });
    expect(bestFor(record, "higher", "")).toBe(12);
    expect(bestFor(record, "effective", "")).toBe(2);
    expect(topicAccuracy(record, "higher").map((r) => r.topic)).toEqual([
      "speed",
    ]);
    expect(topicAccuracy(record, "effective").map((r) => r.topic)).toEqual([
      "fire",
    ]);
  });

  it("only ever raises a best", () => {
    let record = EMPTY_RECORD;
    const key = settingsKey(speedOnly);
    record = recordAnswer(record, {
      game: "higher",
      key,
      topic: "speed",
      wasCorrect: true,
      streak: 6,
    });
    // A wrong answer passes the post-answer streak, which is 0 — the saved best
    // must survive the run that ended.
    record = recordAnswer(record, {
      game: "higher",
      key,
      topic: "speed",
      wasCorrect: false,
      streak: 0,
    });
    expect(bestFor(record, "higher", key)).toBe(6);
  });

  // The point of keying by the canonical settings string: the same game always
  // finds its own record, however its chips were clicked (D-098).
  it("finds the same record for the same game built two ways", () => {
    const a = toggleStat(toggleStat(DEFAULT_SETTINGS, "hp"), "attack");
    const b = toggleStat(toggleStat(DEFAULT_SETTINGS, "attack"), "hp");
    expect(settingsKey(a)).toBe(settingsKey(b));
  });

  it("does not mutate the record it is given", () => {
    const before = { best: {}, topics: {} };
    recordAnswer(before, {
      game: "higher",
      key: "k",
      topic: "speed",
      wasCorrect: true,
      streak: 1,
    });
    expect(before).toEqual({ best: {}, topics: {} });
  });
});

describe("the accuracy log", () => {
  const play = (rounds) =>
    rounds.reduce(
      (record, [topic, wasCorrect]) =>
        recordAnswer(record, {
          game: "higher",
          key: "k",
          topic,
          wasCorrect,
          streak: 0,
        }),
      EMPTY_RECORD,
    );

  it("accumulates per stat across every session", () => {
    const record = play([
      ["speed", true],
      ["speed", false],
      ["bst", true],
      ["bst", true],
    ]);
    expect(record.topics.higher).toEqual({
      speed: { asked: 2, correct: 1 },
      bst: { asked: 2, correct: 2 },
    });
  });

  // Worst first, because the list exists to say what to practise — a ranking
  // of your best stat is not something anyone acts on.
  it("sorts worst first, and breaks ties on sample size", () => {
    const record = play([
      ["bst", true],
      ["bst", true],
      ["speed", false],
      ["speed", false],
      ["hp", true],
      ["hp", false],
      ["attack", true],
      ["attack", false],
      ["attack", true],
      ["attack", false],
    ]);
    const log = topicAccuracy(record, "higher");
    expect(log.map((r) => r.topic)).toEqual(["speed", "attack", "hp", "bst"]);
    expect(log[0]).toEqual({ topic: "speed", asked: 2, correct: 0, pct: 0 });
    expect(log.at(-1).pct).toBe(100);
  });

  it("omits a stat that has never been asked rather than showing it at 0%", () => {
    const log = topicAccuracy(play([["speed", true]]), "higher");
    expect(log.map((r) => r.topic)).toEqual(["speed"]);
  });

  it("is empty for an empty record", () => {
    expect(topicAccuracy(EMPTY_RECORD, "higher")).toEqual([]);
    expect(topicAccuracy(EMPTY_RECORD, "effective")).toEqual([]);
  });
});
