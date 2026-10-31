// The pages worth looking at, for the two scripts that look at the whole site:
// `sweep-widths.mjs` measures each one, and `shoot-phone.mjs` photographs each
// one. One list, so a page added for one is never missing from the other.

const ROUTES = [
  "/",
  "/compare",
  "/compare/volcarona/vs/chandelure",
  "/compare/charizard/vs/blastoise?asof=1",
  // The widest ability roster in the dex (38 characters over three chips), and
  // the older-generation case that renders a corrected STAB chip: the two
  // shapes the card's 88px controls band has to hold.
  "/compare/hydrapple/vs/happiny",
  "/compare/krookodile/vs/gengar?asof=6",
  "/dex",
  "/dex?asof=1",
  "/types",
  "/types/water/flying",
  "/types/electric?as=eelektross",
  "/games",
  // A bare game route is the start screen, so the boards need routes with
  // settings to be measured.
  "/games/higher?stats=speed",
  "/games/higher",
  // Four contenders is the widest a round gets, and it's the layout that
  // stacks into a 2×2 below `lg`, where the verdict card has to sit between
  // the rows rather than on top of them.
  "/games/higher?stats=speed&n=4",
  // A heavily filtered game: the narrowest pool the setup panel can produce
  // that still plays, and a Gen 1 lens, which changes the stat chips under it.
  "/games/higher?stats=speed&gen=1&type=water",
  "/games/higher?asof=1",
  // One route per tier: the answer column changes width with the tier, and the
  // hard board is the only one carrying artwork and an ability pill.
  "/games/effective",
  "/games/effective?tier=easy",
  "/games/effective?tier=medium",
  "/games/effective?tier=hard",
  "/games/effective?tier=hard&type=ghost&asof=5",
  // Panels that only exist after a click: the games' setup dialogue and the
  // dex's phone sort and filter sheet. Each is opened by clicking its button first.
  // The setup dialogue, opened from a game in progress, so it needs a URL with
  // settings, since a bare one is the start screen. Both games, because their
  // panels hold different groups.
  ["/games/higher?stats=speed", "Setup"],
  ["/games/effective?tier=hard", "Setup"],
  // And from the start screen, which is the other way in.
  ["/games/higher", "Customise"],
  ["/dex", "Sort & filter"],
  // A phone's comparison opens its own two dialogs: the full-screen picker from
  // an empty tile, and the ability sheet from the defender's ability chip.
  ["/compare", "Choose Pokémon 1"],
  ["/compare/volcarona/vs/chandelure", "Flash Fire"],
  // The picker again, from a filled tile: what it shows before you type. Charizard
  // has four forms, the widest row of them on a common board.
  ["/compare/charizard/vs/blastoise", "Charizard"],
  "/credits",
  "/style",
  "/no-such-page",
];

// A route is either a path, or a path plus the visible text of a button to
// click first, which is how a disclosure or a modal gets looked at at all. The
// label keeps the two apart in a report.
export const ENTRIES = ROUTES.map((r) =>
  Array.isArray(r)
    ? { route: r[0], open: r[1], label: `${r[0]} [${r[1]}]` }
    : { route: r, open: null, label: r },
);
