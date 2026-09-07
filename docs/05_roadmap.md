# Statmon — Roadmap (Step 5)

_The phased build plan / task checklist: what to implement, in order. Sequenced from the [01_spec](01_spec.md) scope and grounded in the [03_decisions](03_decisions.md) log. Phases 0–4 get to a polished MVP launch; Phases 5+ are the fast-follow and the suite. Check items off as they land._

> Legend: `[x]` done · `[~]` partially done (the remainder is spelled out inline) · `[ ]` not started. Each phase lists an **exit criterion** — the concrete thing that's true when the phase is done.

---

## Current status (2026-09-07 — Session 28, the last pass)

**Done — three consistency tweaks and a review pass** ([D-110](03_decisions.md#d-110)).
The wordmark gained the game bar's hover rather than the game title losing it;
the game title collapses to a mark below `xs`, keeping the control the way the
wordmark keeps its flame; and the boards fit the viewport exactly.

- **The boards were 904px in a 900px window.** `calc(100svh - 7rem)` knew about
  the two 56px bars and not about their two 1px borders. The board takes
  whatever is left now, which removes the arithmetic rather than correcting it.
  Measured after: exactly 900 in 900.
- **The review pass found two defects in that same fix** — two conflicting
  `min-h` utilities in one class string (the D-042 trap), and an `sr-only`
  clause that made a screen reader say the game's name twice.
- Everything else it looked for was clean: no stale references, no icon button
  without a name, no other conflicting utility pairs, and all 23 named text
  styles present on `/style`.

**And one dead link, reported from using it** ([D-111](03_decisions.md#d-111)):
the stat game's thumbnail on `/games` rendered as a disabled `<button>` inside
the card's `<Link>`, so it swallowed every click over the top half of the card.
A panel is a button only when it has a handler now — the rule D-078 already set
for the ability chips.

`npm run check` runs all seven checks in CI's own order.

Vitest is at **412 tests**. The sweep is at **29 routes × 14 widths = 406
checks**, and every game route now measures the viewport exactly.

## Session 27, the boards settle)

**Done — seven notes from playing it, and three of them were one fault of
mine.** [D-107](03_decisions.md#d-107)'s 208px reservation above the answer
buttons was why they sat **~100px below centre**, why the verdict read as "in
between", and why a phone wasted its best space. The verdict moved onto the
attacking panel — the stat game's treatment — and the reservation went with it.
Measured: the buttons are now **1.5px** off the board's centre and still shift
**0px** when a round resolves ([D-109](03_decisions.md#d-109)).

- **The footer comes off the two boards**, which are sized to fill the viewport
  exactly. The cost — Credits is one navigation away there — is stated, and a
  test asserts both its absence on the boards and its presence everywhere else.
- **The artwork caps at 475px**, which is the vendored art's own resolution, so
  the cap only bites where the upscale was visible. It amends
  [D-096](03_decisions.md#d-096), which had let it upscale deliberately.
- **The type game stacks at `md`**: three columns at 480px is a 110px Pokémon.
- **The game's name returns you to the difficulty picker.**
- And the test file's private copy of the route table had no `handle`s, so the
  first assertion that needed one was testing a footer the app does not render.

Vitest is at **410 tests**.

## Session 26, the board fills up)

**Done — six notes from playing it, and five were the same complaint.** The type
game's options sat outside a board that was mostly air, so the answers moved
**into** it: attacker │ answers │ defender, the shape `/compare` has always used
([D-107](03_decisions.md#d-107)). The verdict lands in that middle cell now, the
way the stat game's does.

- **Nothing that appears moves anything.** Three reservations — the middle cell,
  the defender's type-badge band, the icon slot in every answer button — and all
  three measured at **0px shift**. It is the opposite call from
  [D-103](03_decisions.md#d-103), and the difference is that this board had the
  room spare where the stat game's gutter did not.
- **A dual type shows both colours** in both games, audited across all 153 pairs
  at their midpoints (worst: Electric/Ice at 7.23).
- **The games ask how you want to play** ([D-108](03_decisions.md#d-108)) —
  three presets and a Customise door. It reverses "play immediately", and the
  situation is what changed: that game had two knobs and now has six axes.
- **`text-overline-lg`** is the 23rd named style, because the role labels needed
  a size and §5's rule is that the table grows rather than the call site.
- **The sweep needed teaching twice**: its bare game routes now land on the
  start screen, and it was failing WCAG 2.5.8 against a footer link behind an
  open modal — which is inert, and therefore not a target.

Vitest is at **399 tests**. The width sweep is at **29 routes × 14 widths**.

## Session 25, the second game)

**Done — `Effective.` ships, and the games section is complete as specified.**
An attacking type against a defender; name the multiplier. One tier at a time:
Easy is a single defending type, Medium a dual type, Hard a Pokémon whose typing
you recall and whose **randomly drawn ability** you have to read
([D-104](03_decisions.md#d-104)).

- **The sampler picks the answer first**, because uniform sampling is a broken
  quiz: 63% of single-type matchups are 1×. Measured over 4,000 rounds per tier,
  the shipped spread is **25.6 / 23.6 / 25.2 / 25.5%** in Easy — the best single
  guess fell from **63% to 23.6%**.
- **`⅛×` is producible and never asked.** Four Pokémon in the dex reach it, so
  an answer is offered only when 0.1% of the tier's space produces it.
- **No thumb on the scale.** The ability decides the answer in 8.1% of Hard
  rounds, 15.9% once balanced; biasing toward the instructive case was
  considered and declined, with the numbers recorded.
- **An answer leak, caught and guarded.** `AbilityChips`' "changes type
  matchups" dot is information on `/compare` and the answer here — it would have
  killed the Flame-Body-not-Flash-Fire trap entirely. Off until the round
  resolves, with three rendered assertions over twelve random rounds each.
- **The arena did not extract** ([D-105](03_decisions.md#d-105)). Two boards
  that answer differently are two boards; what they share is the board's size,
  the panel's look and the clash, and those live in `gameChrome.jsx` as
  constants — the `chipStyles.jsx` pattern, one rung below where the plan
  expected to apply D-058.
- **The game bar fitted one game's name** ([D-106](03_decisions.md#d-106)):
  "Effective." pushed the Setup button 15px off a 320px screen. Only
  `sweep:widths` was ever going to find that, and it did so within a minute of
  the second caller existing.

Vitest is at **394 tests**. The width sweep is at **22 routes × 14 widths**.

## Session 24, the games take the field)

**Done — `Higher.` is an arena.** The first build was a tool page and it showed:
the settings panel was the biggest thing on screen and the Pokémon were
thumbnails under it. The board now fills the viewport, one full-height panel per
contender, tinted by primary type; the chrome is a 56px bar; and the settings
live in a modal behind it ([D-096](03_decisions.md#d-096)). This is the site's
**second stated exception** to 04_design §1, after Home's sprite wall — and the
argument is narrow: in a tool, chrome competing with the data is a defect; in a
game, the Pokémon _are_ the data.

- **The settings grew into the dex's whole filter vocabulary** — multi-select
  stats, "Introduced in", types, alternate forms, and the `?asof=` lens — reusing
  the dex's parameter names and its parser rather than copying either. "Kanto
  Fire-types only" is a game now. One deliberate inconsistency, stated: an empty
  filter group means "no constraint", but an empty **stat** group means "all of
  them", because the stats are the question space rather than a filter.
- **The verdict stopped covering the answer** ([D-097](03_decisions.md#d-097)).
  Centred absolutely it lands on the divider; stacked, the centre of the board is
  where the top row's values are, so on a phone the card announcing the answer
  hid half of it. It is a real grid row between the halves whenever the board
  stacks.
- **The record is two records** ([D-098](03_decisions.md#d-098)): a best streak
  keyed by the settings themselves — the canonical URL **is** the key, which is
  D-092 paying off in a way nobody predicted — and a lifetime per-stat accuracy
  log, worst first, sitting in the setup panel right above the chips that act on
  it.
- **The sweep can open a disclosure** ([D-099](03_decisions.md#d-099)), so the
  setup dialog is measured at every width — and so, retroactively, is the dex's
  mobile filter panel, unmeasured since the sweep was written. It immediately
  caught a real bug: the arena's entrance animation leaked 32px onto the
  document at four widths.
- **Five notes from playing it** ([D-101](03_decisions.md#d-101)): the clash was
  reweighted (weight is **velocity**, not duration — so the charge got faster and
  further inside a _shorter_ total, and the aftershock went from three small
  ringing bounces to two heavy ones); the question moved to the top of the board
  while the answer stayed centred, because one is chrome and the other is an
  event; the verdict's headline and detail went onto separate lines; the record
  gained the erase button `clearRecord` had been waiting for since it was
  written; and the winner's inset ring learned about its container's corner
  radius.
- **The round change became a clash** ([D-100](03_decisions.md#d-100)) — and
  the report that prompted it ("a quick flash") turned out to name a real bug:
  the gap the two halves close on was filled with the divider's light grey, so
  every round flashed a 64px bar down the middle of a near-black screen. The
  board's background is the page's own black now, the charge is twice as far and
  nearly twice as long, it accelerates, and it recoils on impact.
- **The answer stopped shoving the board** ([D-103](03_decisions.md#d-103)) —
  stacked, the verdict card is 80px taller than the question card, and in a grid
  row that growth moved both Pokémon 40px. The row keeps the question's height
  now and the verdict overlays downward, which is the only direction that does
  not cover the answer with the answer. Two of my own measurements lied on the
  way — `--window-size` is ignored under `--dump-dom`, and a screenshot harness
  clicked a class that D-102 had moved — so the numbers below were re-taken
  against an after-image that was actually verified to be one.
- **The rebound became a shake** ([D-102](03_decisions.md#d-102)) — reported as
  "more like a rebound than a clash", which named the thing two previous passes
  had been tuning instead of fixing. The charge stops dead and each panel's
  **content** shakes inside it, varying per panel so four contenders read as
  four things reacting. On the panels themselves it would have flickered the
  gaps open and shut, which is the D-100 fault at higher frequency.
- **`--dur-base`, `--z-overlay`, `--dur-charge`, `--dur-shake` and `--ease-clash`** — two rungs
  that had documented purposes and no callers, and two new component tokens for
  the clash. `--dur-slow` briefly had a caller and lost it again; the style
  guide's status column is corrected rather than left stale.

Vitest is at **356 tests**; the sweep at **21 routes × 14 widths**;
`audit:contrast` at **ten** groups.

## Session 23 (the games)

**Done — Statmon is a four-tool site.** `/games` ships with **`Higher.`**, the
stat game: two or four Pokémon, one stat, pick the highest, at any generation
([D-091](03_decisions.md#d-091)). The brief's three modes consolidated into two
knobs — "which of these four moves first" is `stat: speed, n: 4`, not a third
code path.

- **The generator is the game, and it was measured before it was written.**
  Random stat pairs **tie 1.2–2.5% of the time** (a round with two right answers)
  and land within five points another ~10% (a coin flip), so `higherQuestion`
  rejects both — and deliberately does not reject easy rounds. The same
  measurement pass found that a uniformly sampled **type** quiz would be **63%
  1×**, which is the constraint `Effective.` is built to take next.
- **The settings are a view; the play-through is not**
  ([D-092](03_decisions.md#d-092)) — the one stated exception to D-022, and it
  pays for itself: `key={higherUrl(settings)}` is the whole implementation of
  "changing the stat starts a new game".
- **Right and wrong with no red/green pair** ([D-093](03_decisions.md#d-093)), on
  D-051's one-loud-state scale. `--color-accent-muted` had been in the palette
  unused since it was written and is now audited as **group 9**.
- **Credits moved to the footer** so Games could have a nav slot
  ([D-094](03_decisions.md#d-094)) — the header's budget is four items, measured,
  and a fifth would have undone D-062.
- **Two faults the work turned up:** `index.html` and `Layout` had been shipping
  two different names for the site under a comment claiming they matched, and
  Home's tools row still carried a "soon" branch nothing used. Both fixed, the
  first now asserted by a test that reads the two files.

Vitest is at **323 tests**. The width sweep is at **18 routes × 14 widths**.

## Session 22 (three faults from using it)

**Done — the kind of faults only using the site finds.** None was visible to any
of the seven checks; all three were found by hand and then reproduced in a real
browser before being fixed.

- **Every click scrolled the page back to the top** — measured, 327px to 0 on
  Swap. `<ScrollRestoration>` keys by history entry, and D-022 makes every
  control a navigation, so each click minted a key with no saved position and
  fell back to the top. Keyed by tool now, and the same fix was owed to the
  focus move, which had been yanking focus out of the chip you just clicked.
  ([D-087](03_decisions.md#d-087))
- **The type grid's cross-hair was fighting paint order** — the row tint painted
  _under_ each cell's own fill, so only the 1px gutter lit up, and the column bar
  painted under every row below the pointer.
  ([D-088](03_decisions.md#d-088))
- **A label sat beside the gutter between two chip rows**, not on the first one.
  ([D-089](03_decisions.md#d-089))
- **And `/style` was caught shipping a hand-copy** of the caption it was meant to
  be demonstrating, already drifted from the real one inside the same session.
  It is a component with two callers now. ([D-090](03_decisions.md#d-090))

Vitest is at **287 tests**.

## Session 21 (the pre-commit review)

**Done — a full review before committing three sessions of work**, half of it by
an independent reviewer that read the diff cold. Every numeric claim in the docs
and comments was re-counted against the dataset, and **four were wrong** — all of
them written in the sessions being reviewed, none caught by any of the seven
checks, because no check reads prose.

- **One real bug, found by fuzzing:** an ability multiplies the chart, so a
  double-resist plus a halving ability lands on **⅛×** — a value `MULT_ORDER`
  did not contain, so `/types` **silently dropped** that attacking type from
  every tier, and the STAB chip printed a bare `0.125×`. Four entries reach it by
  default (Water/Ice with Thick Fat). Fixed and guarded by a whole-dex sweep
  ([D-084](03_decisions.md#d-084)).
- **Documentation faults:** four stacked "Current status" blocks where the file
  allows one, and two superseded decisions ([D-073](03_decisions.md#d-073),
  [D-081](03_decisions.md#d-081)) still stating geometry three sessions out of
  date without the "revised by" note this log's own convention requires.
- **Stale references** to the card's "40px band" in `chipStyles.jsx` and
  `/style`, a chip-family count still reading "three", and Home's tools row left
  on the old section rhythm.

Vitest is at **282 tests**.

## Session 20 (four spacing faults)

**Done — four "looks a bit off" reports, four different mechanical causes**, and
none of them the number it appeared to be ([D-083](03_decisions.md#d-083)). The
controls band was bottom-aligned so its 40px of slack showed between the name
and the chips; Home's STAB pills were **stretched to 122px each** by a flex
column's default `align-items`; the page spent the same 32px on a sticky top
edge and a terminal bottom one; and Home's uniform `mt-28` produced gaps of
**167 / 17 / 205px** because only the dex preview's art climbs above its own
heading. Fixing the fourth complaint also surfaced a real bug — `EmptyCard` was
**674px against its siblings' 618**, a stray head spacer left by
[D-082](03_decisions.md#d-082).

## Session 19 (the controls move off the portrait)

**Done — the chips stopped covering the Pokémon.** Reported as "the ability chips overflow onto Chandelure", and they do not: the band's content is 75px inside an 88px band, and only the four Tauros entries exceed it at all. The fault was positional, and measuring the artwork settled what could be done about it — PokéAPI's official art is tightly cropped, subjects filling **10%–90%** of the square, so no arrangement of chips _within_ the portrait could have avoided the subject ([D-082](03_decisions.md#d-082)). The controls moved above the portrait, into the identity block where form and ability belong anyway, at no cost to card height or the comparison card's top zone. The artwork is re-derived from the vertical window to **280px** — and the smaller artwork shows **more** Pokémon (60% → 72% of the subject at ≥md, 70% → 93% below), because none of it sits behind a chip. Capping it to the portrait window instead was rejected on the record: it would have stopped the art reaching the stat bars, deleting the reason `--color-track-glass` exists.

## Session 18 (the board's second pass)

**Done — three layout bugs that were the same bug.** A component sized by its container instead of its content, three times over, and none of it visible at the widths anyone tests by hand. The STAB chip was the site's only stretched control — `w-full` inside a card that is `md:col-span-2`, so it reached **819px at 900px** to hold ~120px of text; it is now a content-sized pill like every other chip here, **152 / 113px identical from 320 to 1280**, which also finishes [D-058](03_decisions.md#d-058)'s merge since `full` vs `dense` only ever meant bar vs pill ([D-079](03_decisions.md#d-079)). The ability's name left the chip for the group's caption — per-chip attribution was redundant by construction, and was what made a corrected chip 43px tall against its sibling's 32. The card's controls got their names back as one labelled band ([D-080](03_decisions.md#d-080)), and the artwork gained a cap after measuring **718px at 767px** and **476px at 1023px** against a band 232–280px tall ([D-081](03_decisions.md#d-081)). `/style` gained the two chips it was missing.

## Session 17 (abilities)

**Done — the board is right about Levitate.** Roughly **250 of the 1,259 entries** carry an ability that changes what a type does to them, and until now every board was confidently wrong about all of them ([D-073](03_decisions.md#d-073)). The roster and its per-generation history come from PokéAPI in the same `until` shape the stat and type eras already used, at **+8.2 kB gzip** and zero new network requests; the ~20 effectiveness-modifying abilities are a hardcoded table beside the type chart, since their mechanics exist only as prose. Unit tests stand in for the verification the chart gets from the build, and `build:data` checks as much as is checkable — every table key must be a real ability some Pokémon has. The era interaction came free and is load-bearing: **Gengar carried Levitate through Gen 6**, so a Ground STAB into it reads 0× there and 2× today. `/types` gained a Pokémon search on the same engine ([D-075](03_decisions.md#d-075)), which is the missing input method for a tool that could only be asked about typings.

## Session 15 (the consistency & accessibility sweep)

**Done — the site is one system again, and its claims are measured.** A full pass
over consistency, accessibility, responsiveness and the writing.

- **Consistency.** Six page rhythms became two (`pageChrome.jsx`) behind one
  `PageHeader`; `/compare` gained the controls panel the other two tools had; the
  dex's filter chip and the type picker became one `FilterChip`; the two STAB
  pills became one `StabChip`; the dex's real and preview header rows now share
  their geometry. ([D-058](03_decisions.md#d-058))
- **A real AA failure**, found only because merging the two STAB pills put their
  colour pairing in front of `audit:contrast`: the resisted/immune multiplier was
  below AA on **17 of 18 types** and had shipped that way on both surfaces since
  the chip was written. Fixed, and added as group 7 of the audit.
  ([D-058](03_decisions.md#d-058))
- **Three accessibility defects**: the type grid could not be scrolled from a
  keyboard, the nav links had a ~17px hit box, and the dex's controls force-zoomed
  iOS. Plus three `title` tooltips removed, duplicate alt text, and a live region
  for search results. Five regression tests. ([D-065](03_decisions.md#d-065))
- **The comparison board no longer repeats itself on a phone** — one stats
  surface instead of three, verdict first: 2,727px → 2,343px, and the answer moves
  from ~1,550px down the page to ~450px. ([D-057](03_decisions.md#d-057))
- **`npm run sweep:widths`** replaces the manual browser pass: 11 routes × 14
  widths, asserting no horizontal overflow, plus WCAG 2.5.8 target sizes. It
  proved `FormChips` **passes** 2.5.8 (27.1px against 24px needed) — a "likely
  failure" this repo had asserted without measuring for three sessions — and it
  caught the `xs` breakpoint being wrong. ([D-059](03_decisions.md#d-059),
  [D-062](03_decisions.md#d-062))
- **Routes are code-split** and **the fonts are self-hosted**, so the site now
  genuinely makes zero third-party requests. Home: 140.3 → 128.7 kB gzipped.
  ([D-060](03_decisions.md#d-060), [D-061](03_decisions.md#d-061))
- **The writing caught up with the product.** Title, description, OG/Twitter,
  `package.json` and the manifest all named a stat-comparison site with a dex
  bolted on; the type chart appeared in none of them. Plus `robots.txt`,
  `sitemap.xml`, and screenshots that are now **generated** rather than taken by
  hand — `docs/preview.png` was still the launch image, from before two of the
  three tools existed. Scripting that capture then shipped a **wrong** social
  preview (the 1200px OG frame inside a 1280px window, wordmark 40px off centre),
  which is now fixed and, more usefully, **asserted**: `shoot:docs` measures the
  rendered PNG and fails if either social frame is off centre.
  ([D-063](03_decisions.md#d-063), [D-064](03_decisions.md#d-064),
  [D-066](03_decisions.md#d-066))
- **CI**: GitHub Actions runs every check on push and PR.

Vitest is at **213 tests**.

## Session 12–13 (the grid made readable)

**Done — the type chart reads at a glance.** The grid's four cell states had measured 1.00–1.42 apart as fills, so it had to be read rather than scanned; the scale is now one loud state for 2× and three quiet ones, every cell is filled, both axes are colour-coded and square off into the grid, and hovering lights a cell's row and column ([D-052](03_decisions.md#d-052), [D-053](03_decisions.md#d-053)). Marking a selected column is done at its edges rather than with a wash, because a wash strong enough to see puts the multiplier under AA. Fixing it also uncovered a page-level horizontal scroll the grid had leaked since it shipped, which only `contain: paint` stops — the browser sweep now runs **ten widths** instead of three, because 390 / 768 / 1280 were all clean while 600 and 700 were not. Vitest is at **206 tests**.

## Session 11 (the type chart)

**Done — Statmon is a three-tool site.** `/types` ships the full 18×18 effectiveness matrix **and** a dual-type readout in one page ([D-051](03_decisions.md#d-051)), the thing other sites split across a page per pairing. It carries the same `?asof=` lens — the chart itself changed six times, so a Gen 1 chart is 15×15 with Ghost doing nothing to Psychic. Home's tools chip is live and the tool ships with its preview (Bug/Fire — the mascot's 4× Rock).

## Session 10 (layout polish)

**Done — the generation strip is always on screen.** It used to appear with the first selection, which pushed the comparison board down the page ([D-050](03_decisions.md#d-050)); it is now unconditional on both tools, and on the dex it leads the controls panel above a divider instead of floating on the background. The dex's origin filter is renamed **"Introduced in"** — two generation controls in one panel needed distinguishing — and hides when a lens leaves it one option. A smoke assertion across every route now catches a prop that quietly stopped being passed — which is how `/style` was found still handing the strip its pre-rename prop names.

## Session 9 (the dex as of a generation)

**Done — both tools read history.** `/dex` now takes the same generation lens as the comparison board, and on a table it does more: **"as of Gen 3" caps the rows too** ([D-049](03_decisions.md#d-049)), so it is a 392-row dex of what existed then, ranked on that generation's values. Gen 1 is 151 rows with five stat columns and a sortable **Special**. The filters narrow with the lens, and the lens is `?asof=` on **both** tools — `/dex`'s `?gen=` keeps meaning the origin filter, which is a different axis.

**Done — one chip vocabulary, and the playground stops keeping copies.** The colour half of a toggle chip lives once in `components/chipStyles.jsx`; the three chip families keep only their geometry ([D-048](03_decisions.md#d-048)). `/style` renders all three side by side, and imports `TYPES` instead of restating it — it had been carrying a fourth hand-written copy of the 18, which a test now makes impossible.

**Done — the comparison tool reads history.** `/compare` can now be read **as of an earlier generation** ([D-045](03_decisions.md#d-045)–[D-047](03_decisions.md#d-047)): Generation 1's five stats with a single **Special**, historical base stats and typings, and that generation's own type chart. One control covers both cases — a strip of numbered chips beside Swap, one per generation the two selected Pokémon **both existed in**, with a dot marking the generations that differ from today ([D-046](03_decisions.md#d-046)). The generation lives in the URL (`?asof=`) like every other view on this site. The dataset gained `statEras` / `typeEras` / `introducedIn` (+1.1 kB gzipped) from PokéAPI's `past_*` fields, and `npm run build:data` now verifies the hardcoded type chart against PokéAPI across all three eras.

**Done — Statmon is a two-tool site, and Home advertises both.** Every feature now ships with a live preview on Home ([D-043](03_decisions.md#d-043)) — a rule, a `FeaturePreview` component, and a line in each tool's checklist below. The **full-dex stats table** shipped at `/dex` ([D-039](03_decisions.md#d-039)): all 1,259 entries, sortable on every stat, multi-select filterable by type and generation ([D-040](03_decisions.md#d-040)), with alternate forms toggleable (hidden by default since [D-056](03_decisions.md#d-056)) — windowed so only ~26 rows are ever in the DOM. The foundation work it depended on landed first ([D-038](03_decisions.md#d-038)): scroll + focus reset on navigation (closing the last [D-024](03_decisions.md#d-024) item), per-route `<title>`s, and **Vitest** with 94 tests.

**Done — the MVP is live.** Phases 0–4 are complete: a polished, multi-page, self-contained, WCAG-AA site, responsive from phone to desktop, deployed on Cloudflare Workers at **https://statmon.noahparknguyen.workers.dev/**. The one Phase-4 item intentionally left for later is the optional SSR/framework-mode upgrade (per-route meta).

- **Phases 0–2:** plain Vite + React (JS) + Tailwind v4 CSS-first tokens; build-time data pipeline → **1,259 entries**; design-system primitives (22 named text styles, shared `Button` / `CmpRow` / `CmpStatCard` / `SpeedBanner`).
- **Phase 3 — comparison tool:** search, two hero cards with form switching, the comparison card (BST summary, STAB matchup, mirrored **type-colored** diffs, speed banner), swap.
- **Phase 3.5 — routing:** React Router **v8** (data mode); shared `Layout` (header/nav/footer + `main`); routes `/` Home, `/compare` (+ `/compare/<p1>/vs/<p2>`), `/dex`, `/credits`, `/style`, `*` 404; **URL is the single source of truth** ([D-022](03_decisions.md#d-022), `src/lib/compareUrl.js`).
- **Phase 4:** **Home** product-as-hero (live Volcarona-vs-Chandelure board, blunt suite copy, corner mascot sprites, tools row — _the hero has since been replaced by a sprite wall, [D-070](03_decisions.md#d-070)_) + blunt **Credits** ([D-023](03_decisions.md#d-023)); **image vendoring** — 2,513 sprites/artwork self-hosted + committed ([D-025](03_decisions.md#d-025)); **meta/favicons/OG** incl. the HTML-rendered OG generator `docs/og-image.html` ([D-026](03_decisions.md#d-026)); **accessibility** — skip link + landmarks ([D-024](03_decisions.md#d-024)) and a full **WCAG-AA contrast audit** with a reproducible checker ([D-027](03_decisions.md#d-027)); **mobile per-stat layout** — `ComparisonCard` + `FeaturedComparison` collapse to stacked per-stat cards below 768px ([D-010](03_decisions.md#d-010), [D-029](03_decisions.md#d-029)); the MIT `LICENSE` and a personal-credit footer line are in ([D-029](03_decisions.md#d-029)); **deployed** to Cloudflare Workers as static assets, with absolute OG URLs set ([D-030](03_decisions.md#d-030)).

**Deferred (optional, post-MVP):** the React Router **framework/SSR mode** upgrade ([D-005](03_decisions.md#d-005), [D-022](03_decisions.md#d-022)) — the data-mode config migrates cleanly. It would add **per-route `<title>`/meta**; the site-level OG/meta is already set with absolute URLs. Not required for the MVP — revisit if per-comparison social unfurls become worth it.

**Launch-pass leftovers:** all done — personal-credit line + `LICENSE` ([D-029](03_decisions.md#d-029)), the OG image (`public/og-image.png`), and the production deploy ([D-030](03_decisions.md#d-030)). _(The 1280×640 GitHub social frame is already exported to `docs/preview.png`; it still needs uploading by hand at repo Settings → Social preview, which is a GitHub-side setting and not something the repo can carry.)_

**npm scripts:** `dev` · `build` · `test` / `test:run` · `build:data` · `vendor:images` (after `build:data`) · `vendor:fonts` · `audit:contrast` · `check:docs` · `sweep:widths` · `shoot:docs` · `lint` · `format` · `format:check` · `preview` · `deploy` (`build` + `wrangler deploy`).

**The seven checks that must stay green:** `npm run check` runs all of them, in this order — `lint`, `format:check`, `test:run`, `build`, `audit:contrast`, `check:docs`, `sweep:widths`. Cheapest first, so a typo fails in seconds rather than after the browser sweep, and the order is CI's own. All seven run in CI on every push and PR (`.github/workflows/ci.yml`); the sweep needs `build` first and a Chrome binary (`CHROME_PATH` to override).

**Reading a past generation (D-045, D-049):** all of the resolution logic is pure functions in `src/lib/eras.js` — `eraView(pokemon, gen)` returns `{ gen, keys, stats, bst, types }`, `generationOptions([p1, p2])` returns the generations both existed in (each flagged for whether it differs from today), and `dexGenerations()` is the dex's plainer equivalent. The dex layers `statKeysFor` / `sortKeysFor` / `typesFor` / `generationsFor` / `setAsOf` on top in `lib/dexTable.js`, so the columns, the sort keys and the filter chips all narrow together. The lens is `?asof=` on both tools; the dex's `?gen=` is the unrelated origin filter. Home and `/style` stay current-generation. `STAT_ORDER` is still exactly the modern six; Gen 1's `special` lives outside it because the stored stat array's order depends on it. The dex, Home and `/style` are all deliberately current-generation.

**Notes:** `StatBar.jsx` is **deleted**. It was kept "for the future stats table", but the dex table did not use it — a table cell is not a label·bar·value row ([D-039](03_decisions.md#d-039)) — leaving it a playground specimen with no claimant, which is what this note flagged. Its `/style` section went with it. The dataset ships in the compact form defined by `src/lib/pokemonCodec.js` and is decoded at import ([D-036](03_decisions.md#d-036)) — read/write it through the codec, never as raw JSON. Shared primitives as of [D-032](03_decisions.md#d-032): `CmpRow` (desktop mirrored row + diff cell) and `CmpStatCard` (mobile per-stat card) are used by **both** `ComparisonCard` and Home's `FeaturedComparison`; `SpeedBanner` and `Button` are shared across the site. The dex adds `DexRow` (used by both the table and Home's preview) with its geometry in `components/dexColumns.jsx`, and `FeaturePreview` — the shell every Home preview is built from ([D-043](03_decisions.md#d-043)). Shared _styling_ constants live in their own `.jsx` modules for the reasons in [D-048](03_decisions.md#d-048): `components/dexColumns.jsx` (table geometry) and `components/chipStyles.jsx` (the one colour pair behind all four chip families). New tools should build on these rather than re-rolling them.

---

## Phase 0 — Foundation & Scaffolding

_Goal: a minimal, running local app with the styling system wired up. Start simple — no Cloudflare, no router yet. ([D-013](03_decisions.md#d-013))_

- [x] Scaffold a **plain Vite + React (JavaScript)** app: `npm create vite@latest statmon -- --template react`. ([D-013](03_decisions.md#d-013), [D-014](03_decisions.md#d-014))
- [x] Add **Tailwind** (v4, `@tailwindcss/vite`).
- [x] Finalize the **style guide** ([06_style_guide](06_style_guide.md)) and translate it into the **Tailwind theme + design tokens** in `src/index.css` (colors, 11-step type scale, named text styles — 17 at the time, 22 today, radii, breakpoints, motion) — everything token-driven from here on.
- [x] Wire fonts (Space Grotesk + Inter) and page meta in `index.html`.
- [x] Confirm local dev + build run clean (`npm run dev` / `npm run build`).
- [x] Set up the repo: `.gitignore`, license (MIT), README, commit hygiene; published to GitHub.

**Exit:** a blank, on-brand Statmon app runs locally with the full token system available in Tailwind. (Cloudflare deploy + routing come later — see Phase 3.5 and Phase 4.)

---

## Phase 1 — Data Pipeline

_Goal: a local JSON dataset + sprites, generated on command. No UI yet._

- [x] Write the **build-time fetch script** (`scripts/build-data.mjs`) hitting `/pokemon-species` + `/pokemon`, rate-limited + cached + retrying. ([D-001](03_decisions.md#d-001), [D-016](03_decisions.md#d-016))
- [x] Transform to the slim schema from [01_spec §4](01_spec.md): id, slug, name, types, six stats, bst, generation, `forms`, `isDefault`, sprite/artwork URLs.
- [x] Cover **all generations — the full National Dex** — via the species list (no hardcoded gen cap). ([D-009](03_decisions.md#d-009))
- [x] Handle **Megas/regional/battle forms** as first-class entries with counterpart refs; skip cosmetic (stat+type-identical) forms. ([D-003](03_decisions.md#d-003))
- [x] Normalize to the **six-stat schema**; precompute BST. ([D-004](03_decisions.md#d-004))
- [x] Built-in **validation summary** (counts per generation, missing stats/sprites, form groups).
- [x] **Run** `npm run build:data` — verified: 1,259 entries, 0 missing stats, gen counts sum correctly, 414 with alt-forms (incl. the new Legends Z-A Megas). 3 entries lack a pixel sprite (pikachu-starter, eevee-starter, zygarde-mega) but have artwork → search thumbnail falls back to `spriteUrl ?? artworkUrl`.
- [x] **Vendor images** from `PokeAPI/sprites` — self-hosted **both** pixel sprites (`public/sprites/{id}.png`) and official artwork (`public/artwork/{id}.webp`, ≤475px); URL fields rewritten to local paths with `spriteUrl ?? artworkUrl` fallback; committed. Run via `npm run vendor:images` (`scripts/vendor-images.mjs`). ([D-002](03_decisions.md#d-002), [D-025](03_decisions.md#d-025))
- [x] ~~Generate the **type → color** map (18 types)~~ — **not built, by design.** The 18 colors ship as `--color-type-*` CSS tokens read through `typeColorVar()`; a parallel JSON copy would be a second source of truth for zero gain. Closed as won't-do ([04_design §3](04_design.md), [01_spec §4](01_spec.md)).

**Exit:** `npm run build:data` produces a validated `src/data/pokemon.json` the app can import; sprites vendored locally.

---

## Phase 2 — Design System

_Goal: turn the tokens (already in Tailwind from Phase 0) into reusable component primitives. Design is pre-specified in [04_design](04_design.md) + [06_style_guide](06_style_guide.md), so this phase is implementation, not decision-making._

- [x] Implement the **named text styles** (`text-h1`, `text-stat`, …) as utilities per [06_style_guide §5](06_style_guide.md).
- [x] Wire the **18 type colors** as tokens (`--color-type-*` + `typeColorVar`); contrast-checks completed ([D-027](03_decisions.md#d-027)) — all pass AA via `npm run audit:contrast`.
- [x] Build core primitives: `StatBar`, buttons, search input, type badge — all token-driven.
- [x] **Accessibility baseline** ([D-020](03_decisions.md#d-020)): landmarks (`main`/`search`), heading semantics, combobox ARIA, focus rings, alt text, reduced-motion.

**Exit:** a component playground renders the tokens and a static `StatBar` correctly, matching the [preview mockup].

---

## Phase 3 — Comparison Tool (MVP core)

_Goal: the actual product works._

- [x] **Search-as-you-type** over the local dataset (prefix-ranked), dropdown with sprite + name + type badges, keyboard nav. ([01_spec §2](01_spec.md)) — `SearchBar`
- [x] Results list with **pixel-sprite thumbnails**.
- [x] Two **selection slots** (Pokémon 1 / Pokémon 2) with a clean empty state. — `Compare` + `PokemonCard` empty state
- [x] Render the **six stat bars**, type-colored (primary type), per Pokémon. — `StatBar`
- [x] Compute and show **per-stat difference** (centered magnitude + caret toward winner). — `ComparisonCard`
- [x] **BST** per Pokémon + BST-delta in the referee.
- [x] **Speed verdict** ("X is faster"), vector icon.
- [x] TCG-style **Pokémon cards** flanking a center **referee**; responsive (referee drops below on small screens, D-010).
- [x] **Form selector** — toggle chips (Base · Mega X · …) that instantly swap art + stats for Pokémon with alternate forms. ([D-017](03_decisions.md#d-017)) — `FormChips`
- [x] **Hero-backdrop cards** (art as scrim'd backdrop) + full **comparison card** (mirrored bars). ([D-017](03_decisions.md#d-017))
- [x] **Swap** button (P1 ↔ P2). ([D-018](03_decisions.md#d-018))
- [x] **Type matchup** in the comparison card (attacker STAB vs defender typing, dual-type aware). ([D-018](03_decisions.md#d-018)) — `lib/typeChart.js` — _pulled forward from Phase 5_
- [x] Sync selection to the URL so a comparison can be copied/shared — done in Phase 3.5 as full path-based deep links (URL is the source of truth, [D-022](03_decisions.md#d-022)); the interim "query only, no router" step was skipped.

**Exit:** a user can search, pick two Pokémon, read a correct and attractive comparison, and share a link to it. ✅

---

## Phase 3.5 — Routing & Multi-Page

_Goal: introduce React Router now that a second page/route is actually needed. ([D-013](03_decisions.md#d-013))_

- [x] Add **React Router** (v8, data mode) and define routes (Home, Comparison, Credits, 404 + `/style` playground). ([D-022](03_decisions.md#d-022))
- [x] Promote the comparison to a proper **path-based deep link** (`/compare/<p1>/vs/<p2>`); URL is the single source of truth, with a query-param fallback for partial one-slot state.
- [x] Shared layout shell (`Layout`: sticky brand/nav header + `<main>` + attribution footer) across routes.

**Exit:** the app is multi-page with clean, shareable per-comparison URLs. ✅ (SSR/Cloudflare still deferred to Phase 4 launch.)

---

## Phase 4 — Pages, Polish & Launch

_Goal: a complete, showcase-ready site. This is where the **Cloudflare Workers/Wrangler** deploy layer is added (and React Router's Cloudflare/SSR mode, if adopted) — the end-state from [D-005](03_decisions.md#d-005)._

- [x] **Home** page: product-as-hero (live Volcarona vs Chandelure board), blunt suite-framed copy, corner mascot sprites, tools row. ([D-023](03_decisions.md#d-023)) _Since rebuilt: every tool is named ([D-067](03_decisions.md#d-067)) and the page now opens on a full-bleed sprite wall, which reverses product-as-hero ([D-070](03_decisions.md#d-070)). The board and the mascots are still there, one section down._
- [x] **Credits** page: PokéAPI + sprite attribution, GitHub link (blunt pass). ([D-023](03_decisions.md#d-023))
- [x] **404** page, on-brand (built in Phase 3.5).
- [x] **Meta/SEO** (site-level): favicons + web manifest + theme-color, description, Open Graph + Twitter tags; OG image generated from `docs/og-image.html` → `public/og-image.png`. ([D-026](03_decisions.md#d-026)) — absolute OG/Twitter URLs set at deploy ([D-030](03_decisions.md#d-030)); _per-route titles/meta still await SSR_
- [x] **Logo + wordmark** — the flame Poké Ball favicon + "Statmon." wordmark serve as the mark (header + OG image).
- [x] **Accessibility pass**: keyboard, labels, alt text, skip link ([D-024](03_decisions.md#d-024)); full type-color **contrast audit** to AA with a reproducible checker ([D-027](03_decisions.md#d-027), `npm run audit:contrast`).
- [x] Implement the **mobile layout**: per-stat cards under 768px. ([D-010](03_decisions.md#d-010), [D-029](03_decisions.md#d-029))
- [x] Add the **Cloudflare Workers + Wrangler** deploy layer — shipped as a **static-assets SPA** (no Worker code); SSR adapter deferred (optional). ([D-005](03_decisions.md#d-005), [D-030](03_decisions.md#d-030))
- [x] Polished **README** and `/docs` up to date.
- [x] Final **Cloudflare production deploy** — live at https://statmon.noahparknguyen.workers.dev/. ([D-030](03_decisions.md#d-030))

**Exit:** MVP is live, looks great, works on phone and desktop, and the repo is presentable. 🎉 **✅ Done 2026-07-29.**

---

## Phase 5 — Fast-Follow (V2)

_Goal: sharpen the core and add the low-cost, high-value extras._

- [x] ~~**`FormChips` touch targets** — the one likely WCAG 2.5.8 (AA) spacing failure on the site.~~ **Closed as not-a-failure.** Measured rather than assumed, the chips pass via 2.5.8's spacing exception: 45–59 × 21px with a tightest neighbouring centre of **27.1px** against the 24px required, including Minior's eight-form wrapped worst case. It was a guess that had propagated into two documents and this checklist. `npm run sweep:widths` measures it every run, since the margin is only 3px. ([D-059](03_decisions.md#d-059), [D-042](03_decisions.md#d-042))
- [ ] Attacker-identity read (physical vs. special).
- [ ] Biggest-gap highlight.
- [x] **Type-effectiveness** between the two Pokémon — **shipped early** in Phase 3 as the attacker-STAB matchup on the comparison card, on the hardcoded `src/lib/typeChart.js` matrix ([D-018](03_decisions.md#d-018)).
- [x] **Generation-accurate stats** — Gen 1's single Special, historical base stats and typings, and per-generation type charts, behind one generation strip on `/compare` ([D-045](03_decisions.md#d-045), [D-046](03_decisions.md#d-046), [D-047](03_decisions.md#d-047)). _Not on the original V2 list — it came out of actually playing the games the project is about._
- [~] Bar-fill **animation** (reduced-motion aware) — **partially shipped:** `.animate-grow-w` runs on Home, on both the `FeaturedComparison` board ([D-023](03_decisions.md#d-023)) and now the dex preview's stat fills, via a `DexRow` `animate` prop the real table deliberately does not pass ([D-067](03_decisions.md#d-067)). The `/compare` tool's own bars still render instantly; extending it there is what remains.
- [ ] Copy-link button, **random matchup**, full keyboard flow.
- [ ] Search **filters** (type / generation), recently-compared list.
- [ ] **About** page; **light-mode** toggle.
- [~] Tooling — **ESLint + Prettier are both in** (flat ESLint config + `npm run lint`; Prettier as a devDependency with `npm run format` / `format:check`, whole tree passing on stock config). **Vitest is in** ([D-038](03_decisions.md#d-038)): 94 tests across six files — the stat math, the type-matchup engine, dataset queries, the codec (including the whole-dataset round-trip), the dex sort/filter/URL logic, and a `react-dom/server` smoke test of every route — node environment, no jsdom. **GitHub Actions CI is in** (`.github/workflows/ci.yml`): every check runs on push and PR, cheapest-first, ending with the browser sweep. **Playwright** and auto-deploy to Cloudflare are still outstanding — though `scripts/sweep-widths.mjs` now covers, headlessly and without a framework, the specific thing Playwright was wanted for: real layout measurement across widths.

**Exit:** the comparison tool feels finished and the repo has real engineering rigor.

---

## Phase 6+ — The Suite (Someday)

_Goal: grow Statmon into a small family of tools & games, one clean addition at a time. Near-term priorities firmed in [D-023](03_decisions.md#d-023) — all reuse the existing data layer + type engine, so each is an addition, not a rewrite. The Home tools row already advertises them ("soon")._

> **Definition of done for every tool below:** it ships with a **live preview on Home** ([D-043](03_decisions.md#d-043)) — a `FeaturePreview` section built from the tool's own components against real data, not a mockup. A tool is not finished until Home advertises it.

**Near-term (the suite the Home page promises):**

- [x] **Full-dex stats table** — shipped at `/dex` ([D-039](03_decisions.md#d-039)), with its Home preview ([D-043](03_decisions.md#d-043)). Every Pokémon in one table, **sortable** on all six stats + BST + name + dex number, **searchable** by name, **filterable** by any number of types and generations at once ([D-040](03_decisions.md#d-040)), with alternate forms toggleable; pixel sprite per row and a type-tinted proportional fill behind each stat. The whole view lives in the URL, so a sorted, filtered dex is a shareable link. Windowed rendering keeps ~26 rows in the DOM out of 1,259. _(It did not reuse `StatBar.jsx` — see Notes above.)_
- [x] **Type chart** — shipped at `/types` ([D-051](03_decisions.md#d-051)): the 18×18 grid, **dual-type aware** via a tier readout, generation-aware, with its Home preview. Built on `lib/typeChart.js` as predicted, plus `lib/typeView.js` for the URL and the tiers.
- [x] **Abilities** — shipped ([D-073](03_decisions.md#d-073), [D-074](03_decisions.md#d-074), [D-075](03_decisions.md#d-075)). Both halves landed, plus a third the plan did not have.

  1. **Shown.** Every Pokémon's roster on its comparison card, hidden ability marked, selectable the way alternate forms are — `AbilityChips` is `FormChips`' pattern. The chosen ability is in the URL as `?a1=`/`?a2=`, omitted at the default like everything else.
  2. **They change the matchup.** `/compare/krookodile/vs/eelektross` scored Ground at 2× and now scores it **0×**, because Eelektross has Levitate. The ~20 effectiveness-modifying abilities are a hardcoded table beside `lib/typeChart.js`, feeding `effectiveness()` alongside the era's chart.
  3. **`/types` gained a Pokémon search** — not planned here, but the same dataset made it the obvious next question: the page could only be asked about a _typing_, so "what beats Corviknight" meant looking its typing up elsewhere first. The Pokémon rides on `?as=`, validated against the path rather than trusted ([D-075](03_decisions.md#d-075)).

  **What the research settled, and what it got wrong.** The roster and its history did come straight from PokéAPI in the `until` shape `lib/eras.js` already read, and the effect table did have to be hardcoded — but [02_research §13](02_research.md#13-abilities-for-the-planned-abilities-feature)'s candidate list included **Wind Rider, which is not a type ability at all** (it evades _wind_ moves), and abilities whose multipliers are outside the chart's vocabulary. Corrected there, with the membership rule that replaced the list.

  **The verification gap turned out to be narrower than feared.** The semantics still cannot be checked against PokéAPI — but `build:data` now fails if any slug in the table is not a real ability some Pokémon has, and `abilities.test.js` carries the rest against Bulbapedia's values.

  **The era interaction paid for itself.** Abilities arrive in **Gen III**, so a Gen 1 or Gen 2 board shows none — and better, **Gengar carried Levitate through Gen VI**, so `?asof=6` genuinely changes the answer. Two abilities (Lightning Rod, Storm Drain) also needed a `since`: they only redirected until Gen 5.

  _Home advertises both halves: the flagship board now shows Chandelure's Flash Fire zeroing Volcarona's Fire STAB, and the type preview shows Krookodile by name ([D-043](03_decisions.md#d-043))._

- [x] **Games** — the section shipped, with both planned games in it ([D-091](03_decisions.md#d-091)). _Mienshao's reservation ([D-068](03_decisions.md#d-068)) is spent: it flanks the Home preview._

  1. [x] **`Higher.`** (`/games/higher`) — two or four Pokémon, one stat, pick the highest, on a full-height arena ([D-096](03_decisions.md#d-096)). Configurable from a setup modal with the dex's own filters — multi-select stats, origin generations, types, alternate forms — plus the `?asof=` lens, so a Gen 1 game is 151 Pokémon with five stats and a Special. Question generation is a tested `lib/games.js` with an injected `rng`; the best streak and a per-stat accuracy log persist in `localStorage` ([D-098](03_decisions.md#d-098)); every round ends with a link into `/compare` or `/dex`.
  2. [x] **`Effective.`** (`/games/effective`) — an attacking type against a single type, a dual type, or a **Pokémon**, answered on the multiplier ladder (`formatMult`, `MULT_ORDER`). The defender axis _is_ the difficulty ladder, one tier at a time, so the answer buttons are a property of the tier and never leak a round. Abilities are always in play and drawn at random. The **answer is sampled first** — the measured spread and the 0.1% answer floor are in [D-104](03_decisions.md#d-104).

  _The session reducer, the settings-in-URL rule and the resolved-round treatment are all already shared, so the second game is a page rather than a system._

**Later:**

- [ ] **Type coverage / weakness calculator** (reuses the matchup matrix).
- [ ] **Speed-tier tool.**
- [ ] More **games** — "Guess the Pokémon by its stats," "Higher/Lower BST," silhouette guess, daily puzzle.
- [ ] **Team builder / analyzer.**
- [x] **Era-aware dex table** — sort the whole dex as of a chosen generation ("who was fastest in Gen 1"), with the rows capped to what existed then ([D-049](03_decisions.md#d-049)).
- [ ] **Keep data current** as new Pokémon/generations release (re-run the parameterized pipeline).
- [ ] Stretch: EV/IV planner, Nuzlocke helper, dex trackers, per-comparison OG images.

**Exit:** none — this is the living backlog Statmon grows into.

---

## Dependency Notes

- Phases 0 → 1 → 2 → 3 → 4 are largely **sequential** (each needs the prior). Phase 2 (design) can overlap Phase 1 (data) since they don't touch the same files.
- The **type-effectiveness matrix** (Phase 5) is a prerequisite for several Phase 6 tools — worth building cleanly when it first appears.
- Keep [03_decisions](03_decisions.md) updated as provisional calls (fonts, gen scope, mobile) get firmed up during Phases 2–4.
